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

                // Étape 1: Organiser les données (comme dans votre ancienne méthode)
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
                        if (item.Description && item.Description !== item.MissionId) {
                            item.name = item.FacturationDepense + " - " + item.Description;
                        } else if (item.Libelle && item.Libelle !== item.MissionId && item.Libelle !== "Affaire" + item.MissionId) {
                            item.name = item.FacturationDepense + " - " + item.Libelle;
                        } else {
                            item.name = item.FacturationDepense + " - " + item.MissionId;
                        }
                    } else {
                        item.name = item.MissionId || "FGA0";
                    }

                    // === Initialize BusinessNo group ===
                    if (!fgaGroups[item.BusinessNo]) {
                        fgaGroups[item.BusinessNo] = {
                            businessNo: item.BusinessNo,
                            rootNode: null,
                            directLines: {
                                facturation: [],
                                depense: []
                            },
                            missions: {},  // Toutes les missions avec leurs lignes
                            level2Missions: []  // Missions niveau 2 séparées
                        };
                    }

                    var fgaGroup = fgaGroups[item.BusinessNo];
                    var hierarchyLevel = item.HierarchyLevel || 1;

                    // === CAS 1 : LIGNE PRINCIPALE FGA0 ===
                    if (item.Regroupement === "FGA0") {
                        if (item.MissionId === "FGA0" || item.isNode) {
                            item.isNode = true;
                            item.isL0 = true;
                            fgaGroup.rootNode = item;
                            fgaGroup.rootNode.children = [];
                            item.name = item.MissionId || "FGA0";
                        } else {
                            var lineType = (item.FacturationDepense || "").toLowerCase();
                            if (lineType === "facturation") {
                                fgaGroup.directLines.facturation.push(item);
                            } else if (lineType === "dépense" || lineType === "depense") {
                                fgaGroup.directLines.depense.push(item);
                            }
                        }
                    }
                    // === CAS 2 : MISSIONS AVEC HIÉRARCHIE ===
                    else {
                        // Stocker les missions niveau 2 séparément
                        if (hierarchyLevel === 2) {
                            fgaGroup.level2Missions.push(item);
                        } else {
                            // Pour les missions niveau 1, utiliser votre ancienne logique
                            if (!fgaGroup.missions[item.MissionId]) {
                                fgaGroup.missions[item.MissionId] = {
                                    name: item.MissionId,
                                    description: item.Description,
                                    isNode: true,
                                    isL1: true,
                                    regroupement: item.Regroupement,
                                    facturationLines: [],
                                    depenseLines: [],
                                    totals: self._createEmptyMonthlyTotals(),
                                    hierarchyLevel: hierarchyLevel
                                };
                            }

                            var mission = fgaGroup.missions[item.MissionId];

                            // Separate lines by Facturation/Depense (ancienne logique)
                            var lineType = (item.FacturationDepense || "").toLowerCase();
                            if (lineType === "facturation") {
                                mission.facturationLines.push(item);
                            } else if (lineType === "dépense" || lineType === "depense") {
                                mission.depenseLines.push(item);
                            }

                            // Cumulate totals for the mission (ancienne logique)
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
                    }
                });

                // Étape 2: Construire la hiérarchie avec les niveaux
                for (var fga in fgaGroups) {
                    var group = fgaGroups[fga];
                    var rootChildren = [];

                    // === ADD DIRECT LINES UNDER FGA0 (ancienne logique) ===
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

                    // === ATTACHER LES MISSIONS NIVEAU 2 À LEURS PARENTS NIVEAU 1 ===
                    group.level2Missions.forEach(function (level2Item) {
                        var parentMissionId = self._findParentMissionId(level2Item.MissionId, group.missions);

                        if (parentMissionId && group.missions[parentMissionId]) {
                            var parentMission = group.missions[parentMissionId];

                            // Créer un conteneur pour la mission niveau 2 si elle n'existe pas
                            if (!parentMission.level2Missions) {
                                parentMission.level2Missions = [];
                            }

                            parentMission.level2Missions.push(level2Item);
                        }
                    });

                    // === BUILD MISSIONS STRUCTURE (ancienne logique modifiée) ===
                    var missionsArray = [];
                    for (var missionKey in group.missions) {
                        if (group.missions.hasOwnProperty(missionKey)) {
                            var mission = group.missions[missionKey];

                            // Create mission children array
                            mission.children = [];

                            // === AJOUTER LES MISSIONS NIVEAU 2 COMME ENFANTS ===
                            if (mission.level2Missions && mission.level2Missions.length > 0) {
                                mission.level2Missions.forEach(function (level2Item) {
                                    var level2Node = {
                                        ...level2Item,
                                        isNode: true,
                                        isL2: true,
                                        name: level2Item.MissionId,
                                        children: self._buildLevel2MissionChildren(level2Item)
                                    };
                                    mission.children.push(level2Node);
                                });
                            }

                            // === ANCIENNE LOGIQUE POUR LES LIGNES DIRECTES DE LA MISSION ===
                            // Add Facturation section header if there are facturation lines
                            if (mission.facturationLines.length > 0) {
                                mission.children.push({
                                    name: "Lignes Facturation",
                                    isNode: true,
                                    isL2: mission.level2Missions && mission.level2Missions.length > 0 ? true : false,
                                    isL3: mission.level2Missions && mission.level2Missions.length > 0 ? true : false,
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
                                    isL2: mission.level2Missions && mission.level2Missions.length > 0 ? true : false,
                                    isL3: mission.level2Missions && mission.level2Missions.length > 0 ? true : false,
                                    isSectionHeader: true,
                                    FacturationDepense: "Dépense",
                                    children: mission.depenseLines
                                });

                                // Add Dépense total
                                mission.children.push(
                                    self.createMissionTypeTotalRow(mission.depenseLines, "Dépense", mission.name)
                                );
                            }

                            // Add Mission total (seulement si la mission a des lignes directes)
                            if (mission.facturationLines.length > 0 || mission.depenseLines.length > 0) {
                                mission.children.push(
                                    self.createMissionTotalRow(mission.totals, mission.name)
                                );
                            }

                            missionsArray.push(mission);
                        }
                    }

                    // === GROUP MISSIONS BY REGROUPEMENT (ancienne logique) ===
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

            // DEBUG
            console.log("=== STRUCTURE ARBRE FINALE ===");
            function debugTree(node, level = 0) {
                var indent = "  ".repeat(level);
                var type = node.isL0 ? "L0" : node.isL1 ? "L1" : node.isL2 ? "L2" : node.isL3 ? "L3" : "Data";
                console.log(indent + type + ": " + node.name + " (" + (node.children ? node.children.length : 0) + " enfants)");

                if (node.children) {
                    node.children.forEach(function (child) {
                        debugTree(child, level + 1);
                    });
                }
            }

            if (previsionelTreeData.length > 0) {
                previsionelTreeData.forEach(function (root, index) {
                    console.log("ARBRE " + index + ":");
                    debugTree(root);
                });
            }

            // Calculate global totals and set tree (ancienne logique)
            var globalTotals = this.calculateGlobalTotals(previsionelTreeData);
            var summaryRows = [
                this.createSummaryRow("Total facturation", globalTotals.totalFacturation, false),
                this.createSummaryRow("Total dépense", globalTotals.totalDepense, false)
            ];
            previsionelTreeData = previsionelTreeData.concat(summaryRows);

            this.getView().getModel("utilities").setProperty("/previsionelHierarchyWithTotals", previsionelTreeData);
            var totalRows = this.countRows(previsionelTreeData);
            this.updateRowCountPrev(totalRows);
        },

        // Fonction pour construire les enfants d'une mission niveau 2
        _buildLevel2MissionChildren: function (level2Mission) {
            var children = [];

            // Pour une mission niveau 2, on ajoute directement ses lignes
            // (car dans votre CDS, les missions niveau 2 ont déjà FacturationDepense défini)
            if (level2Mission.FacturationDepense) {
                var lineNode = {
                    ...level2Mission,
                    isNode: false,
                    isL3: true,
                    name: level2Mission.FacturationDepense + " - " + (level2Mission.Description || level2Mission.MissionId)
                };
                children.push(lineNode);
            }

            return children;
        },

        // Fonction pour trouver le parent d'une mission niveau 2
        _findParentMissionId: function (level2MissionId, missionsMap) {
            var level2Parts = level2MissionId.split('-');
            if (level2Parts.length !== 3) return null;

            var project = level2Parts[1];
            var suffix = level2Parts[2];

            // Chercher les missions niveau 1 qui pourraient être le parent
            for (var missionId in missionsMap) {
                var mission = missionsMap[missionId];

                if (mission.hierarchyLevel === 1) {
                    var parentParts = missionId.split('-');
                    if (parentParts.length !== 3) continue;

                    var parentProject = parentParts[1];
                    var parentSuffix = parentParts[2];

                    // Logique de matching basée sur le pattern
                    if (parentProject === project &&
                        parentParts[0].includes('XXXX') &&
                        level2Parts[0].substring(0, 8) === parentParts[0].substring(0, 8)) {
                        return missionId;
                    }
                }
            }

            return null;
        },

        // Nouvelle fonction pour vérifier si une mission niveau 2 est enfant d'une mission niveau 1
        _isChildOf: function (level2MissionId, level1MissionId) {
            // Logique de matching basée sur le pattern
            // Exemple: MED1MED1MED1-00229-003 est enfant de MED1MED1XXXX-00229-002

            var level2Parts = level2MissionId.split('-');
            var level1Parts = level1MissionId.split('-');

            if (level2Parts.length !== 3 || level1Parts.length !== 3) return false;

            // Vérifier si les projets correspondent
            if (level2Parts[1] !== level1Parts[1]) return false;

            // Vérifier le pattern: les 8 premiers caractères doivent correspondre
            var level2Prefix = level2Parts[0].substring(0, 8);
            var level1Prefix = level1Parts[0].substring(0, 8);

            return level2Prefix === level1Prefix;
        },

        // Fonction pour construire les enfants d'une mission
        _buildMissionChildren: function (mission) {
            var children = [];

            // Ajouter les sections Facturation
            if (mission.facturationLines && mission.facturationLines.length > 0) {
                children.push({
                    name: "Lignes Facturation",
                    isNode: true,
                    isL3: true,
                    isSectionHeader: true,
                    FacturationDepense: "Facturation",
                    children: mission.facturationLines
                });
            }

            // Ajouter les sections Dépense
            if (mission.depenseLines && mission.depenseLines.length > 0) {
                children.push({
                    name: "Lignes Dépense",
                    isNode: true,
                    isL3: true,
                    isSectionHeader: true,
                    FacturationDepense: "Dépense",
                    children: mission.depenseLines
                });
            }

            return children;
        },

        preparePrevisionelTreeData11: function () {
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
            this.updateRowCountPrev(totalRows);
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


    });
});