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

                    // === Applique la configuration d'édition ===
                    Object.keys(editableConfig.N).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N[key];
                        // Stocke le nom de la propriété pour référence
                        item["monthProperty" + key] = key;
                    });
                    Object.keys(editableConfig.N1).forEach(function (key) {
                        item["isEditable" + key] = editableConfig.N1[key];
                        item["monthProperty" + key] = key;
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


        // Ajoutez un gestionnaire pour capturer le dernier input modifié
        onInputChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sBindingPath = oInput.getBindingPath("value");
            // Extraire le nom de la propriété du mois (ex: "JanvN", "FevrN1", etc.)
            const monthProperty = sBindingPath.split("/").pop();
            oInput.data("monthProperty", monthProperty);
            this._lastModifiedInput = oInput;
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
            const oModel = this.getView().getModel("utilities");
            const currentDataMode = oModel.getProperty("/DataMode");

            // Si on est déjà en mode manuel, pas besoin de confirmation
            if (currentDataMode === "M") {
                this._processUpdate(oEvent);
                return;
            }

            // Si on est en mode automatique, demander confirmation
            this._showManualModeConfirmation(oEvent);
        },


        onSubmit1: function (oEvent) {

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

        _showManualModeConfirmation: function (oEvent) {
            MessageBox.confirm(
                this._getConfirmationText(),
                {
                    title: "Passage en mode manuel",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this._processUpdate(oEvent);
                            this._switchToManualMode();
                            MessageToast.show("Mode manuel activé - Les autres valeurs de l'affaire ont été mises à zéro");
                        } else {
                            this._revertInputValue(oEvent);
                        }
                    }.bind(this),
                    emphasizedAction: MessageBox.Action.OK
                }
            );
        },

        _getConfirmationText: function () {
            return "Êtes-vous sûr de vouloir passer en mode manuel ?\n\n" +
                "✓ Le système basculera définitivement en mode manuel\n" +
                "✓ Les valeurs calculées automatiquement seront écrasées\n" +
                "✓ Les autres mois de la même affaire seront remis à zéro\n\n" +
                "Cette action est irréversible pour cette affaire.";
        },

        _processUpdate: function (oEvent) {
            const oModel = this.getView().getModel("utilities");
            const oInput = oEvent.getSource();
            const oBindingContext = oInput.getBindingContext("utilities");

            try {
                oModel.checkUpdate(true);

                // Si on passe en mode manuel, réinitialiser les autres valeurs
                if (oModel.getProperty("/DataMode") === "M") {
                    this._resetOtherMonths(oBindingContext);
                }

                setTimeout(() => {
                    this.updateTotals();
                }, 50);

            } catch (error) {
                console.error("Update failed:", error);
                this._revertInputValue(oEvent);
            }
        },

        _switchToManualMode: function () {
            const oModel = this.getView().getModel("utilities");
            oModel.setProperty("/DataMode", "M");

            // Mettre à jour le MessageStrip
            const messageStrip = this.byId("PrevisionnelTreeTable").getExtension()[0];
            if (messageStrip) {
                messageStrip.setText("Mode manuel : les valeurs affichées ont été saisies manuellement.");
                messageStrip.setType("Information");
            }
        },

        _resetOtherMonths: function (oBindingContext) {
            if (!oBindingContext) return;

            const oModel = this.getView().getModel("utilities");
            const oData = oBindingContext.getObject();

            // Réinitialiser tous les autres mois de la même affaire à 0
            const monthsToReset = [
                "JanvN", "FevrN", "MarsN", "AvrN", "MaiN", "JuinN",
                "JuilN", "AoutN", "SeptN", "OctN", "NovN", "DecN",
                "JanvN1", "FevrN1", "MarsN1", "AvrN1", "MaiN1", "JuinN1",
                "JuilN1", "AoutN1", "SeptN1", "OctN1", "NovN1", "DecN1"
            ];

            // Garder une référence à la valeur qu'on vient de modifier
            const modifiedInput = this._lastModifiedInput;
            if (modifiedInput) {
                const modifiedMonth = modifiedInput.data("monthProperty");

                monthsToReset.forEach(function (month) {
                    if (month !== modifiedMonth && oData[month] !== 0) {
                        oModel.setProperty(oBindingContext.getPath() + "/" + month, 0);
                    }
                });
            }
        },

        _revertInputValue: function (oEvent) {
            const oInput = oEvent.getSource();
            // Revenir à la valeur précédente
            oInput.setValue(oInput.getBindingContext("utilities").getObject()[oInput.getBindingPath("value")]);
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
                totalFacturation: this._createEmptyMonthlyTotals(), // Use monthly totals instead
                totalDepense: this._createEmptyMonthlyTotals()     // Use monthly totals instead
            };

            const sumValues = (node) => {
                if (node.children && node.children.length > 0) {
                    node.children.forEach(sumValues);
                    return;
                }

                if (node.isNode || node.isTotalRow || node.isRegroupementTotal) return;

                const type = (node.FacturationDepense || "").toLowerCase();
                const target =
                    type === "facturation"
                        ? totals.totalFacturation
                        : type === "dépense" || type === "depense"
                            ? totals.totalDepense
                            : null;

                if (target) {
                    // Sum all properties including monthly values
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
                isRegroupementTotal: false
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
    });
});