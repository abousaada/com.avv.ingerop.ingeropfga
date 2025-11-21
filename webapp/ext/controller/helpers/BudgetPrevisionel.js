sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.BudgetPrevisionel", {

        preparePrevisionelTreeData: function () {
            var self = this;

            this.setBusy(true);

            var previsionel = this.getView().getModel("utilities").getProperty("/previsionel");

            // Check if any line has DataMode = "M"
            var hasManualData = false;
            if (previsionel && previsionel.length > 0) {
                hasManualData = previsionel.some(function (item) {
                    return item.DataMode === "M";
                });
            }

            // Set global DataMode based on individual lines
            if (hasManualData) {
                this.getView().getModel("utilities").setProperty("/DataMode", "M");
            } else {
                this.getView().getModel("utilities").setProperty("/DataMode", "A");
            }

            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                // === CONFIGURATION D'ÉDITION ===
                //var editableConfig = self.getEditableMonthsConfig();

                const period = self.getView().getModel("utilities").getProperty("/period");
                const periodMonth = parseInt(period.substring(0, 2), 10);
                const periodYear = parseInt(period.substring(2, 6), 10);

                const nextYear = periodYear + 1;

                //Init period
                var filtersModel = self.getView().getModel("filtersModel");
                if (!filtersModel) {
                    //console.error("Filters model not found. Initializing...");
                    self._initializeFiltersModel();
                    filtersModel = self.oView.getModel("filtersModel");

                    if (!filtersModel) {
                        sap.m.MessageBox.error("Erreur d'initialisation des filtres");
                        return;
                    }
                }
                filtersModel.setProperty("/Period", period);

                const storedSelection = sessionStorage.getItem("selectedBusinessNos");
                if (storedSelection) {
                    try {
                        const businessNosArray = JSON.parse(storedSelection);

                        const displayValue = businessNosArray.join(", ");

                        // Set the display value in the filter
                        filtersModel.setProperty("/Affaire", displayValue);
                        var businessNoInput = self.byId("businessNoFilter");
                        if (businessNoInput) {
                            businessNoInput.data("selectedBusinessNos", businessNosArray);
                        }
                    } catch (error) {
                        console.error("Error parsing stored BusinessNos:", error);
                        filtersModel.setProperty("/Affaire", "");
                    }
                } else {
                    filtersModel.setProperty("/Affaire", "");
                }

                filtersModel.refresh(true);

                // Save these years for bindings
                const utilitiesModel = self.getView().getModel("utilities");
                utilitiesModel.setProperty("/currentYear", periodYear);
                utilitiesModel.setProperty("/nextYear", nextYear);
                utilitiesModel.setProperty("/periodMonth", periodMonth);

                items.forEach(function (item) {
                    item.isTotalRow = false;

                    // === APPLY EDITABLE CONFIGURATION PER ITEM BASED ON MASK ===
                    var mask = parseInt(item.mask, 10) || 0;
                    var cutoffMonth;

                    /*if (mask >= periodMonth) {
                        // If mask >= period: non-editable up to mask
                        cutoffMonth = mask;
                    } else {
                        // If period > mask: non-editable up to period - 1
                        cutoffMonth = periodMonth - 1;
                    }*/

                    // Get current date
                    var now = new Date();
                    var currentMonth = now.getMonth();

                    cutoffMonth = currentMonth;


                    // Apply editable configuration for year N months
                    item.isEditableJanvN = 1 > cutoffMonth;
                    item.isEditableFevrN = 2 > cutoffMonth;
                    item.isEditableMarsN = 3 > cutoffMonth;
                    item.isEditableAvrN = 4 > cutoffMonth;
                    item.isEditableMaiN = 5 > cutoffMonth;
                    item.isEditableJuinN = 6 > cutoffMonth;
                    item.isEditableJuilN = 7 > cutoffMonth;
                    item.isEditableAoutN = 8 > cutoffMonth;
                    item.isEditableSeptN = 9 > cutoffMonth;
                    item.isEditableOctN = 10 > cutoffMonth;
                    item.isEditableNovN = 11 > cutoffMonth;
                    item.isEditableDecN = 12 > cutoffMonth;

                    // Year N+1 months are always editable
                    item.isEditableJanvN1 = true;
                    item.isEditableFevrN1 = true;
                    item.isEditableMarsN1 = true;
                    item.isEditableAvrN1 = true;
                    item.isEditableMaiN1 = true;
                    item.isEditableJuinN1 = true;
                    item.isEditableJuilN1 = true;
                    item.isEditableAoutN1 = true;
                    item.isEditableSeptN1 = true;
                    item.isEditableOctN1 = true;
                    item.isEditableNovN1 = true;
                    item.isEditableDecN1 = true;

                    // === Applique la configuration d'édition ===
                    /*Object.keys(editableConfig.N).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N[key];
                    });
                    Object.keys(editableConfig.N1).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N1[key];
                    });*/

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

                    // === ADD DIRECT LINES UNDER FGA0 - SANS NIVEAUX INTERMÉDIAIRES ===
                    // Add direct Facturation lines directly to root
                    if (group.directLines.facturation.length > 0) {
                        rootChildren = rootChildren.concat(group.directLines.facturation);
                    }

                    // Add direct Dépense lines directly to root
                    if (group.directLines.depense.length > 0) {
                        rootChildren = rootChildren.concat(group.directLines.depense);
                    }

                    // === ADD MISSIONS GROUPED BY REGROUPEMENT ===
                    // Build missions array with proper hierarchy
                    var missionsArray = [];
                    for (var missionKey in group.missions) {
                        if (group.missions.hasOwnProperty(missionKey)) {
                            var mission = group.missions[missionKey];

                            // Create mission children array - SANS NIVEAUX INTERMÉDIAIRES
                            mission.children = [];

                            // Add Facturation lines directly to mission
                            if (mission.facturationLines.length > 0) {
                                mission.children = mission.children.concat(mission.facturationLines);
                            }

                            // Add Dépense lines directly to mission
                            if (mission.depenseLines.length > 0) {
                                mission.children = mission.children.concat(mission.depenseLines);
                            }

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

            this.setBusy(false);
        },

        preparePrevisionelTreeData1: function () {
            var self = this;

            this.setBusy(true);

            var previsionel = this.getView().getModel("utilities").getProperty("/previsionel");

            // Check if any line has DataMode = "M"
            var hasManualData = false;
            if (previsionel && previsionel.length > 0) {
                hasManualData = previsionel.some(function (item) {
                    return item.DataMode === "M";
                });
            }

            // Set global DataMode based on individual lines
            if (hasManualData) {
                this.getView().getModel("utilities").setProperty("/DataMode", "M");
            } else {
                this.getView().getModel("utilities").setProperty("/DataMode", "A");
            }

            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                // === CONFIGURATION D'ÉDITION ===
                //var editableConfig = self.getEditableMonthsConfig();

                const period = self.getView().getModel("utilities").getProperty("/period");
                const periodMonth = parseInt(period.substring(0, 2), 10);
                const periodYear = parseInt(period.substring(2, 6), 10);

                const nextYear = periodYear + 1;

                //Init period
                var filtersModel = self.getView().getModel("filtersModel");
                if (!filtersModel) {
                    //console.error("Filters model not found. Initializing...");
                    self._initializeFiltersModel();
                    filtersModel = self.oView.getModel("filtersModel");

                    if (!filtersModel) {
                        sap.m.MessageBox.error("Erreur d'initialisation des filtres");
                        return;
                    }
                }
                filtersModel.setProperty("/Period", period);

                const storedSelection = sessionStorage.getItem("selectedBusinessNos");
                if (storedSelection) {
                    try {
                        const businessNosArray = JSON.parse(storedSelection);

                        const displayValue = businessNosArray.join(", ");

                        // Set the display value in the filter
                        filtersModel.setProperty("/Affaire", displayValue);
                        var businessNoInput = self.byId("businessNoFilter");
                        if (businessNoInput) {
                            businessNoInput.data("selectedBusinessNos", businessNosArray);
                        }
                    } catch (error) {
                        console.error("Error parsing stored BusinessNos:", error);
                        filtersModel.setProperty("/Affaire", "");
                    }
                } else {
                    filtersModel.setProperty("/Affaire", "");
                }

                filtersModel.refresh(true);

                // Save these years for bindings
                const utilitiesModel = self.getView().getModel("utilities");
                utilitiesModel.setProperty("/currentYear", periodYear);
                utilitiesModel.setProperty("/nextYear", nextYear);
                utilitiesModel.setProperty("/periodMonth", periodMonth);

                items.forEach(function (item) {
                    item.isTotalRow = false;

                    // === APPLY EDITABLE CONFIGURATION PER ITEM BASED ON MASK ===
                    var mask = parseInt(item.mask, 10) || 0;
                    var cutoffMonth;

                    if (mask >= periodMonth) {
                        // If mask >= period: non-editable up to mask
                        cutoffMonth = mask;
                    } else {
                        // If period > mask: non-editable up to period - 1
                        cutoffMonth = periodMonth - 1;
                    }

                    // Apply editable configuration for year N months
                    item.isEditableJanvN = 1 > cutoffMonth;
                    item.isEditableFevrN = 2 > cutoffMonth;
                    item.isEditableMarsN = 3 > cutoffMonth;
                    item.isEditableAvrN = 4 > cutoffMonth;
                    item.isEditableMaiN = 5 > cutoffMonth;
                    item.isEditableJuinN = 6 > cutoffMonth;
                    item.isEditableJuilN = 7 > cutoffMonth;
                    item.isEditableAoutN = 8 > cutoffMonth;
                    item.isEditableSeptN = 9 > cutoffMonth;
                    item.isEditableOctN = 10 > cutoffMonth;
                    item.isEditableNovN = 11 > cutoffMonth;
                    item.isEditableDecN = 12 > cutoffMonth;

                    // Year N+1 months are always editable
                    item.isEditableJanvN1 = true;
                    item.isEditableFevrN1 = true;
                    item.isEditableMarsN1 = true;
                    item.isEditableAvrN1 = true;
                    item.isEditableMaiN1 = true;
                    item.isEditableJuinN1 = true;
                    item.isEditableJuilN1 = true;
                    item.isEditableAoutN1 = true;
                    item.isEditableSeptN1 = true;
                    item.isEditableOctN1 = true;
                    item.isEditableNovN1 = true;
                    item.isEditableDecN1 = true;

                    // === Applique la configuration d'édition ===
                    /*Object.keys(editableConfig.N).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N[key];
                    });
                    Object.keys(editableConfig.N1).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N1[key];
                    });*/

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


            this.setBusy(false);
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
            utilitiesModel.setProperty("/periodMonth", periodMonth);

            const currentMonth = periodMonth;
            const currentYear = periodYear;

            // Get the mask value from the current context (item)
            var oContext = this.getView().getBindingContext("utilities");
            var mask = 0;

            if (oContext) {
                var itemData = oContext.getObject();
                mask = parseInt(itemData.mask, 10) || 0;
            }

            // Determine the cutoff month based on mask vs period comparison
            var cutoffMonth;
            if (mask >= periodMonth) {
                // If mask >= period: non-editable up to mask
                cutoffMonth = mask;
            } else {
                // If period > mask: non-editable up to period - 1
                cutoffMonth = periodMonth - 1;
            }

            var config = {
                // Pour l'année N, seuls les mois futurs sont editables
                N: {
                    JanvN: 1 > cutoffMonth,
                    FevrN: 2 > cutoffMonth,
                    MarsN: 3 > cutoffMonth,
                    AvrN: 4 > cutoffMonth,
                    MaiN: 5 > cutoffMonth,
                    JuinN: 6 > cutoffMonth,
                    JuilN: 7 > cutoffMonth,
                    AoutN: 8 > cutoffMonth,
                    SeptN: 9 > cutoffMonth,
                    OctN: 10 > cutoffMonth,
                    NovN: 11 > cutoffMonth,
                    DecN: 12 > cutoffMonth
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

        getEditableMonthsConfig1: function () {

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
                    JanvN: currentMonth <= 1,
                    FevrN: currentMonth <= 2,
                    MarsN: currentMonth <= 3,
                    AvrN: currentMonth <= 4,
                    MaiN: currentMonth <= 5,
                    JuinN: currentMonth <= 6,
                    JuilN: currentMonth <= 7,
                    AoutN: currentMonth <= 8,
                    SeptN: currentMonth <= 9,
                    OctN: currentMonth <= 10,
                    NovN: currentMonth <= 11,
                    DecN: currentMonth <= 12
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
                    if (regroupement.children && regroupement.children.forEach) {
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
                    }


                    // Update the regroupement total row
                    var existingTotalIndex = -1;
                    if (regroupement.children && Array.isArray(regroupement.children)) {
                        regroupement.children.findIndex(function (child) {
                            return child.isRegroupementTotal;
                        });
                    }

                    /*var totalRow = this.createRegroupementTotalRow(regroupement.totals, entry.name);

                    if (existingTotalIndex >= 0) {
                        regroupement.children[existingTotalIndex] = totalRow;
                    } else {
                        if (!regroupement.children) {
                            regroupement.children = [];
                        }
                        regroupement.children.push(totalRow);
                    }*/

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

            const dataMode = this.getView().getModel("utilities").getProperty("/DataMode");

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

            // Recalculate the totals
            this.recalculateTotalsForLine(bindingContext);

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

            // Store old DataMode before we change it
            var previousDataMode = editedFlatLine.DataMode;

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

            this.getView().getModel("utilities").setProperty("/DataMode", "M");

            // Reset the specified months to zero in the flat data
            var hasChanges = false;

            // If DataMode was 'A', switch it to 'M'
            if (previousDataMode === "A") {
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
                    //this.preparePrevisionelTreeData();

                    // Show message to user
                    sap.m.MessageToast.show("Ligne passée en mode manuel. Les mois suivants ont été réinitialisés à zéro: " + monthsToReset.join(", "));
                }
            } else {
                console.log("DataMode was already 'M' — no months reset.");
            }

            utilitiesModel.setProperty("/previsionel", flatData);
            this.preparePrevisionelTreeData();
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

        onSearch: function (oEvent) {
            var self = this;
            var filtersModel = this.getView().getModel("filtersModel");
            if (!filtersModel) {
                console.error("Filters model not found. Initializing...");
                this._initializeFiltersModel();
                filtersModel = this.oView.getModel("filtersModel");

                if (!filtersModel) {
                    sap.m.MessageBox.error("Erreur d'initialisation des filtres");
                    return;
                }
            }

            // Get filter values
            var period = filtersModel.getProperty("/Period");
            var businessNoInput = this.byId("businessNoFilter"); // Get the input field reference
            var ufo = filtersModel.getProperty("/UFO");
            var label = filtersModel.getProperty("/Label");
            var societe = filtersModel.getProperty("/Societe");
            var profitCenter = filtersModel.getProperty("/ProfitCenter");

            // Validate period (mandatory field)
            if (!period) {
                sap.m.MessageBox.error("La période (MMYYYY) est obligatoire");
                return;
            }

            // Update period in utilities model (important for getBEDatas)
            var utilitiesModel = this.getView().getModel("utilities");
            utilitiesModel.setProperty("/period", period);

            // Get selected business numbers from the input's custom data
            var aSelectedBusinessNos = [];
            if (businessNoInput) {
                aSelectedBusinessNos = businessNoInput.data("selectedBusinessNos") || [];
            }

            // Fallback to single businessNo if no multi-select data found
            if (aSelectedBusinessNos.length === 0) {
                var singleBusinessNo = filtersModel.getProperty("/Affaire");
                if (singleBusinessNo) {
                    aSelectedBusinessNos.push(singleBusinessNo);
                }
            }

            // Show busy indicator
            this.setBusy(true);

            if (!utilitiesModel) {
                sap.m.MessageBox.error("Méthode getBEPrevisionel non disponible");
                this.setBusy(false);
                return;
            }

            // Prepare filter object to pass to backend
            var filterParams = {
                societe: societe,
                businessNo: aSelectedBusinessNos.length > 0 ? aSelectedBusinessNos[0] : "", // Single value for backward compatibility
                ufo: ufo,
                label: label,
                societe: societe,
                profitCenter: profitCenter,
                selectedBusinessNos: aSelectedBusinessNos, // Array for multi-select
                aSelectedBusinessNos: aSelectedBusinessNos // Alternative name for compatibility
            };

            utilitiesModel.getBEPrevisionel(filterParams)
                .then(function (result) {
                    // The result should already be filtered from the backend
                    // Update the model with the filtered data
                    utilitiesModel.setProperty("/previsionel", result);

                    // Rebuild the tree with the filtered data
                    self.preparePrevisionelTreeData();

                    // Show success message
                    var message = `Données actualisées: ${result.length} ligne(s) trouvée(s)`;
                    if (aSelectedBusinessNos.length > 0) {
                        message += ` pour ${aSelectedBusinessNos.length} affaire(s) sélectionnée(s)`;
                    }
                    sap.m.MessageToast.show(message);
                })
                .catch(function (error) {
                    console.error("Error fetching previsionel data:", error);
                    sap.m.MessageBox.error("Erreur lors du chargement des données: " + error.message);
                })
                .finally(function () {
                    self.setBusy(false);
                });
        },

        onSearch1: function (oEvent) {
            var self = this;
            var filtersModel = this.getView().getModel("filtersModel");
            if (!filtersModel) {
                console.error("Filters model not found. Initializing...");
                this._initializeFiltersModel();
                filtersModel = this.oView.getModel("filtersModel");

                if (!filtersModel) {
                    sap.m.MessageBox.error("Erreur d'initialisation des filtres");
                    return;
                }
            }

            // Get filter values
            var period = filtersModel.getProperty("/Period");
            var businessNo = filtersModel.getProperty("/Affaire");
            var ufo = filtersModel.getProperty("/UFO");
            var label = filtersModel.getProperty("/Label");
            var societe = filtersModel.getProperty("/Societe");
            var profitCenter = filtersModel.getProperty("/ProfitCenter");

            // Validate period (mandatory field)
            if (!period) {
                sap.m.MessageBox.error("La période (MMYYYY) est obligatoire");
                return;
            }

            // Update period in utilities model (important for getBEDatas)
            var utilitiesModel = this.getView().getModel("utilities");
            utilitiesModel.setProperty("/period", period);

            // Build selected business numbers array
            var aSelectedBusinessNos = [];
            if (businessNo) {
                aSelectedBusinessNos.push(businessNo);
            }

            // Show busy indicator
            this.setBusy(true);

            if (!utilitiesModel) {
                sap.m.MessageBox.error("Méthode getBEPrevisionel non disponible");
                this.setBusy(false);
                return;
            }

            // Prepare filter object to pass to backend
            var filterParams = {
                societe: societe,
                //period: period,
                businessNo: businessNo,
                ufo: ufo,
                label: label,
                societe: societe,
                profitCenter: profitCenter,
                selectedBusinessNos: aSelectedBusinessNos
            };

            //utilitiesModel.getBEPrevisionel_filtre(filterParams)
            utilitiesModel.getBEPrevisionel(filterParams)
                .then(function (result) {
                    // The result should already be filtered from the backend
                    // Update the model with the filtered data
                    utilitiesModel.setProperty("/previsionel", result);

                    // Rebuild the tree with the filtered data
                    self.preparePrevisionelTreeData();

                    // Show success message
                    var message = `Données actualisées: ${result.length} ligne(s) trouvée(s)`;
                    if (businessNo) {
                        message += ` pour l'affaire ${businessNo}`;
                    }
                    sap.m.MessageToast.show(message);
                })
                .catch(function (error) {
                    console.error("Error fetching previsionel data:", error);
                    sap.m.MessageBox.error("Erreur lors du chargement des données: " + error.message);
                })
                .finally(function () {
                    self.setBusy(false);
                });
        },


        // Helper method to apply additional filters
        applyAdditionalFilters: function (data, filters) {
            if (!data || !Array.isArray(data)) return data;

            // If no additional filters provided, return all data
            if (!filters.ufo && !filters.label && !filters.societe && !filters.profitCenter) {
                return data;
            }

            return data.filter(function (item) {
                var match = true;

                if (filters.ufo && item.UFO) {
                    match = match && item.UFO.toString().toLowerCase().includes(filters.ufo.toLowerCase());
                }

                if (filters.label && item.Description) {
                    match = match && item.Description.toString().toLowerCase().includes(filters.label.toLowerCase());
                }

                if (filters.societe && item.Societe) {
                    match = match && item.Societe.toString().toLowerCase().includes(filters.societe.toLowerCase());
                }

                if (filters.profitCenter && item.ProfitCenter) {
                    match = match && item.ProfitCenter.toString().toLowerCase().includes(filters.profitCenter.toLowerCase());
                }

                return match;
            });
        },

        // Helper method to set busy state
        setBusy: function (isBusy) {
            var oView = this.getView();
            if (isBusy) {
                if (!this._busyDialog) {
                    this._busyDialog = new sap.m.BusyDialog({
                        text: "Recherche des données en cours...",
                        title: "Veuillez patienter"
                    });
                }
                this._busyDialog.open();
            } else {
                if (this._busyDialog) {
                    this._busyDialog.close();
                }
            }

            // Also set busy state on the table and filter bar
            var oTable = this.byId("PrevisionnelTreeTable");
            if (oTable) {
                oTable.setBusy(isBusy);
            }

            var oFilterBar = this.byId("filterBar");
            if (oFilterBar) {
                oFilterBar.setBusy(isBusy);
            }
        },

        onPeriodChange: function (oEvent) {
            var sPeriod = oEvent.getSource().getValue();
            var oFiltersModel = this.getView().getModel("filtersModel");
            var oUtilitiesModel = this.getView().getModel("utilities");

            // Update both models
            oFiltersModel.setProperty("/Period", sPeriod);
            oUtilitiesModel.setProperty("/period", sPeriod);

            // Validate period format (optional)
            if (sPeriod && !/^(0[1-9]|1[0-2])[0-9]{4}$/.test(sPeriod)) {
                sap.m.MessageBox.warning("Format de période invalide. Utilisez MMyyyy (ex: 102025)");
            }
        },

        setView: function (oView) {
            // Initialize filters model if not already done
            var oFiltersModel = new sap.ui.model.json.JSONModel({
                Period: "",
                Affaire: "",
                UFO: "",
                Label: "",
                Societe: "",
                ProfitCenter: "",
                BusinessManager: "",
                ChefProjet: "",
                STIsLiees: ""
            });
            this.getView().setModel(oFiltersModel, "filtersModel");

            // Set initial period if needed
            this.setInitialPeriod();

            // Load initial data
            this.loadInitialData();
        },

        setInitialPeriod: function () {
            var oUtilitiesModel = this.getView().getModel("utilities");
            var oFiltersModel = this.getView().getModel("filtersModel");

            var currentPeriod = oUtilitiesModel.getProperty("/period");
            if (currentPeriod) {
                oFiltersModel.setProperty("/Period", currentPeriod);
            } else {
                // Set default to current month/year
                var now = new Date();
                var month = (now.getMonth() + 1).toString().padStart(2, '0');
                var year = now.getFullYear().toString();
                var defaultPeriod = month + year;

                oFiltersModel.setProperty("/Period", defaultPeriod);
                oUtilitiesModel.setProperty("/period", defaultPeriod);
            }
        },

        loadInitialData: function () {
            var self = this;
            var oFiltersModel = this.getView().getModel("filtersModel");
            var period = oFiltersModel.getProperty("/Period");

            if (period) {
                // Show loading indicator
                this.setBusy(true);

                // Load data for current period
                this.getOwnerComponent()._getTabsData('previsionel', [])
                    .then(function () {
                        self.preparePrevisionelTreeData();
                        sap.m.MessageToast.show("Données chargées pour la période " + period);
                    })
                    .catch(function (error) {
                        console.error("Error loading initial data:", error);
                        sap.m.MessageBox.error("Erreur lors du chargement initial des données");
                    })
                    .finally(function () {
                        self.setBusy(false);
                    });
            }
        },

        onClearFilters: function () {
            var oFiltersModel = this.getView().getModel("filtersModel");

            // Clear all filters except period
            oFiltersModel.setProperty("/Affaire", "");
            oFiltersModel.setProperty("/UFO", "");
            oFiltersModel.setProperty("/Label", "");
            oFiltersModel.setProperty("/Societe", "");
            oFiltersModel.setProperty("/ProfitCenter", "");
            oFiltersModel.setProperty("/BusinessManager", "");
            oFiltersModel.setProperty("/ChefProjet", "");
            oFiltersModel.setProperty("/STIsLiees", "");

            // Reload data with cleared filters
            this.onSearch();
        },

        _initializeFiltersModel: function () {
            if (!this.oView) {
                console.error("View not set in BudgetPrevisionel");
                return;
            }

            // Check if filters model already exists
            var oFiltersModel = this.oView.getModel("filtersModel");

            if (!oFiltersModel) {
                // Create new filters model
                oFiltersModel = new sap.ui.model.json.JSONModel({
                    Period: "",
                    Affaire: "",
                    UFO: "",
                    Label: "",
                    Societe: "",
                    ProfitCenter: "",
                    BusinessManager: "",
                    ChefProjet: "",
                    STIsLiees: ""
                });
                this.oView.setModel(oFiltersModel, "filtersModel");
            }

            // Set initial period
            this._setInitialPeriod();
        },

        _setInitialPeriod: function () {
            var oUtilitiesModel = this.oView.getModel("utilities");
            var oFiltersModel = this.oView.getModel("filtersModel");

            if (!oUtilitiesModel || !oFiltersModel) {
                console.warn("Models not available for period initialization");
                return;
            }

            var currentPeriod = oUtilitiesModel.getProperty("/period");
            if (currentPeriod) {
                oFiltersModel.setProperty("/Period", currentPeriod);
            } else {
                // Set default to current month/year
                var now = new Date();
                var month = (now.getMonth() + 1).toString().padStart(2, '0');
                var year = now.getFullYear().toString();
                var defaultPeriod = month + year;

                oFiltersModel.setProperty("/Period", defaultPeriod);
                oUtilitiesModel.setProperty("/period", defaultPeriod);
            }
        },

        onCompanyValueHelp: function (oEvent) {
            var oInput = oEvent.getSource();
            var oView = this.getView();

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new sap.m.TableSelectDialog({
                    title: "Select Company",
                    noDataText: "No companies found",
                    rememberSelections: true,
                    contentWidth: "30%",

                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oFilter = new sap.ui.model.Filter(
                            "CompanyCode",
                            sap.ui.model.FilterOperator.Contains,
                            sValue
                        );
                        oEvent.getSource().getBinding("items").filter([oFilter]);
                    },

                    confirm: function (oEvent) {
                        var aSelectedItems = oEvent.getParameter("selectedItems");
                        if (aSelectedItems && aSelectedItems.length > 0) {
                            var sSelectedValue = aSelectedItems[0]
                                .getBindingContext()
                                .getObject()
                                .CompanyCode;
                            oInput.setValue(sSelectedValue);
                        }
                    },

                    // Optional: handle cancel
                    cancel: function () { },

                    // Table columns
                    columns: [
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Company Code" })
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Company Name" })
                        })
                    ]
                });

                this._oValueHelpDialog.bindAggregation("items", {
                    path: "/I_CompanyCodeVH",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: "{CompanyCode}" }),
                            new sap.m.Text({ text: "{CompanyCodeName}" })
                        ]
                    })
                });

                oView.addDependent(this._oValueHelpDialog);
            }

            this._oValueHelpDialog.getBinding("items").filter([]);

            this._oValueHelpDialog.open();
        },

        onUFOValueHelp: function (oEvent) {
            var oInput = oEvent.getSource();
            var oView = this.getView();

            if (!this._oUFODialog) {
                this._oUFODialog = new sap.m.TableSelectDialog({
                    title: "Select UFO Délégué",
                    noDataText: "No UFOs found",
                    rememberSelections: true,
                    contentWidth: "40%",

                    // Search only on UFO
                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oFilter = new sap.ui.model.Filter(
                            "UFO",
                            sap.ui.model.FilterOperator.Contains,
                            sValue
                        );
                        oEvent.getSource().getBinding("items").filter([oFilter]);
                    },

                    confirm: function (oEvent) {
                        var aSelectedItems = oEvent.getParameter("selectedItems");
                        if (aSelectedItems && aSelectedItems.length > 0) {
                            var sSelectedValue = aSelectedItems[0].getBindingContext().getObject().UFO;
                            oInput.setValue(sSelectedValue);
                        }
                    },

                    columns: [
                        new sap.m.Column({ header: new sap.m.Text({ text: "UFO" }) }),
                        new sap.m.Column({ header: new sap.m.Text({ text: "Description" }) })
                    ]
                });

                this._oUFODialog.bindAggregation("items", {
                    path: "/ZI_FGA_UFO_VH",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: "{UFO}" }),
                            new sap.m.Text({ text: "{description}" })
                        ]
                    })
                });

                oView.addDependent(this._oUFODialog);
            }

            this._oUFODialog.getBinding("items").filter([]);
            this._oUFODialog.open();
        },

        onBusinessNoValueHelp: function (oEvent) {
            var oInput = oEvent.getSource();
            var oView = this.getView();
            var self = this;

            // First, ensure data is loaded
            var oModel = this.getView().getModel();

            // Check if data is already loaded
            var aData = oModel.getProperty("/ZC_FGA_VH");
            if (!aData || aData.length === 0) {
                console.log("Loading BusinessNo data...");

                // Show busy indicator
                var oBusyDialog = new sap.m.BusyDialog({
                    text: "Chargement des données...",
                    title: "Veuillez patienter"
                });
                oBusyDialog.open();

                // Load data first
                oModel.read("/ZC_FGA_VH", {
                    success: function (oData) {
                        console.log("Data loaded successfully:", oData.results.length, "items");
                        oBusyDialog.close();
                        self._openBusinessNoDialog(oInput, oView, oData.results);
                    },
                    error: function (oError) {
                        console.error("Error loading data:", oError);
                        oBusyDialog.close();
                        sap.m.MessageBox.error("Erreur lors du chargement des données");
                    }
                });
            } else {
                console.log("Data already loaded:", aData.length, "items");
                this._openBusinessNoDialog(oInput, oView, aData);
            }
        },

        _openBusinessNoDialog: function (oInput, oView, aData) {
            // Create a new dialog each time to avoid binding issues
            if (this._oBusinessNoDialog) {
                this._oBusinessNoDialog.destroy();
            }

            this._oBusinessNoDialog = new sap.m.TableSelectDialog({
                title: "Sélectionner N°Affaire",
                noDataText: "Aucune affaire trouvée",
                rememberSelections: false, // Set to false to avoid issues
                multiSelect: true,
                contentWidth: "60%",

                search: function (oEvent) {
                    var sValue = oEvent.getParameter("value").toLowerCase();
                    var oTable = oEvent.getSource();
                    var aAllItems = oTable.getModel().getProperty("/allItems");

                    if (sValue) {
                        var aFilteredItems = aAllItems.filter(function (oItem) {
                            return oItem.BusinessNo && oItem.BusinessNo.toLowerCase().includes(sValue) ||
                                oItem.BusinessName && oItem.BusinessName.toLowerCase().includes(sValue);
                        });
                        oTable.getModel().setProperty("/items", aFilteredItems);
                    } else {
                        oTable.getModel().setProperty("/items", aAllItems);
                    }
                },

                confirm: function (oEvent) {
                    var aSelectedItems = oEvent.getParameter("selectedItems");
                    console.log("Selected items:", aSelectedItems);

                    if (aSelectedItems && aSelectedItems.length > 0) {
                        var aSelectedBusinessNos = aSelectedItems.map(function (oItem) {
                            var oCtx = oItem.getBindingContext(); // get context from the model
                            return oCtx ? oCtx.getProperty("BusinessNo") : undefined;
                        }).filter(function (bn) {
                            return bn;
                        });

                        console.log("BusinessNos selected:", aSelectedBusinessNos);

                        if (aSelectedBusinessNos.length > 0) {
                            var sDisplayValue = aSelectedBusinessNos.join(", ");
                            oInput.setValue(sDisplayValue);
                            oInput.data("selectedBusinessNos", aSelectedBusinessNos);

                            try {
                                sessionStorage.setItem("selectedBusinessNos", JSON.stringify(aSelectedBusinessNos));
                            } catch (error) {
                                console.error("Error saving to sessionStorage:", error);
                            }

                            sap.m.MessageToast.show(aSelectedBusinessNos.length + " affaire(s) sélectionnée(s)");
                        }
                    }
                },

                columns: [
                    new sap.m.Column({
                        header: new sap.m.Text({ text: "N°Affaire" })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Text({ text: "Description" })
                    })
                ]
            });

            // Create and set the model
            var oModel = new sap.ui.model.json.JSONModel({
                allItems: aData,
                items: aData
            });
            this._oBusinessNoDialog.setModel(oModel);

            this._oBusinessNoDialog.bindAggregation("items", {
                path: "/items",
                template: new sap.m.ColumnListItem({
                    type: "Active",
                    cells: [
                        new sap.m.Text({ text: "{BusinessNo}" }),
                        new sap.m.Text({ text: "{BusinessName}" })
                    ]
                })
            });

            oView.addDependent(this._oBusinessNoDialog);
            this._oBusinessNoDialog.open();
        },

        onProfitCenterValueHelp: function (oEvent) {
            var oInput = oEvent.getSource();
            var oView = this.getView();
            var self = this;

            var oModel = this.getView().getModel(); // OData model

            // Try to get existing data
            var aData = oModel.getProperty("/ZI_FGA_PROFITCENTER_VH");

            if (!aData || aData.length === 0) {
                console.log("Loading Profit Center data...");

                var oBusyDialog = new sap.m.BusyDialog({
                    text: "Chargement des centres de profit...",
                    title: "Veuillez patienter"
                });
                oBusyDialog.open();

                // Load via OData read
                oModel.read("/ZI_FGA_PROFITCENTER_VH", {
                    success: function (oData) {
                        console.log("Profit Centers loaded:", oData.results.length);
                        oBusyDialog.close();
                        self._openProfitCenterDialog(oInput, oView, oData.results);
                    },
                    error: function (oError) {
                        console.error("Error loading Profit Centers:", oError);
                        oBusyDialog.close();
                        sap.m.MessageBox.error("Erreur lors du chargement des centres de profit");
                    }
                });
            } else {
                console.log("Profit Centers already loaded:", aData.length);
                this._openProfitCenterDialog(oInput, oView, aData);
            }
        },

        _openProfitCenterDialog: function (oInput, oView, aData) {
            // Destroy existing dialog to avoid duplicates/binding conflicts
            if (this._oProfitCenterDialog) {
                this._oProfitCenterDialog.destroy();
            }

            this._oProfitCenterDialog = new sap.m.TableSelectDialog({
                title: "Sélectionner Centre de Profit",
                noDataText: "Aucun centre de profit trouvé",
                rememberSelections: false,
                multiSelect: false,
                contentWidth: "50%",

                search: function (oEvent) {
                    var sValue = oEvent.getParameter("value").toLowerCase();
                    var oTable = oEvent.getSource();
                    var aAllItems = oTable.getModel().getProperty("/allItems");

                    if (sValue) {
                        var aFilteredItems = aAllItems.filter(function (oItem) {
                            return (
                                (oItem.ProfitCenter && oItem.ProfitCenter.toLowerCase().includes(sValue)) ||
                                (oItem.Description && oItem.Description.toLowerCase().includes(sValue))
                            );
                        });
                        oTable.getModel().setProperty("/items", aFilteredItems);
                    } else {
                        oTable.getModel().setProperty("/items", aAllItems);
                    }
                },

                confirm: function (oEvent) {
                    var aSelectedItems = oEvent.getParameter("selectedItems");
                    if (aSelectedItems && aSelectedItems.length > 0) {
                        var oCtx = aSelectedItems[0].getBindingContext();
                        var oSelected = oCtx ? oCtx.getObject() : null;

                        if (oSelected) {
                            console.log("Selected Profit Center:", oSelected.ProfitCenter);
                            oInput.setValue(oSelected.ProfitCenter);
                            oInput.data("selectedProfitCenter", oSelected.ProfitCenter);

                            try {
                                sessionStorage.setItem("selectedProfitCenter", oSelected.ProfitCenter);
                            } catch (err) {
                                console.error("Error saving ProfitCenter to sessionStorage:", err);
                            }

                            sap.m.MessageToast.show("Centre de profit sélectionné : " + oSelected.ProfitCenter);
                        }
                    }
                },

                columns: [
                    new sap.m.Column({ header: new sap.m.Text({ text: "Centre de profit" }) }),
                    new sap.m.Column({ header: new sap.m.Text({ text: "Description" }) })
                ]
            });

            // Create local model with all and filtered items
            var oLocalModel = new sap.ui.model.json.JSONModel({
                allItems: aData,
                items: aData
            });
            this._oProfitCenterDialog.setModel(oLocalModel);

            this._oProfitCenterDialog.bindAggregation("items", {
                path: "/items",
                template: new sap.m.ColumnListItem({
                    type: "Active",
                    cells: [
                        new sap.m.Text({ text: "{ProfitCenter}" }),
                        new sap.m.Text({ text: "{Description}" })
                    ]
                })
            });

            oView.addDependent(this._oProfitCenterDialog);
            this._oProfitCenterDialog.open();
        },

        onExpandCollapseAll: function () {
            var oTreeTable = this.byId("PrevisionnelTreeTable");
            var oLocalModel = this.getView().getModel("localModel");

            if (!oTreeTable) {
                sap.m.MessageToast.show("Tree table not found");
                return;
            }

            var bIsExpanded = oLocalModel.getProperty("/isExpandedAll");

            if (!bIsExpanded) {
                // Expand all nodes
                oTreeTable.expandToLevel(999);
                sap.m.MessageToast.show("Tous les nœuds développés");
            } else {
                // Collapse all nodes
                oTreeTable.collapseAll();
                sap.m.MessageToast.show("Tous les nœuds réduits");
            }

            // Inverser l’état
            oLocalModel.setProperty("/isExpandedAll", !bIsExpanded);
        },


        calculateTotalFacturer: function (oBindingContext) {
            const oModel = this.getView().getModel("utilities");
            const aData = oModel.getProperty("/previsionelHierarchyWithTotals");

            if (!aData || !aData.length) return 0;

            // Trouver la ligne avec le nom "Total facturation"
            const totalRow = aData.find(function (item) {
                return item.name === "Total facturation" || item.name === "Total Facturation";
            });

            // Si trouvé, retourner la valeur, sinon 0
            return totalRow ? (parseFloat(totalRow.ResteAFacturer) || 0) : 0;
        },

        calculateTotalDepenser: function (oBindingContext) {
            const oModel = this.getView().getModel("utilities");
            const aData = oModel.getProperty("/previsionelHierarchyWithTotals");

            if (!aData || !aData.length) return 0;

            // Trouver la ligne avec le nom "Total dépense"
            const totalRow = aData.find(function (item) {
                return item.name === "Total dépense" || item.name === "Total Dépense";
            });

            return totalRow ? (parseFloat(totalRow.ResteADepenser) || 0) : 0;
        },

        // Calcul direct du ratio depuis les données (comme pour Total Dépensé)
        calculateRatio: function (aData) {
            if (!aData || !aData.length) return "0";

            // Trouver la ligne "Total facturation"
            const totalFacturation = aData.find(function (item) {
                return item.name === "Total facturation" || item.name === "Total Facturation";
            });

            // Trouver la ligne "Total dépense"
            const totalDepense = aData.find(function (item) {
                return item.name === "Total dépense" || item.name === "Total Dépense";
            });

            const facture = totalFacturation ? (parseFloat(totalFacturation.ResteAFacturer) || 0) : 0;
            const depense = totalDepense ? (parseFloat(totalDepense.ResteADepenser) || 0) : 0;

            // Éviter la division par zéro
            if (facture === 0) return "0";

            // Calculer le ratio (dépenses / facturation) et formater
            const ratio = (depense / facture) * 100;
            return ratio === 0 ? "0" : ratio.toFixed(1);
        },

        // Formatter pour la couleur basé directement sur les données
        formatRatioColorFromData: function (aData) {
            const ratioValue = this.calculateRatioValue(aData);
            const numValue = parseFloat(ratioValue);

            if (numValue > 100) return "Error";
            if (numValue < 80) return "Good";
            return "Critical";
        },

        // Formatter pour l'indicateur basé directement sur les données
        formatRatioIndicatorFromData: function (aData) {
            const ratioValue = this.calculateRatioValue(aData);
            const numValue = parseFloat(ratioValue);

            if (numValue > 100) return "Down";
            if (numValue < 80) return "Up";
            return "None";
        },

        // Méthode utilitaire pour calculer la valeur numérique du ratio
        calculateRatioValue: function (aData) {
            if (!aData || !aData.length) return 0;

            const totalFacturation = aData.find(function (item) {
                return item.name === "Total facturation" || item.name === "Total Facturation";
            });

            const totalDepense = aData.find(function (item) {
                return item.name === "Total dépense" || item.name === "Total Dépense";
            });

            const facture = totalFacturation ? (parseFloat(totalFacturation.ResteAFacturer) || 0) : 0;
            const depense = totalDepense ? (parseFloat(totalDepense.ResteADepenser) || 0) : 0;

            if (facture === 0) return 0;

            return (depense / facture) * 100;
        },


        recalculateTotalsForLine: function (bindingContext) {
            var utilitiesModel = this.getView().getModel("utilities");
            var lineData = bindingContext.getObject();

            // Calculate totals (same logic as above)
            var totalN = this.calculateMonthlyTotal(lineData, "N");
            var totalN1 = this.calculateMonthlyTotal(lineData, "N1");
            var audela = this.calculateAudela(lineData, totalN, totalN1);

            // Update the line
            var path = bindingContext.getPath();
            utilitiesModel.setProperty(path + "/TotalN", totalN);
            utilitiesModel.setProperty(path + "/TotalN1", totalN1);
            utilitiesModel.setProperty(path + "/Audela", audela);

            // Update all parent totals in the hierarchy
            this.updateAllTotalsInHierarchy();
        },

        // Helper method to calculate monthly total for a year
        calculateMonthlyTotal: function (lineData, year) {
            var months = year === "N" ?
                ["JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                    "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN"] :
                ["JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                    "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"];

            var total = 0;
            months.forEach(function (month) {
                total += Number(lineData[month]) || 0;
            });

            return Math.round(total * 100) / 100;
        },

        // Helper method to calculate audela
        calculateAudela: function (lineData, totalN, totalN1) {
            var audela = 0;
            if (lineData.FacturationDepense === 'Facturation') {
                var resteAFacturer = Number(lineData.ResteAFacturer) || 0;
                audela = resteAFacturer - (totalN + totalN1);
            } else if (lineData.FacturationDepense === 'Dépense' || lineData.FacturationDepense === 'Depense') {
                var resteADepenser = Number(lineData.ResteADepenser) || 0;
                audela = resteADepenser - (totalN + totalN1);
            }

            return Math.round(audela * 100) / 100;
        },

        // Update all hierarchy totals
        updateAllTotalsInHierarchy: function () {
            // This will recalculate all parent nodes and global totals
            this.updateTotals();
        }
    });
});