sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.BudgetPrevisionel", {

        preparePrevisionelTreeData: function () {
            var self = this;

            var previsionel = this.getView().getModel("utilities").getProperty("/previsionel");

            if (previsionel && previsionel.length > 0 && previsionel[0].DataMode) {
                this.getView().getModel("utilities").setProperty("/DataMode", previsionel[0].DataMode);
            } else {
                this.getView().getModel("utilities").setProperty("/DataMode", "A");
            }

            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                // === CONFIGURATION D'ÉDITION ===
                var editableConfig = self.getEditableMonthsConfig();

                items.forEach(function (item) {
                    item.isTotalRow = false;

                    // === Applique la configuration d'édition ===
                    Object.keys(editableConfig.N).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N[key];
                    });
                    Object.keys(editableConfig.N1).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N1[key];
                    });

                    // === Calcule FinAffaire ===
                    item.FinAffaire = (Number(item.VoyageDeplacement) || 0) +
                        (Number(item.AutresFrais) || 0) +
                        (Number(item.CreancesDouteuses) || 0) +
                        (Number(item.EtudesTravaux) || 0) +
                        (Number(item.SinistreContentieux) || 0) +
                        (Number(item.AleasDivers) || 0);

                    // === SET MEANINGFUL DISPLAY NAMES ===
                    if (item.Regroupement !== "FGA0" || (item.MissionId !== "FGA0" && !item.isNode)) {
                        // For data lines, create descriptive names using available properties
                        if (item.Description && item.Description !== item.MissionId) {
                            item.name = item.FacturationDepense + " - " + item.Description;
                        } else if (item.Libelle && item.Libelle !== item.MissionId && item.Libelle !== "Affaire" + item.MissionId) {
                            item.name = item.FacturationDepense + " - " + item.Libelle;
                        } else {
                            item.name = item.FacturationDepense + " - " + item.MissionId;
                        }
                    } else {
                        // For header nodes, use MissionId
                        item.name = item.MissionId || "FGA0";
                    }

                    // === Initialise le groupe BusinessNo ===
                    if (!fgaGroups[item.BusinessNo]) {
                        fgaGroups[item.BusinessNo] = {
                            businessNo: item.BusinessNo,
                            rootNode: null,
                            directLines: {
                                facturation: [],
                                depense: []
                            },
                            missions: {}
                        };
                    }

                    var fgaGroup = fgaGroups[item.BusinessNo];

                    // === CAS 1 : LIGNE PRINCIPALE FGA0 ===
                    if (item.Regroupement === "FGA0") {
                        // Check if this is the FGA0 header node or a data line
                        if (item.MissionId === "FGA0" || item.isNode) {
                            // This is the FGA0 header node
                            item.isNode = true;
                            item.isL0 = true;
                            fgaGroup.rootNode = item;
                            fgaGroup.rootNode.children = [];
                            item.name = item.MissionId || "FGA0";
                        } else {
                            // This is a data line under FGA0 - add to direct lines
                            var lineType = (item.FacturationDepense || "").toLowerCase();
                            if (lineType === "facturation") {
                                fgaGroup.directLines.facturation.push(item);
                            } else if (lineType === "dépense" || lineType === "depense") {
                                fgaGroup.directLines.depense.push(item);
                            }
                        }
                    }
                    // === CAS 2 : AUTRES MISSIONS DANS LES REGROUPEMENTS ===
                    else {
                        // Create mission level if it doesn't exist
                        if (!fgaGroup.missions[item.MissionId]) {
                            fgaGroup.missions[item.MissionId] = {
                                name: item.MissionId,
                                description: item.Description,
                                isNode: true,
                                isL1: true,
                                regroupement: item.Regroupement,
                                facturationLines: [],
                                depenseLines: [],
                                totals: self._createEmptyMonthlyTotals()
                            };
                        }

                        var mission = fgaGroup.missions[item.MissionId];

                        // Separate lines by Facturation/Depense
                        var lineType = (item.FacturationDepense || "").toLowerCase();
                        if (lineType === "facturation") {
                            mission.facturationLines.push(item);
                        } else if (lineType === "dépense" || lineType === "depense") {
                            mission.depenseLines.push(item);
                        }

                        // Cumulate totals for the mission
                        mission.totals.ResteAFacturer += Number(item.ResteAFacturer) || 0;
                        mission.totals.ResteADepenser += Number(item.ResteADepenser) || 0;
                        mission.totals.TotalN += Number(item.TotalN) || 0;
                        mission.totals.TotalN1 += Number(item.TotalN1) || 0;
                        mission.totals.Audela += Number(item.Audela) || 0;

                        // Cumulate months for year N
                        [
                            "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                            "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN"
                        ].forEach(function (month) {
                            mission.totals[month] += Number(item[month]) || 0;
                        });

                        // Cumulate months for year N+1
                        [
                            "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                            "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"
                        ].forEach(function (month) {
                            mission.totals[month] += Number(item[month]) || 0;
                        });
                    }
                });

                // === CONSTRUCTION DE L'ARBRE FINAL ===
                for (var fga in fgaGroups) {
                    var group = fgaGroups[fga];
                    var rootChildren = [];

                    // === ADD DIRECT LINES UNDER FGA0 ===
                    // Add direct Facturation lines section
                    if (group.directLines.facturation.length > 0) {
                        rootChildren.push({
                            name: "Lignes directes Facturation",
                            isNode: true,
                            isL1: true,
                            isSectionHeader: true,
                            FacturationDepense: "Facturation",
                            /*children: group.directLines.facturation.concat(
                                self.createMissionTypeTotalRow(group.directLines.facturation, "Facturation", "directes")
                            )*/
                            children: group.directLines.facturation
                        });
                    }

                    // Add direct Dépense lines section
                    if (group.directLines.depense.length > 0) {
                        rootChildren.push({
                            name: "Lignes directes Dépense",
                            isNode: true,
                            isL1: true,
                            isSectionHeader: true,
                            FacturationDepense: "Dépense",
                            /*children: group.directLines.depense.concat(
                                self.createMissionTypeTotalRow(group.directLines.depense, "Dépense", "directes")
                            )*/
                            children: group.directLines.depense

                        });
                    }

                    // === ADD MISSIONS GROUPED BY REGROUPEMENT ===
                    // Build missions array with proper hierarchy
                    var missionsArray = [];
                    for (var missionKey in group.missions) {
                        if (group.missions.hasOwnProperty(missionKey)) {
                            var mission = group.missions[missionKey];

                            // Create mission children array
                            mission.children = [];

                            // Add Facturation section header if there are facturation lines
                            if (mission.facturationLines.length > 0) {
                                mission.children.push({
                                    name: "Lignes Facturation",
                                    isNode: true,
                                    isL2: true,
                                    isSectionHeader: true,
                                    FacturationDepense: "Facturation",
                                    children: mission.facturationLines
                                });

                                // Add Facturation total
                                /*mission.children.push(
                                    self.createMissionTypeTotalRow(mission.facturationLines, "Facturation", mission.name)
                                );*/
                            }

                            // Add Dépense section header if there are depense lines
                            if (mission.depenseLines.length > 0) {
                                mission.children.push({
                                    name: "Lignes Dépense",
                                    isNode: true,
                                    isL2: true,
                                    isSectionHeader: true,
                                    FacturationDepense: "Dépense",
                                    children: mission.depenseLines
                                });

                                // Add Dépense total
                                /*mission.children.push(
                                    self.createMissionTypeTotalRow(mission.depenseLines, "Dépense", mission.name)
                                );*/
                            }

                            // Add Mission total
                            /*mission.children.push(
                                self.createMissionTotalRow(mission.totals, mission.name)
                            );*/

                            missionsArray.push(mission);
                        }
                    }

                    // Group missions by Regroupement
                    var regroupementGroups = {};
                    missionsArray.forEach(function (mission) {
                        if (!regroupementGroups[mission.regroupement]) {
                            regroupementGroups[mission.regroupement] = {
                                name: mission.regroupement,
                                isNode: true,
                                isL1: true,
                                children: [],
                                totals: self._createEmptyMonthlyTotals()
                            };
                        }
                        regroupementGroups[mission.regroupement].children.push(mission);

                        // Cumulate regroupement totals
                        var regGroup = regroupementGroups[mission.regroupement];
                        Object.keys(mission.totals).forEach(function (key) {
                            regGroup.totals[key] += mission.totals[key] || 0;
                        });
                    });

                    // Add regroupement totals and append to root children
                    for (var regKey in regroupementGroups) {
                        if (regroupementGroups.hasOwnProperty(regKey)) {
                            var regroupement = regroupementGroups[regKey];
                            regroupement.children.push(
                                self.createRegroupementTotalRow(regroupement.totals, regKey)
                            );
                            rootChildren.push(regroupement);
                        }
                    }

                    // If FGA0 root exists, use it as root with all children
                    if (group.rootNode) {
                        group.rootNode.children = rootChildren;
                        treeData.push(group.rootNode);
                    } else {
                        // Otherwise create default business node
                        treeData.push({
                            name: group.businessNo,
                            FacturationDepense: "Affaire",
                            isNode: true,
                            isL0: true,
                            children: rootChildren
                        });
                    }
                }

                return treeData;

            };

            // Build trees
            var previsionelTreeData = buildTree(previsionel);

            // Calculate global totals
            var globalTotals = this.calculateGlobalTotals(previsionelTreeData);

            // Create summary rows
            var summaryRows = [
                this.createSummaryRow("Total facturation", globalTotals.totalFacturation, false),
                this.createSummaryRow("Total dépense", globalTotals.totalDepense, false)
            ];

            // Add summary rows to root
            previsionelTreeData = previsionelTreeData.concat(summaryRows);

            // Set tree
            this.getView().getModel("utilities").setProperty("/previsionelHierarchyWithTotals", previsionelTreeData);

            var totalRows = this.countRows(previsionelTreeData);
            this.updateRowCountPrev(totalRows);

        },

        // Helper function to create mission type totals (Facturation/Dépense)
        createMissionTypeTotalRow: function (lines, type, missionName) {
            var totals = this._createEmptyMonthlyTotals();

            lines.forEach(function (item) {
                totals.ResteAFacturer += Number(item.ResteAFacturer) || 0;
                totals.ResteADepenser += Number(item.ResteADepenser) || 0;
                totals.TotalN += Number(item.TotalN) || 0;
                totals.TotalN1 += Number(item.TotalN1) || 0;
                totals.Audela += Number(item.Audela) || 0;

                // Sum months
                [
                    "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                    "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN",
                    "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                    "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"
                ].forEach(function (month) {
                    totals[month] += Number(item[month]) || 0;
                });
            });

            const row = {
                name: "Total " + type,
                FacturationDepense: type,
                isTotalRow: true,
                isNode: false,
                isMissionTypeTotal: true,
                // Add specific properties for Reste à facturer/dépenser
                ResteAFacturer: type === "Facturation" ? totals.ResteAFacturer : 0,
                ResteADepenser: type === "Dépense" ? totals.ResteADepenser : 0
            };

            Object.keys(totals).forEach(k => {
                row[k] = Number(totals[k]) || 0;
            });

            return row;
        },

        // Helper function to create mission total
        createMissionTotalRow: function (totals, missionName) {
            const row = {
                name: "Total Mission",
                isTotalRow: true,
                isNode: false,
                isMissionTotal: true,
                FacturationDepense: "Total Mission",
                // Include Reste à facturer/dépenser
                ResteAFacturer: totals.ResteAFacturer,
                ResteADepenser: totals.ResteADepenser
            };

            Object.keys(totals).forEach(k => {
                row[k] = Number(totals[k]) || 0;
            });

            return row;
        },

        // Keep existing helper methods unchanged
        _createEmptyMonthlyTotals: function () {
            return {
                JanvN: 0, FevrN: 0, MarsN: 0, AvrN: 0, MaiN: 0, JuinN: 0,
                JuilN: 0, AoutN: 0, SeptN: 0, OctN: 0, NovN: 0, DecN: 0,
                JanvN1: 0, FevrN1: 0, MarsN1: 0, AvrN1: 0, MaiN1: 0, JuinN1: 0,
                JuilN1: 0, AoutN1: 0, SeptN1: 0, OctN1: 0, NovN1: 0, DecN1: 0,
                ResteAFacturer: 0, ResteADepenser: 0, TotalN: 0, TotalN1: 0, Audela: 0
            };
        },

        createRegroupementTotalRow: function (totals, regroupementName) {
            const row = {
                name: "Total " + regroupementName,
                isTotalRow: true,
                isNode: false,
                isRegroupementTotal: true,
                // Include Reste à facturer/dépenser
                ResteAFacturer: totals.ResteAFacturer,
                ResteADepenser: totals.ResteADepenser
            };

            // Copie tous les champs numériques (mois + totaux)
            Object.keys(totals).forEach(k => {
                row[k] = Number(totals[k]) || 0;
            });

            return row;
        },


        _createEmptyMonthlyTotals: function () {
            return {
                // Mois année N
                JanvN: 0, FevrN: 0, MarsN: 0, AvrN: 0, MaiN: 0, JuinN: 0,
                JuilN: 0, AoutN: 0, SeptN: 0, OctN: 0, NovN: 0, DecN: 0,

                // Mois année N+1
                JanvN1: 0, FevrN1: 0, MarsN1: 0, AvrN1: 0, MaiN1: 0, JuinN1: 0,
                JuilN1: 0, AoutN1: 0, SeptN1: 0, OctN1: 0, NovN1: 0, DecN1: 0,

                // Totaux globaux
                ResteAFacturer: 0,
                ResteADepenser: 0,
                TotalN: 0,
                TotalN1: 0,
                Audela: 0
            };
        },

        // Configuration des mois editables
        getEditableMonthsConfig: function () {

            const period = this.getView().getModel("utilities").getProperty("/period"); // e.g. "102025"
            const periodMonth = parseInt(period.substring(0, 2), 10); // "10" → 10
            const periodYear = parseInt(period.substring(2, 6), 10);  // "2025" → 2025

            const nextYear = periodYear + 1;

            // Save these years for bindings
            const utilitiesModel = this.getView().getModel("utilities");
            utilitiesModel.setProperty("/currentYear", periodYear);
            utilitiesModel.setProperty("/nextYear", nextYear);

            const currentMonth = periodMonth;
            const currentYear = periodYear;


            var config = {
                // Pour l'année N, seuls les mois futurs sont editables
                N: {
                    JanvN: currentMonth < 1,
                    FevrN: currentMonth < 2,
                    MarsN: currentMonth < 3,
                    AvrN: currentMonth < 4,
                    MaiN: currentMonth < 5,
                    JuinN: currentMonth < 6,
                    JuilN: currentMonth < 7,
                    AoutN: currentMonth < 8,
                    SeptN: currentMonth < 9,
                    OctN: currentMonth < 10,
                    NovN: currentMonth < 11,
                    DecN: currentMonth < 12
                },
                // Pour l'année N+1, tout est toujours editable
                N1: {
                    JanvN1: true,
                    FevrN1: true,
                    MarsN1: true,
                    AvrN1: true,
                    MaiN1: true,
                    JuinN1: true,
                    JuilN1: true,
                    AoutN1: true,
                    SeptN1: true,
                    OctN1: true,
                    NovN1: true,
                    DecN1: true
                }
            };

            return config;
        },


        updateTotals: function () {
            var oModel = this.oView.getModel("utilities");
            var aData = oModel.getProperty("/previsionelHierarchyWithTotals");

            var aTreeData = aData.filter(function (oItem) {
                return !oItem.isTotalRow;
            });

            aTreeData.forEach(function (fgaGroup) {

                var regroupementEntries = [];

                for (var regroupementKey in fgaGroup.children) {
                    if (fgaGroup.children.hasOwnProperty(regroupementKey)) {
                        var regroupement = fgaGroup.children[regroupementKey];
                        regroupementEntries.push({
                            name: regroupement.name,
                            data: regroupement
                        });
                    }
                }

                // Now process each regroupement
                fgaGroup.children = regroupementEntries.map(function (entry) {
                    var regroupement = entry.data;

                    // Reset totals
                    regroupement.totals = this._createEmptyMonthlyTotals();

                    // Recalculate totals
                    // Recalculate totals
                    regroupement.children.forEach(function (item) {
                        if (!item.isTotalRow) {

                            regroupement.totals.ResteAFacturer += Number(item.ResteAFacturer) || 0;
                            regroupement.totals.ResteADepenser += Number(item.ResteADepenser) || 0;
                            regroupement.totals.TotalN += Number(item.TotalN) || 0;
                            regroupement.totals.TotalN1 += Number(item.TotalN1) || 0;
                            regroupement.totals.Audela += Number(item.Audela) || 0;

                            // Sum months N
                            [
                                "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                                "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN"
                            ].forEach(function (month) {
                                regroupement.totals[month] += Number(item[month]) || 0;
                            });

                            // Sum months N+1
                            [
                                "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                                "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"
                            ].forEach(function (month) {
                                regroupement.totals[month] += Number(item[month]) || 0;
                            });
                        }
                    });


                    // Update the regroupement total row
                    var existingTotalIndex = regroupement.children.findIndex(function (child) {
                        return child.isRegroupementTotal;
                    });

                    var totalRow = this.createRegroupementTotalRow(regroupement.totals, entry.name);

                    if (existingTotalIndex >= 0) {
                        regroupement.children[existingTotalIndex] = totalRow;
                    } else {
                        regroupement.children.push(totalRow);
                    }

                    return regroupement;
                }.bind(this));
            }.bind(this));

            // Calculate new global totals
            var globalTotals = this.calculateGlobalTotals(aTreeData);

            // Create new summary rows
            // Create flat summary rows (level 0)
            var summaryRows = [
                this.createSummaryRow("Total facturation", globalTotals.totalFacturation, false),
                this.createSummaryRow("Total dépense", globalTotals.totalDepense, false)
            ];



            // Update the model
            oModel.setProperty("/previsionelHierarchyWithTotals", aTreeData.concat(summaryRows));
        },

        createRegroupementTotalRow: function (totals, regroupementName) {
            const row = {
                name: "Total " + regroupementName,
                isTotalRow: true,
                isNode: false,
                isRegroupementTotal: true
            };

            // Copie tous les champs numériques (mois + totaux)
            /*Object.keys(totals).forEach(k => {
                row[k] = Number(totals[k]) || 0;

            });*/

            Object.keys(totals).forEach(k => {
                const value = Number(totals[k]) || 0;
                // Round to 2 decimal places to avoid floating-point errors
                row[k] = Math.round(value * 100) / 100;
            });

            return row;
        },



        calculateGlobalTotals: function (items) {
            const totals = {
                totalFacturation: this._createEmptyMonthlyTotals(),
                totalDepense: this._createEmptyMonthlyTotals()
            };

            const sumValues = (node) => {
                if (node.children && node.children.length > 0) {
                    node.children.forEach(sumValues);
                    return;
                }

                // Skip nodes, section headers, and total rows for accumulation
                if (node.isNode || node.isSectionHeader || node.isTotalRow) return;

                const type = (node.FacturationDepense || "").toLowerCase();
                const target =
                    type === "facturation"
                        ? totals.totalFacturation
                        : type === "dépense" || type === "depense"
                            ? totals.totalDepense
                            : null;

                if (target) {
                    // Sum all properties including Reste à facturer/dépenser
                    for (const key in target) {
                        if (target.hasOwnProperty(key)) {
                            target[key] += Number(node[key]) || 0;
                        }
                    }
                }
            };

            items.forEach(sumValues);
            return totals;
        },

        _createEmptyTotals: function () {
            return {
                ResteAFacturer: 0,
                ResteADepenser: 0,
                TotalN: 0,
                TotalN1: 0,
                Audela: 0
            };
        },

        createSummaryRow: function (name, values, isPercentage = false, decimals = 2) {
            const fmt = (v) => {
                const n = Number(v) || 0;
                return isPercentage ? n.toFixed(decimals) + "%" : Number(n.toFixed(decimals));
            };

            let facturationDepense = "";
            if (name.toLowerCase().includes("facturation")) {
                facturationDepense = "Facturation";
            } else if (name.toLowerCase().includes("dépense") || name.toLowerCase().includes("depense")) {
                facturationDepense = "Dépense";
            } else {
                facturationDepense = "Total général";
            }

            const row = {
                name: name,
                FacturationDepense: facturationDepense,
                isTotalRow: true,
                isNode: false,
                isRegroupementTotal: false,
                // Include Reste à facturer/dépenser
                ResteAFacturer: values.ResteAFacturer,
                ResteADepenser: values.ResteADepenser
            };

            // Copy ALL values including monthly data
            Object.keys(values).forEach(k => {
                row[k] = fmt(values[k]);
            });

            return row;
        },


        updateRowCountPrev: function (rowCount) {

            if (!this.getView().getModel("localModel")) {
                this.getView().setModel(new JSONModel({
                    tableSettings: {
                        minRowCount: 5
                    }
                }), "localModel");
            }

            this.getView().getModel("localModel").setProperty("/tableSettings/minRowCountPrev",
                Math.max(rowCount, 1));
        },

        countRows: function (nodes) {
            if (!nodes || nodes.length === 0) return 0;

            var count = 0;
            nodes.forEach(function (node) {
                count++;
                if (node.isNode && !node.isL0) {
                    //count++; // Add 1 for the line total
                }
                if (node.children && node.children.length > 0) {
                    count += this.countRows(node.children);
                }
            }.bind(this));

            // Add 4 lines for global totals 
            if (nodes[0] && nodes[0].isL0) {
                count += 2;
            }

            return count;
        },


        _hasManualChangesPrevisionel: function (utilitiesModel, oModel) {
            // 1. Check for changes ONLY in the utilities model (JSONModel), not the main OData model
            const pendingChanges = utilitiesModel.getPendingChanges && utilitiesModel.getPendingChanges();
            if (pendingChanges && Object.keys(pendingChanges).length > 0) {
                console.log("Pending changes in utilities model:", pendingChanges);
                return true;
            }

            // 2. Check for modifications in hierarchical data
            const previsionelData = utilitiesModel.getProperty("/previsionel");
            const previsionelHierarchy = utilitiesModel.getProperty("/previsionelHierarchyWithTotals");

            console.log("=== Manual Changes Check ===");
            console.log("Original data lines:", previsionelData?.length);
            console.log("Hierarchy data structure:", previsionelHierarchy);

            console.log("=== DEBUG COMPARISON INPUT ===");
            console.log("Original flat previsionel:", previsionelData?.length, previsionelData?.[0]);
            console.log("Hierarchy tree root:", previsionelHierarchy?.length, previsionelHierarchy?.[0]);

            return this._checkHierarchyChanges(previsionelData, previsionelHierarchy);
        },

        _filterPrevisionelChanges: function (pendingChanges) {
            const relevantChanges = {};

            // Only include changes that are related to previsionel data
            // Adjust these patterns based on your entity names
            const previsionelPatterns = [
                '/ZC_FGA_Forecast',  // Adjust to your actual entity name
                '/previsionel',
                '/Previsionel',
                'MissionId',
                'BusinessNo'
            ];

            for (const [key, value] of Object.entries(pendingChanges)) {
                // Check if this change is related to previsionel data
                const isRelevant = previsionelPatterns.some(pattern =>
                    key.includes(pattern) ||
                    (value && typeof value === 'object' && value.MissionId)
                );

                if (isRelevant) {
                    relevantChanges[key] = value;
                }
            }

            return relevantChanges;
        },

        _debugHierarchyStructure: function () {
            const utilitiesModel = this.getView().getModel("utilities");
            const hierarchyData = utilitiesModel.getProperty("/previsionelHierarchyWithTotals");

            console.log("=== DEBUG HIERARCHY STRUCTURE ===");

            const traverseAndLog = (nodes, level = 0) => {
                if (!nodes) return;
                const indent = "  ".repeat(level);

                nodes.forEach((node, index) => {
                    const props = [
                        `name: ${node.name}`,
                        `MissionId: ${node.MissionId}`,
                        `isNode: ${node.isNode}`,
                        `isTotalRow: ${node.isTotalRow}`,
                        `isSectionHeader: ${node.isSectionHeader}`,
                        `OctN: ${node.OctN}`
                    ].filter(Boolean).join(", ");

                    console.log(`${indent}[${index}] ${props}`);

                    if (node.children) {
                        traverseAndLog(node.children, level + 1);
                    }
                });
            };

            traverseAndLog(hierarchyData);
        },

        _debugManualChanges: function () {
            const utilitiesModel = this.getView().getModel("utilities");
            const oModel = this.getView().getModel();

            console.log("=== DEBUG MANUAL CHANGES ===");

            // 1. Check pending changes
            const pendingChanges = oModel.getPendingChanges();
            console.log("1. Pending changes:", pendingChanges);

            // 2. Get both datasets
            const previsionelData = utilitiesModel.getProperty("/previsionel");
            const previsionelHierarchy = utilitiesModel.getProperty("/previsionelHierarchyWithTotals");

            console.log("2. Data counts - Original:", previsionelData?.length, "Hierarchy:", previsionelHierarchy?.length);

            // 3. Check the specific MissionId that was changed
            const missionId = "MED1XXXXXXXX-00221-000";
            const originalLine = previsionelData?.find(d => d.MissionId === missionId);
            const hierarchyLine = this._findDataLineInHierarchy(previsionelHierarchy, missionId);

            console.log("3. Specific line comparison for MissionId:", missionId);
            console.log("   Original OctN:", originalLine?.OctN);
            console.log("   Hierarchy OctN:", hierarchyLine?.OctN);
            console.log("   Are they equal?", originalLine?.OctN === hierarchyLine?.OctN);

            // 4. Check if hierarchy has the change
            console.log("4. Hierarchy data structure:");
            this._logHierarchyStructure(previsionelHierarchy);

            return this._checkHierarchyChanges(previsionelData, previsionelHierarchy);
        },

        _findDataLineInHierarchy: function (hierarchy, missionId) {
            const traverse = (nodes) => {
                if (!nodes) return null;
                for (let node of nodes) {
                    // Look for actual data lines (not totals, nodes, etc.)
                    if (node.MissionId === missionId &&
                        !node.isTotalRow &&
                        !node.isNode &&
                        !node.isSectionHeader) {
                        return node;
                    }
                    if (node.children) {
                        const found = traverse(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            return traverse(hierarchy);
        },

        _logHierarchyStructure: function (hierarchy) {
            const traverse = (nodes, level = 0) => {
                if (!nodes) return;
                const indent = "  ".repeat(level);
                nodes.forEach(node => {
                    console.log(`${indent}${node.name} (MissionId: ${node.MissionId}, isNode: ${node.isNode}, isTotalRow: ${node.isTotalRow}, OctN: ${node.OctN})`);
                    if (node.children) {
                        traverse(node.children, level + 1);
                    }
                });
            };
            traverse(hierarchy);
        },

        _debugSpecificMission: function () {
            const utilitiesModel = this.getView().getModel("utilities");
            const previsionelData = utilitiesModel.getProperty("/previsionel");
            const previsionelHierarchy = utilitiesModel.getProperty("/previsionelHierarchyWithTotals");

            const missionId = "MED1XXXXXXXX-00221-000"; // The one that should have OctN changed

            console.log("=== DEBUG SPECIFIC MISSION ===");
            console.log("Looking for MissionId:", missionId);

            // Find in original data
            const originalLine = previsionelData.find(d => d.MissionId === missionId);
            console.log("Found in original:", !!originalLine);
            if (originalLine) {
                console.log("Original OctN:", originalLine.OctN);
            }

            // Find in hierarchy
            const findInHierarchy = (nodes, targetMissionId) => {
                for (const node of nodes) {
                    if (node.MissionId === targetMissionId &&
                        !node.isTotalRow &&
                        !node.isNode &&
                        !node.isSectionHeader) {
                        return node;
                    }
                    if (node.children) {
                        const found = findInHierarchy(node.children, targetMissionId);
                        if (found) return found;
                    }
                }
                return null;
            };

            const hierarchyLine = findInHierarchy(previsionelHierarchy, missionId);
            console.log("Found in hierarchy:", !!hierarchyLine);
            if (hierarchyLine) {
                console.log("Hierarchy OctN:", hierarchyLine.OctN);
            }

            if (originalLine && hierarchyLine) {
                console.log("COMPARISON RESULT:");
                console.log("OctN values equal?", originalLine.OctN === hierarchyLine.OctN);
                console.log("Numeric OctN values equal?",
                    Number(originalLine.OctN) === Number(hierarchyLine.OctN));
            }
        },

        _checkHierarchyChanges: function (originalData, hierarchyData) {
            if (!originalData || !hierarchyData) return false;

            const numericFields = [
                "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN",
                "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1",
                "ResteAFacturer", "ResteADepenser", "TotalN", "TotalN1", "Audela"
            ];

            // Extract data lines from hierarchy
            const extractDataLines = (nodes, result = []) => {
                if (!Array.isArray(nodes)) return result;
                for (const node of nodes) {
                    const isData =
                        node.MissionId &&
                        !node.isTotalRow &&
                        !node.isNode &&
                        !node.isSectionHeader &&
                        !node.isRegroupementTotal;

                    if (isData) {
                        result.push(node);
                    }

                    if (Array.isArray(node.children) && node.children.length > 0) {
                        extractDataLines(node.children, result);
                    }
                }
                return result;
            };

            const hierarchyLines = extractDataLines(hierarchyData);
            console.log("Extracted data lines from hierarchy:", hierarchyLines.length);

            // Debug: Show all MissionIds in both datasets
            console.log("Original MissionIds:", originalData.map(d => d.MissionId));
            console.log("Hierarchy MissionIds:", hierarchyLines.map(d => d.MissionId));

            // Create a map of original data by MissionId for quick lookup
            const originalMap = new Map();
            originalData.forEach(item => {
                if (item.MissionId) {
                    originalMap.set(item.MissionId, item);
                }
            });

            // DEBUG: Check the specific MissionId that should have changes
            // Use the first MissionId from hierarchy that exists in both datasets
            const targetMissionId = hierarchyLines.find(h => originalMap.has(h.MissionId))?.MissionId;
            console.log("=== DEBUG TARGET MISSION ===");
            console.log("Target MissionId:", targetMissionId);

            if (targetMissionId) {
                const originalTarget = originalMap.get(targetMissionId);
                const hierarchyTarget = hierarchyLines.find(h => h.MissionId === targetMissionId);

                console.log("Original target found:", !!originalTarget);
                console.log("Hierarchy target found:", !!hierarchyTarget);

                if (originalTarget && hierarchyTarget) {
                    console.log("Original OctN:", originalTarget.OctN, "Type:", typeof originalTarget.OctN);
                    console.log("Hierarchy OctN:", hierarchyTarget.OctN, "Type:", typeof hierarchyTarget.OctN);
                    console.log("String comparison:", originalTarget.OctN === hierarchyTarget.OctN);
                    console.log("Numeric comparison:", Number(originalTarget.OctN) === Number(hierarchyTarget.OctN));

                    // Check all fields for this specific mission
                    for (const field of numericFields) {
                        const originalValue = Number(originalTarget[field]) || 0;
                        const hierarchyValue = Number(hierarchyTarget[field]) || 0;
                        if (originalValue !== hierarchyValue) {
                            console.log(`🚨 FIELD CHANGE: ${field} - Original: ${originalValue}, Hierarchy: ${hierarchyValue}`);
                        }
                    }
                }
            }

            // Compare each hierarchy line with its original counterpart
            let hasChanges = false;

            for (const editedLine of hierarchyLines) {
                if (!editedLine.MissionId) continue;

                const originalLine = originalMap.get(editedLine.MissionId);

                if (!originalLine) {
                    console.log(`MissionId ${editedLine.MissionId} not found in original data`);
                    continue;
                }

                // Compare all numeric fields
                for (const field of numericFields) {
                    const originalValue = Number(originalLine[field]) || 0;
                    const editedValue = Number(editedLine[field]) || 0;

                    if (originalValue !== editedValue) {
                        console.log(`CHANGE DETECTED: ${field} for ${editedLine.MissionId}`);
                        console.log(`   Original: ${originalValue} (${originalLine[field]})`);
                        console.log(`   Edited: ${editedValue} (${editedLine[field]})`);
                        hasChanges = true;
                        break; // Found a change, no need to check other fields
                    }
                }

                if (hasChanges) break; // Found a change, no need to check other lines
            }

            if (!hasChanges) {
                console.log(" No manual changes detected");
            }

            return hasChanges;
        },

        onSubmit: function (oEvent) {
            var self = this;
            var utilitiesModel = this.getView().getModel("utilities");

            // Get the period to determine current month
            var period = utilitiesModel.getProperty("/period");
            var periodMonth = parseInt(period.substring(0, 2), 10);
            var currentYear = parseInt(period.substring(2, 6), 10);

            // Get the input field that triggered the submit
            var sourceInput = oEvent.getSource();
            var bindingContext = sourceInput.getBindingContext("utilities");

            if (!bindingContext) {
                console.error("No binding context found for the submitted input");
                return;
            }

            // Get the path and property that was changed
            var path = bindingContext.getPath();
            var property = sourceInput.getBindingPath("value");
            var fieldName = property;

            console.log("Field changed:", fieldName, "for path:", path);

            // Get the current hierarchy data to find which line was edited
            var hierarchyData = utilitiesModel.getProperty("/previsionelHierarchyWithTotals");

            if (!hierarchyData || !Array.isArray(hierarchyData)) {
                console.error("No hierarchy data found");
                return;
            }

            // Find the specific data line that was edited in hierarchy
            var editedLineInfo = this._findDataLineByPath(hierarchyData, path);

            if (!editedLineInfo || !editedLineInfo.line) {
                console.error("Could not find the edited line in hierarchy data");
                return;
            }

            var editedHierarchyLine = editedLineInfo.line;
            console.log("Found edited line in hierarchy:", editedHierarchyLine.name, "MissionId:", editedHierarchyLine.MissionId);

            // Get the flat data (original source)
            var flatData = utilitiesModel.getProperty("/previsionel");

            if (!flatData || !Array.isArray(flatData)) {
                console.error("No flat data found");
                return;
            }

            // Find the corresponding line in flat data
            var flatLineIndex = flatData.findIndex(function (item) {
                return item.MissionId === editedHierarchyLine.MissionId &&
                    item.FacturationDepense === editedHierarchyLine.FacturationDepense;
            });

            if (flatLineIndex === -1) {
                console.error("Could not find corresponding line in flat data");
                return;
            }

            var editedFlatLine = flatData[flatLineIndex];
            console.log("Found corresponding line in flat data at index:", flatLineIndex);

            // Determine which months should be reset
            var monthsToReset = this._getMonthsToReset(periodMonth, fieldName, currentYear);
            console.log("Months to reset:", monthsToReset);

            // Store the new value for the edited field (it's already updated in the hierarchy via data binding)
            var newValue = editedHierarchyLine[fieldName];
            console.log("New value for", fieldName, ":", newValue);

            // Update the flat data with the new value for the edited field
            editedFlatLine[fieldName] = newValue;

            // SET DATA MODE TO 'M' (MANUAL) ONLY FOR THIS SPECIFIC LINE
            editedFlatLine.DataMode = "M";
            console.log("Set DataMode to 'M' for line:", editedFlatLine.MissionId);

            // Reset the specified months to zero in the flat data
            var hasChanges = false;
            monthsToReset.forEach(function (monthField) {
                if (editedFlatLine[monthField] !== 0 && editedFlatLine[monthField] !== "0") {
                    console.log("Resetting", monthField, "from", editedFlatLine[monthField], "to 0 in flat data");
                    editedFlatLine[monthField] = 0;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                console.log("Flat data after changes:", editedFlatLine);

                // Update the flat data model
                utilitiesModel.setProperty("/previsionel", flatData);

                // REBUILD THE ENTIRE TREE with the updated flat data
                this.preparePrevisionelTreeData();

                // Show message to user
                sap.m.MessageToast.show("Ligne passée en mode manuel. Les mois suivants ont été réinitialisés à zéro: " + monthsToReset.join(", "));
            }
        },

        // Simple path finder that works with your tree structure
        _findDataLineByPath: function (nodes, targetPath) {
            // Extract the indices from the path
            // Path format: /previsionelHierarchyWithTotals/0/children/1/children/0/children/2
            var pathParts = targetPath.split('/').filter(part => part !== '');

            if (pathParts.length < 3 || pathParts[0] !== 'previsionelHierarchyWithTotals') {
                return null;
            }

            // Remove the model prefix
            pathParts = pathParts.slice(1);

            try {
                var currentNode = nodes;

                for (var i = 0; i < pathParts.length; i++) {
                    var part = pathParts[i];

                    if (part === 'children') {
                        // Skip the 'children' part and move to the index
                        continue;
                    }

                    var index = parseInt(part, 10);

                    if (isNaN(index) || !currentNode || !Array.isArray(currentNode) || index >= currentNode.length) {
                        console.error("Invalid path index:", index, "at part:", part);
                        return null;
                    }

                    currentNode = currentNode[index];

                    // If this is the last part, return the node
                    if (i === pathParts.length - 1) {
                        return { line: currentNode, path: targetPath };
                    }

                    // Move to children for next iteration
                    if (currentNode.children && Array.isArray(currentNode.children)) {
                        currentNode = currentNode.children;
                    } else {
                        console.error("No children found at path part:", part);
                        return null;
                    }
                }
            } catch (error) {
                console.error("Error traversing path:", error);
                return null;
            }

            return null;
        },

        // Get months to reset based on period and edited field
        _getMonthsToReset: function (currentMonth, editedField, currentYear) {
            var monthFieldsN = [
                "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN"
            ];

            var monthFieldsN1 = [
                "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"
            ];

            var monthsToReset = [];

            var isCurrentYearField = editedField.includes("N") && !editedField.includes("N1");
            var isNextYearField = editedField.includes("N1");

            if (isCurrentYearField) {
                // For current year: reset from current month to December, excluding edited field
                for (var i = currentMonth; i <= 12; i++) {
                    var monthField = monthFieldsN[i - 1];
                    if (monthField !== editedField) {
                        monthsToReset.push(monthField);
                    }
                }

                // Also reset ALL months for next year (N+1)
                monthsToReset = monthsToReset.concat(monthFieldsN1);

            } else if (isNextYearField) {
                // For next year: find which month was edited in N+1
                var editedMonthIndex = monthFieldsN1.indexOf(editedField);
                if (editedMonthIndex !== -1) {
                    // Reset all subsequent months in N+1, excluding edited field
                    for (var j = editedMonthIndex + 1; j < monthFieldsN1.length; j++) {
                        monthsToReset.push(monthFieldsN1[j]);
                    }
                }
            }

            return monthsToReset;
        },

    });
});