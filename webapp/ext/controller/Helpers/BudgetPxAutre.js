
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.BudgetPxAutre", {
        // Fragment-specific methods

        onInit: function () {

        },

        preparePxAutreTreeData: function () {
            var pxAutres = this.getView().getModel("utilities").getProperty("/pxAutres");

            // Create tree builder function (unchanged)
            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                items.forEach(function (item) {
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
                            name: item.Regroupement,
                            isNode: true,
                            isL0: false,
                            children: []
                        };
                    }

                    fgaGroups[item.BusinessNo].children[item.Regroupement].children.push(item);
                });

                // Convert children objects to arrays
                for (var fga in fgaGroups) {
                    fgaGroups[fga].children = Object.values(fgaGroups[fga].children);
                    treeData.push(fgaGroups[fga]);
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

        updateTotals: function () {
            var oModel = this.oView.getModel("utilities");
            var aData = oModel.getProperty("/PxAutreHierarchyWithTotals");

            // Filter out the summary rows (we'll recreate them)
            var aTreeData = aData.filter(function (oItem) {
                return !oItem.isTotalRow;
            });

            // Calculate new totals
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

