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
                            children: group.directLines.facturation.concat(
                                self.createMissionTypeTotalRow(group.directLines.facturation, "Facturation", "directes")
                            )
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
                            children: group.directLines.depense.concat(
                                self.createMissionTypeTotalRow(group.directLines.depense, "Dépense", "directes")
                            )
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
                                mission.children.push(
                                    self.createMissionTypeTotalRow(mission.facturationLines, "Facturation", mission.name)
                                );
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
                                mission.children.push(
                                    self.createMissionTypeTotalRow(mission.depenseLines, "Dépense", mission.name)
                                );
                            }

                            // Add Mission total
                            mission.children.push(
                                self.createMissionTotalRow(mission.totals, mission.name)
                            );

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
            this.updateRowCount(totalRows);
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

        preparePrevisionelTreeData1: function () {

            var self = this;
            var previsionel = this.getView().getModel("utilities").getProperty("/previsionel");

            if (previsionel && previsionel.length > 0 && previsionel[0].DataMode) {
                this.getView().getModel("utilities").setProperty("/DataMode", previsionel[0].DataMode);
            } else {
                this.getView().getModel("utilities").setProperty("/DataMode", "A"); // default to Auto if missing
            }

            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                // === CONFIGURATION D'ÉDITION ===
                var editableConfig = self.getEditableMonthsConfig();
                console.log("Configuration d'édition:", editableConfig);

                items.forEach(function (item) {
                    item.isTotalRow = false;

                    // === Applique la configuration d’édition ===
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

                    // === Initialise le groupe BusinessNo ===
                    if (!fgaGroups[item.BusinessNo]) {
                        fgaGroups[item.BusinessNo] = {
                            businessNo: item.BusinessNo,
                            rootNode: null,      // ligne FGA0
                            regroupements: {},   // autres regroupements
                        };
                    }

                    var fgaGroup = fgaGroups[item.BusinessNo];

                    // === CAS 1 : LIGNE PRINCIPALE FGA0 ===
                    if (item.Regroupement === "FGA0") {
                        // Cette ligne devient le niveau 0 avec toutes ses colonnes
                        item.isNode = true;
                        item.isL0 = true;
                        fgaGroup.rootNode = item;
                        fgaGroup.rootNode.children = [];
                        item.name = item.MissionId;
                    }
                    // === CAS 2 : AUTRES REGROUPEMENTS ===
                    else {
                        if (!fgaGroup.regroupements[item.Regroupement]) {
                            fgaGroup.regroupements[item.Regroupement] = {
                                name: item.Regroupement,
                                isNode: true,
                                isL0: false,
                                FacturationDepense: item.FacturationDepense,
                                ResteAFacturer: 0,
                                ResteADepenser: 0,
                                TotalN: 0,
                                TotalN1: 0,
                                Audela: 0,
                                children: [],
                                totals: self._createEmptyMonthlyTotals()

                            };
                        }

                        var regroupement = fgaGroup.regroupements[item.Regroupement];
                        regroupement.children.push(item);

                        // Cumule les totaux pour le regroupement

                        // Cumule les totaux utiles
                        regroupement.totals.ResteAFacturer += Number(item.ResteAFacturer) || 0;
                        regroupement.totals.ResteADepenser += Number(item.ResteADepenser) || 0;
                        regroupement.totals.TotalN += Number(item.TotalN) || 0;
                        regroupement.totals.TotalN1 += Number(item.TotalN1) || 0;
                        regroupement.totals.Audela += Number(item.Audela) || 0;

                        // Cumule les mois année N
                        [
                            "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                            "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN"
                        ].forEach(function (month) {
                            regroupement.totals[month] += Number(item[month]) || 0;
                        });

                        // Cumule les mois année N+1
                        [
                            "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                            "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"
                        ].forEach(function (month) {
                            regroupement.totals[month] += Number(item[month]) || 0;
                        });


                    }
                });

                // === CONSTRUCTION DE L’ARBRE FINAL ===
                for (var fga in fgaGroups) {
                    var group = fgaGroups[fga];

                    // Crée les regroupements (niveaux enfants)
                    var regroupementArray = [];
                    for (var regKey in group.regroupements) {
                        if (group.regroupements.hasOwnProperty(regKey)) {
                            var regroupement = group.regroupements[regKey];

                            // Ajoute une ligne de total pour chaque regroupement
                            regroupement.children.push(
                                self.createRegroupementTotalRow(regroupement.totals, regroupement.name)
                            );

                            regroupementArray.push(regroupement);
                        }
                    }

                    // Si la ligne FGA0 existe → c’est la racine
                    if (group.rootNode) {
                        group.rootNode.children = regroupementArray;
                        treeData.push(group.rootNode);
                    } else {
                        // Sinon on crée un nœud "Affaire" par défaut
                        treeData.push({
                            name: group.businessNo,
                            FacturationDepense: "Affaire",
                            isNode: true,
                            isL0: true,
                            children: regroupementArray
                        });
                    }
                }

                return treeData;
            };

            // Build trees 
            var previsionelTreeData = buildTree(previsionel);

            // Calculate global totals
            var globalTotals = this.calculateGlobalTotals(previsionelTreeData);

            // Create flat summary rows (level 0)
            // Create new summary rows
            var summaryRows = [
                this.createSummaryRow("Total facturation", globalTotals.totalFacturation, false),
                this.createSummaryRow("Total dépense", globalTotals.totalDepense, false)
            ];



            // Add summary rows directly to the root array (as level 0 items)
            previsionelTreeData = previsionelTreeData.concat(summaryRows);

            // Set tree
            this.getView().getModel("utilities").setProperty("/previsionelHierarchyWithTotals", previsionelTreeData);

            var totalRows = this.countRows(previsionelTreeData);
            this.updateRowCount(totalRows);
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

        onSubmit: function (oEvent) {

            //this.oView.setBusy(true);

            const oModel = this.oView.getModel("utilities");
            const oInput = oEvent.getSource();
            const oBindingContext = oInput.getBindingContext("utilities");

            try {
                oModel.checkUpdate(true);

                // Use arrow function to maintain 'this' context
                setTimeout(() => {
                    this.updateTotals();
                }, 50);
            } catch (error) {
                console.error("Update failed:", error);
                //this.oView.setBusy(false);
            }

            //this.oView.setBusy(false);
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
            Object.keys(totals).forEach(k => {
                row[k] = Number(totals[k]) || 0;
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


        updateRowCount: function (rowCount) {

            if (!this.getView().getModel("localModel")) {
                this.getView().setModel(new JSONModel({
                    tableSettings: {
                        minRowCount: 5
                    }
                }), "localModel");
            }

            this.getView().getModel("localModel").setProperty("/tableSettings/minRowCount",
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
        _hasManualChanges: function (utilitiesModel, oModel) {
                // 1. Vérifier les changements dans le modèle principal
                const pendingChanges = oModel.getPendingChanges();
                if (Object.keys(pendingChanges).length > 0) {
                    return true;
                }

                // 2. Vérifier les modifications dans les données hiérarchiques
                const previsionelData = utilitiesModel.getProperty("/previsionel");
                const previsionelHierarchy = utilitiesModel.getProperty("/previsionelHierarchyWithTotals");

                return this._checkHierarchyChanges(previsionelData, previsionelHierarchy);
            },

            _checkHierarchyChanges: function (originalData, hierarchyData) {
                if (!originalData || !hierarchyData) return false;

                // Approche simplifiée : compter le nombre total de valeurs non nulles
                const countNonZeroValues = (data) => {
                    let count = 0;
                    const fieldsToCheck = [
                        'JanvN', 'FevrN', 'MarsN', 'AvrN', 'MaiN', 'JuinN',
                        'JuilN', 'AoutN', 'SeptN', 'OctN', 'NovN', 'DecN',
                        'JanvN1', 'FevrN1', 'MarsN1', 'AvrN1', 'MaiN1', 'JuinN1',
                        'JuilN1', 'AoutN1', 'SeptN1', 'OctN1', 'NovN1', 'DecN1',
                        'ResteAFacturer', 'ResteADepenser', 'TotalN', 'TotalN1', 'Audela'
                    ];

                    const traverse = (nodes) => {
                        if (!nodes || !Array.isArray(nodes)) return;

                        for (let node of nodes) {
                            // Ignorer les totaux et regroupements
                            if (node.isTotalRow || node.isRegroupementTotal || node.isNode) {
                                continue;
                            }

                            // Compter les valeurs non nulles
                            fieldsToCheck.forEach(field => {
                                const value = Number(node[field]) || 0;
                                if (value !== 0) {
                                    count++;
                                }
                            });

                            // Vérifier les enfants
                            if (node.children && Array.isArray(node.children)) {
                                traverse(node.children);
                            }
                        }
                    };

                    traverse(data);
                    return count;
                };

                const originalCount = countNonZeroValues(originalData);
                const hierarchyCount = countNonZeroValues(hierarchyData);

                console.log(`Compteur valeurs non nulles - Original: ${originalCount}, Hiérarchie: ${hierarchyCount}`);

                return originalCount !== hierarchyCount;
            },

            // Extract the save logic into a separate method
            _executeSave: function (utilitiesModel, resolve, reject) {
                try {
                    // Accès au contexte via la vue
                    const oView = this.base.getView();
                    const oContext = oView.getBindingContext();

                    if (!oContext) {
                        sap.m.MessageBox.error("Aucun contexte lié à la vue !");
                        throw new Error("Impossible d'accéder au contexte.");
                    }

                    if (!this.getModel("utilities").validDataBeforeSave(oView)) {
                        sap.m.MessageBox.error("Veuillez Vérifier tous les champs");
                        return new Promise((resolve, reject) => {
                            reject();
                        });
                    }

                    if (!this.getModel("utilities").validRecetteExtBeforeSave(oView)) {
                        sap.m.MessageBox.error("Veuillez Répartir correctement les budgets");
                        return new Promise((resolve, reject) => {
                            reject();
                        });
                    }

                    this._setBusy(true);
                    return new Promise(async (resolve, reject) => {
                        const formattedMissions = utilitiesModel.getFormattedMissions();
                        const formattedPxAutre = utilitiesModel.getFormattedPxAutre();
                        const formattedPxSubContractingExt = utilitiesModel.formattedPxSubContractingExt();
                        const formattedPxRecetteExt = utilitiesModel.formattedPxRecetteExt();
                        const formattedMainOeuvre = utilitiesModel.formattedPxMainOeuvre();
                        const oPayload = Helper.extractPlainData({
                            ...oContext.getObject(),
                            "to_Missions": formattedMissions,
                            "to_BudgetPxAutre": formattedPxAutre,
                            "to_BudgetPxSubContracting": formattedPxSubContractingExt,
                            "to_BudgetPxRecetteExt": formattedPxRecetteExt,
                            "to_BudgetPxSTI": [],
                            "to_Previsionel": [],
                            "to_BudgetPxMainOeuvre": formattedMainOeuvre
                        });

                        delete oPayload.to_BudgetPxSTI;

                        try {
                            oPayload.VAT = oPayload.VAT ? oPayload.VAT.toString() : oPayload.VAT;
                            const updatedFGA = await utilitiesModel.deepUpsertFGA(oPayload);
                            this._setBusy(false);
                            if (updatedFGA) {
                                Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView(), this.onAfterSaveAction.bind(this));
                                if (resolve) resolve();
                            }

                        } catch (error) {
                            this._setBusy(false);
                            Helper.errorMessage("FGA update failed");
                            console.log(error);
                            if (reject) reject("No data returned");
                            else return Promise.reject("No data returned");
                        }

                        if (reject) reject();
                        else return Promise.reject();
                    });
                } catch (error) {
                    this._setBusy(false);
                    Helper.errorMessage("FGA update failed");
                    console.log(error);
                    if (reject) reject(error);
                    else return Promise.reject(error);
                }
            },


        
    });
});