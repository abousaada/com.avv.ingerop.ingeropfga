
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.BudgetPxAutre", {
        // Fragment-specific methods


        preparePxAutreTreeData: function () {
            var self = this;
            var pxAutres = this.getView().getModel("utilities").getProperty("/pxAutres");

            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                items.forEach(function (item) {
                    item.isTotalRow = false;
                    
                    
                    // Calculate FinAffaire as sum of other columns for each line
                    item.FinAffaire = (Number(item.VoyageDeplacement) || 0) +
                        (Number(item.AutresFrais) || 0) +
                        (Number(item.CreancesDouteuses) || 0) +
                        (Number(item.EtudesTravaux) || 0) +
                        (Number(item.SinistreContentieux) || 0) +
                        (Number(item.AleasDivers) || 0);
                    

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
                    if(item.Statut === "Acquis"){
                    regroupement.totals.VoyageDeplacement += Number(item.VoyageDeplacement) || 0;
                    regroupement.totals.AutresFrais += Number(item.AutresFrais) || 0;
                    regroupement.totals.CreancesDouteuses += Number(item.CreancesDouteuses) || 0;
                    regroupement.totals.EtudesTravaux += Number(item.EtudesTravaux) || 0;
                    regroupement.totals.SinistreContentieux += Number(item.SinistreContentieux) || 0;
                    regroupement.totals.AleasDivers += Number(item.AleasDivers) || 0;
                    regroupement.totals.FinAffaire += Number(item.FinAffaire) || 0;
                    }
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
                this.createSummaryRow("Cumule", globalTotals.cumule, false),
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
                    regroupement.totals = {
                        isNode: false,
                        VoyageDeplacement: 0,
                        AutresFrais: 0,
                        CreancesDouteuses: 0,
                        EtudesTravaux: 0,
                        SinistreContentieux: 0,
                        AleasDivers: 0,
                        FinAffaire: 0
                    };

                    // Recalculate totals
                    regroupement.children.forEach(function (item) {
                        if (!item.isTotalRow) {

                            item.FinAffaire = (Number(item.VoyageDeplacement) || 0) +
                                (Number(item.AutresFrais) || 0) +
                                (Number(item.CreancesDouteuses) || 0) +
                                (Number(item.EtudesTravaux) || 0) +
                                (Number(item.SinistreContentieux) || 0) +
                                (Number(item.AleasDivers) || 0);
                            
                            if(item.Statut === "Acquis"){
                            regroupement.totals.VoyageDeplacement += Number(item.VoyageDeplacement) || 0;
                            regroupement.totals.AutresFrais += Number(item.AutresFrais) || 0;
                            regroupement.totals.CreancesDouteuses += Number(item.CreancesDouteuses) || 0;
                            regroupement.totals.EtudesTravaux += Number(item.EtudesTravaux) || 0;
                            regroupement.totals.SinistreContentieux += Number(item.SinistreContentieux) || 0;
                            regroupement.totals.AleasDivers += Number(item.AleasDivers) || 0;
                            regroupement.totals.FinAffaire += Number(item.FinAffaire) || 0;
                            }
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
            var summaryRows = [
                this.createSummaryRow("Total Acquis", globalTotals.totalAcquis, false),
                this.createSummaryRow("Cumule", globalTotals.cumule, false),
                this.createSummaryRow("Pourcentage", globalTotals.pourcentage, true),
                this.createSummaryRow("RAD", globalTotals.rad, false)
            ];

            // Update the model
            oModel.setProperty("/PxAutreHierarchyWithTotals", aTreeData.concat(summaryRows));
        },

        createRegroupementTotalRow: function (totals, regroupementName) {
            return {
                name: "Total " + regroupementName + " acquis",
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
                    FinAffaire: 0,

                    GLAccountVoyageDeplacement: '',
                    GLAccountAutresFrais: '',
                    GLAccountCreancesDouteuses: '',
                    GLAccountEtudesTravaux: '',
                    GLAccountSinistreContentieux: '',
                    GLAccountAleasDivers: '',
                    GLAccountFinAffaire: ''

                }
            };

            var sumValues = function (node) {
                if (node.children) {
                    if (node.isNode) {
                        node.children.forEach(function (child) {
                            if (!child.isTotalRow && !child.isRegroupementTotal) {
                                sumValues(child);
                            }
                        });
                    }
                } else if (!node.isNode && node.Statut === "Acquis") {
                    totals.totalAcquis.VoyageDeplacement += Number(node.VoyageDeplacement) || 0;
                    totals.totalAcquis.AutresFrais += Number(node.AutresFrais) || 0;
                    totals.totalAcquis.CreancesDouteuses += Number(node.CreancesDouteuses) || 0;
                    totals.totalAcquis.EtudesTravaux += Number(node.EtudesTravaux) || 0;
                    totals.totalAcquis.SinistreContentieux += Number(node.SinistreContentieux) || 0;
                    totals.totalAcquis.AleasDivers += Number(node.AleasDivers) || 0;
                    totals.totalAcquis.FinAffaire += Number(node.FinAffaire) || 0;

                    // Read cumulé from entity
                    totals.cumule.VoyageDeplacement = Number(node.CumulVoyageDeplacement) || 0;
                    totals.cumule.AutresFrais = Number(node.CumulAutresFrais) || 0;
                    totals.cumule.CreancesDouteuses = Number(node.CumulCreancesDouteuses) || 0;
                    totals.cumule.EtudesTravaux = Number(node.CumulEtudesTravaux) || 0;
                    totals.cumule.SinistreContentieux = Number(node.CumulSinistreContentieux) || 0;
                    totals.cumule.AleasDivers = Number(node.CumulAleasDivers) || 0;
                    totals.cumule.FinAffaire = Number(node.CumulFinAffaire) || 0;

                    // Read GlAccounts from entity
                    totals.cumule.GLAccountVoyageDeplacement = node.GLAccountVoyageDeplacement;
                    totals.cumule.GLAccountAutresFrais = node.GLAccountAutresFrais;
                    totals.cumule.GLAccountCreancesDouteuses = node.GLAccountCreancesDouteuses;
                    totals.cumule.GLAccountEtudesTravaux = node.GLAccountEtudesTravaux;
                    totals.cumule.GLAccountSinistreContentieux = node.GLAccountSinistreContentieux;
                    totals.cumule.GLAccountAleasDivers = node.GLAccountAleasDivers;
                    totals.cumule.GLAccountFinAffaire = node.GLAccountFinAffaire;
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
                FinAffaire: isPercentage ? values.FinAffaire.toFixed(2) + "%" : values.FinAffaire,

                GLAccountVoyageDeplacement: values.GLAccountVoyageDeplacement,
                GLAccountAutresFrais: values.GLAccountAutresFrais,
                GLAccountCreancesDouteuses: values.GLAccountCreancesDouteuses,
                GLAccountEtudesTravaux: values.GLAccountEtudesTravaux,
                GLAccountSinistreContentieux: values.GLAccountSinistreContentieux,
                GLAccountAleasDivers: values.GLAccountAleasDivers,
                GLAccountFinAffaire: values.GLAccountFinAffaire,
            };

            return row;
        },



        onCumuleClick: async function (oEvent) {
            var oItem = oEvent.getSource().getBindingContext("utilities").getObject();
            var oView = this.getView();

            var oItem = oEvent.getSource().getBindingContext("utilities").getObject();
            var sColumnId = oEvent.getSource().data("columnId"); // from BudgetPx view

            // Determine which GLAccount to show based on the clicked column
            var sGLAccount = "";

            switch (sColumnId) {
                case "VoyageDeplacement":
                    sGLAccount = oItem.GLAccountVoyageDeplacement;
                    break;
                case "AutresFrais":
                    sGLAccount = oItem.GLAccountAutresFrais;
                    break;
                case "CreancesDouteuses":
                    sGLAccount = oItem.GLAccountCreancesDouteuses;
                    break;
                case "EtudesTravaux":
                    sGLAccount = oItem.GLAccountEtudesTravaux;
                    break;
                case "SinistreContentieux":
                    sGLAccount = oItem.GLAccountSinistreContentieux;
                    break;
                case "AleasDivers":
                    sGLAccount = oItem.GLAccountAleasDivers;
                    break;
                case "FinAffaire":
                    sGLAccount = oItem.GLAccountFinAffaire;
                    break;
                default:
                    sGLAccount = "GL Account not set";
            }

            //sap.m.MessageToast.show("GLAccount: " + sGLAccount);


            var period = this.getView().getModel("utilities").getProperty("/period");

            try {

                const oLink = oEvent.getSource();

                // 2. Get GL Accounts
                const oContext = oLink.getBindingContext("utilities");
                const oData = oContext.getObject();


                const glAccounts = sGLAccount
                    ? sGLAccount.split(";").map(a => a.trim()).filter(a => a.length > 0)
                    : [];

                if (glAccounts.length === 0) {
                    sap.m.MessageToast.show("GLAccount non disponible.");
                    return;
                }

                // 3. Get Date range
                const month = period.substring(0, 2);
                const year = period.substring(2);

                // 4. Get missions
                let missions = [];
                try {
                    missions = oLink.getModel('utilities').getMissions();

                } catch (error) {
                    console.error("Failed to fetch missions:", error);
                    throw error;
                }

                const wbsElements = [oData.business_no];
                if (missions && missions.length > 0) {
                    // Add missions to the WBS elements array
                    wbsElements.push(...missions.map(mission => mission.MissionId));
                }

                // 5. Create navigation
                /*const oComponent = sap.ui.core.Component.getOwnerComponentFor(this.oView);
                const oAppStateService = sap.ushell.Container.getService("AppState");
                const oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();

                const oAppState = await oAppStateService.createEmptyAppState(oComponent);
                oAppState.setData(oSelectionVariant.toJSONString());
                await oAppState.save();

                const sAppStateKey = oAppState.getKey();*/
                const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

                // Construct the URL parameters
                /*var params = {
                    FiscalYearPeriod: `${year}0${month}`,
                    GLAccount: glAccounts,
                    WBSElementExternalID: wbsElements
                };*/

                const fiscalPeriods = [];
                for (let m = 1; m <= month; m++) {
                    fiscalPeriods.push(`${year}0${m.toString().padStart(2, "0")}`);

                }

                var params = {
                    //FiscalYearPeriod: `${year}0${month}`,
                    FiscalYearPeriod: fiscalPeriods,
                    GLAccount: glAccounts,
                    WBSElementExternalID: wbsElements
                };

                // Get the base URL for the target app
                const sHash = oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "GLAccount",
                        action: "displayGLLineItemReportingView"
                    },
                    params: Object.fromEntries(
                        Object.entries(params).map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return [key, value.map(v => encodeURIComponent(v))];
                            }
                            return [key, encodeURIComponent(value)];
                        })
                    )
                });

                // Open in new window
                window.open(sHash, "_blank", "noopener,noreferrer");

                /*
                        // Convert params to URL string
                        const sParams = Object.entries(params)
                            .map(([key, value]) => {
                                if (Array.isArray(value)) {
                                    return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
                                }
                                return `${key}=${encodeURIComponent(value)}`;
                            })
                            .join('&');
        
                        // Get the base URL for the target app
                        const sHash = oCrossAppNavigator.hrefForExternal({
                            target: {
                                semanticObject: "GLAccount",
                                action: "displayGLLineItemReportingView"
                            }
                        });
        
                        // Get the FLP base URL
                        const sBaseUrl = window.location.origin + window.location.pathname;
        
                        // Construct the full URL
                        const sUrl = `${sBaseUrl}#${sHash}&${sParams}`;
        
                        // Open in new window
                        window.open(sUrl, "_blank", "noopener,noreferrer");*/

            } catch (err) {
                console.error("Error during navigation:", err);
            }
        },
    });
});

