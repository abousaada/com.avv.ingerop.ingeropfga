
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.BudgetPxAutre", {
        // Fragment-specific methods


        preparePxAutreTreeData: function() {
            var self = this;
            var pxAutres = this.getView().getModel("utilities").getProperty("/pxAutres");
        
            var buildTree = function(items) {
                var treeData = [];
                var fgaGroups = {};
        
                if (!items) return treeData;
        
                items.forEach(function(item) {
                    item.isTotalRow = false;
        
                    if (!fgaGroups[item.BusinessNo]) {
                        fgaGroups[item.BusinessNo] = {
                            name: item.BusinessNo,
                            isNode: true,
                            isL0: true,
                            children: {}
                        };
                    }
        
                    if (!fgaGroups[item.BusinessNo].children[item.Regroupement]) {
                        fgaGroups[item.BusinessNo].children[item.Regroupement] = {
                            name: item.Regroupement, // Store the regroupement name here
                            isNode: true,
                            isL0: false,
                            children: [],
                            totals: {
                                VoyageDeplacement: 0,
                                AutresFrais: 0,
                                CreancesDouteuses: 0,
                                EtudesTravaux: 0,
                                SinistreContentieux: 0,
                                AleasDivers: 0,
                                FinAffaire: 0
                            }
                        };
                    }
        
                    var regroupement = fgaGroups[item.BusinessNo].children[item.Regroupement];
                    regroupement.children.push(item);
        
                    // Accumulate totals for the Regroupement
                    regroupement.totals.VoyageDeplacement += Number(item.VoyageDeplacement) || 0;
                    regroupement.totals.AutresFrais += Number(item.AutresFrais) || 0;
                    regroupement.totals.CreancesDouteuses += Number(item.CreancesDouteuses) || 0;
                    regroupement.totals.EtudesTravaux += Number(item.EtudesTravaux) || 0;
                    regroupement.totals.SinistreContentieux += Number(item.SinistreContentieux) || 0;
                    regroupement.totals.AleasDivers += Number(item.AleasDivers) || 0;
                    regroupement.totals.FinAffaire += Number(item.FinAffaire) || 0;
                });
        
                // Convert children objects to arrays while preserving names
                for (var fga in fgaGroups) {
                    var fgaGroup = fgaGroups[fga];
                    
                    // Convert children object to array of regroupements with their names
                    var regroupementArray = [];
                    for (var regroupementKey in fgaGroup.children) {
                        if (fgaGroup.children.hasOwnProperty(regroupementKey)) {
                            var regroupement = fgaGroup.children[regroupementKey];
                            // Add total row with the regroupement's name
                            regroupement.children.push(
                                self.createRegroupementTotalRow(regroupement.totals, regroupement.name)
                            );
                            regroupementArray.push(regroupement);
                        }
                    }
                    
                    fgaGroup.children = regroupementArray;
                    treeData.push(fgaGroup);
                }
        
                return treeData;
            };
        
            // Build trees 
            var pxAutresTreeData = buildTree(pxAutres);
        
            // Calculate global totals
            var globalTotals = this.calculateGlobalTotals(pxAutresTreeData);
        
            // Create flat summary rows (level 0)
            var summaryRows = [
                this.createSummaryRow("Total Acquis", globalTotals.totalAcquis, false),
                this.createSummaryRow("Cumulé", globalTotals.cumule, false),
                this.createSummaryRow("Pourcentage", globalTotals.pourcentage, true),
                this.createSummaryRow("RAD", globalTotals.rad, false)
            ];
        
            // Add summary rows directly to the root array (as level 0 items)
            pxAutresTreeData = pxAutresTreeData.concat(summaryRows);
        
            // Set tree
            this.getView().getModel("utilities").setProperty("/PxAutreHierarchyWithTotals", pxAutresTreeData);
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

        updateTotals: function() {
            var oModel = this.oView.getModel("utilities");
            var aData = oModel.getProperty("/PxAutreHierarchyWithTotals");
        
            // Filter out all total rows (both global and regroupement)
            var aTreeData = aData.filter(function(oItem) {
                return !oItem.isTotalRow;
            });
        
            // Recalculate regroupement totals
            aTreeData.forEach(function(fgaGroup) {

                var regroupementEntries = [];
                
                // First collect all regroupements with their names
                for (var regroupementKey in fgaGroup.children) {
                    if (fgaGroup.children.hasOwnProperty(regroupementKey)) {
                        var regroupement = fgaGroup.children[regroupementKey];
                        regroupementEntries.push({
                            name: regroupement.name, // Use the name property we stored during creation
                            data: regroupement
                        });
                    }
                }
                
                // Now process each regroupement
                fgaGroup.children = regroupementEntries.map(function(entry) {
                    var regroupement = entry.data;
                    
                    // Reset totals
                    regroupement.totals = {
                        VoyageDeplacement: 0,
                        AutresFrais: 0,
                        CreancesDouteuses: 0,
                        EtudesTravaux: 0,
                        SinistreContentieux: 0,
                        AleasDivers: 0,
                        FinAffaire: 0
                    };
        
                    // Recalculate totals
                    regroupement.children.forEach(function(item) {
                        if (!item.isTotalRow) {
                            regroupement.totals.VoyageDeplacement += Number(item.VoyageDeplacement) || 0;
                            regroupement.totals.AutresFrais += Number(item.AutresFrais) || 0;
                            regroupement.totals.CreancesDouteuses += Number(item.CreancesDouteuses) || 0;
                            regroupement.totals.EtudesTravaux += Number(item.EtudesTravaux) || 0;
                            regroupement.totals.SinistreContentieux += Number(item.SinistreContentieux) || 0;
                            regroupement.totals.AleasDivers += Number(item.AleasDivers) || 0;
                            regroupement.totals.FinAffaire += Number(item.FinAffaire) || 0;
                        }
                    });
        
                    // Update the regroupement total row
                    var existingTotalIndex = regroupement.children.findIndex(function(child) {
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
            var summaryRows = [
                this.createSummaryRow("Total Acquis", globalTotals.totalAcquis, false),
                this.createSummaryRow("Cumulé", globalTotals.cumule, false),
                this.createSummaryRow("Pourcentage", globalTotals.pourcentage, true),
                this.createSummaryRow("RAD", globalTotals.rad, false)
            ];
        
            // Update the model
            oModel.setProperty("/PxAutreHierarchyWithTotals", aTreeData.concat(summaryRows));
        },

        createRegroupementTotalRow: function(totals, regroupementName) {
            return {
                name: "Total " + regroupementName,
                isTotalRow: true,
                isNode: false,
                isRegroupementTotal: true,
                VoyageDeplacement: totals.VoyageDeplacement,
                AutresFrais: totals.AutresFrais,
                CreancesDouteuses: totals.CreancesDouteuses,
                EtudesTravaux: totals.EtudesTravaux,
                SinistreContentieux: totals.SinistreContentieux,
                AleasDivers: totals.AleasDivers,
                FinAffaire: totals.FinAffaire
            };
        },

        calculateGlobalTotals: function (items) {
            var totals = {
                totalAcquis: {
                    VoyageDeplacement: 0,
                    AutresFrais: 0,
                    CreancesDouteuses: 0,
                    EtudesTravaux: 0,
                    SinistreContentieux: 0,
                    AleasDivers: 0,
                    FinAffaire: 0
                },
                cumule: {
                    VoyageDeplacement: 0,
                    AutresFrais: 0,
                    CreancesDouteuses: 0,
                    EtudesTravaux: 0,
                    SinistreContentieux: 0,
                    AleasDivers: 0,
                    FinAffaire: 0
                }
            };

            var sumValues = function (node) {
                if (node.children) {
                    node.children.forEach(sumValues);
                } else if (!node.isNode) {
                    totals.totalAcquis.VoyageDeplacement += Number(node.VoyageDeplacement) || 0;
                    totals.totalAcquis.AutresFrais += node.AutresFrais || 0;
                    // Don't forget to add the other columns
                }
            };

            items.forEach(sumValues);

            // Calculate percentages
            totals.pourcentage = {
                VoyageDeplacement: totals.totalAcquis.VoyageDeplacement > 0 ?
                    (totals.cumule.VoyageDeplacement / totals.totalAcquis.VoyageDeplacement * 100) : 0,
                AutresFrais: totals.totalAcquis.AutresFrais > 0 ?
                    (totals.cumule.AutresFrais / totals.totalAcquis.AutresFrais * 100) : 0,
                CreancesDouteuses: totals.totalAcquis.CreancesDouteuses > 0 ?
                    (totals.cumule.CreancesDouteuses / totals.totalAcquis.CreancesDouteuses * 100) : 0,
                EtudesTravaux: totals.totalAcquis.EtudesTravaux > 0 ?
                    (totals.cumule.EtudesTravaux / totals.totalAcquis.EtudesTravaux * 100) : 0,
                SinistreContentieux: totals.totalAcquis.SinistreContentieux > 0 ?
                    (totals.cumule.SinistreContentieux / totals.totalAcquis.SinistreContentieux * 100) : 0,
                AleasDivers: totals.totalAcquis.AleasDivers > 0 ?
                    (totals.cumule.AleasDivers / totals.totalAcquis.AleasDivers * 100) : 0,
                FinAffaire: totals.totalAcquis.FinAffaire > 0 ?
                    (totals.cumule.FinAffaire / totals.totalAcquis.FinAffaire * 100) : 0
            };

            // Calculate RAD values
            totals.rad = {
                VoyageDeplacement: totals.totalAcquis.VoyageDeplacement - totals.cumule.VoyageDeplacement,
                AutresFrais: totals.totalAcquis.AutresFrais - totals.cumule.AutresFrais,
                CreancesDouteuses: totals.totalAcquis.CreancesDouteuses - totals.cumule.CreancesDouteuses,
                EtudesTravaux: totals.totalAcquis.EtudesTravaux - totals.cumule.EtudesTravaux,
                SinistreContentieux: totals.totalAcquis.SinistreContentieux - totals.cumule.SinistreContentieux,
                AleasDivers: totals.totalAcquis.AleasDivers - totals.cumule.AleasDivers,
                FinAffaire: totals.totalAcquis.FinAffaire - totals.cumule.FinAffaire
            };

            return totals;
        },

        createSummaryRow: function (name, values, isPercentage) {
            var row = {
                name: name,
                isTotalRow: true,
                isNode: false,
                VoyageDeplacement: isPercentage ? values.VoyageDeplacement.toFixed(2) + "%" : values.VoyageDeplacement,
                AutresFrais: isPercentage ? values.AutresFrais.toFixed(2) + "%" : values.AutresFrais,
                CreancesDouteuses: isPercentage ? values.CreancesDouteuses.toFixed(2) + "%" : values.CreancesDouteuses,
                EtudesTravaux: isPercentage ? values.EtudesTravaux.toFixed(2) + "%" : values.EtudesTravaux,
                SinistreContentieux: isPercentage ? values.SinistreContentieux.toFixed(2) + "%" : values.SinistreContentieux,
                AleasDivers: isPercentage ? values.AleasDivers.toFixed(2) + "%" : values.AleasDivers,
                FinAffaire: isPercentage ? values.FinAffaire.toFixed(2) + "%" : values.FinAffaire
            };

            return row;
        },

    });
});

