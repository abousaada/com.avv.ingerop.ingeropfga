
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Text",
    "sap/m/HBox",
    "sap/ui/table/Column",
    "sap/m/Label"
], function (Controller, Text, HBox, Column, Label) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.BudgetPxSTI", {

        onInit: function () {
            this._dynamicColumns = [];
            this._pSTIBusinessNos = [];

            this._pSTICumulativeValues = {};
        },


        _getUniqueBusinessNos: function (pSTIs) {
            var uniqueBusinessNos = [];
            if (!pSTIs) return uniqueBusinessNos;

            pSTIs.forEach(function (item) {
                if (item.business_no_p && !uniqueBusinessNos.includes(item.business_no_p)) {
                    uniqueBusinessNos.push(item.business_no_p);
                }
            });

            return uniqueBusinessNos;
        },

        _createDynamicColumns: function () {
            var treeTable = this.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSTITreeTable");
            if (!treeTable) {
                console.error("TreeTable not found");
                return;
            }

            // Remove existing dynamic columns
            this._removeDynamicColumns();
            this._removeStaticColumns();

            if (!this._dynamicColumns) {
                this._dynamicColumns = [];
            }

            if (!this._staticColumns) {
                this._staticColumns = [];
            }

            // Ensure _pSTIBusinessNos is initialized
            if (!this._pSTIBusinessNos) {
                this._pSTIBusinessNos = [];
            }

            // Create new dynamic columns
            this._pSTIBusinessNos.forEach(function (businessNo) {
                var column = new Column({
                    width: "13rem",
                    template: new HBox({
                        items: [
                            // Link for cumulative row only
                            new sap.m.Link({
                                text: {
                                    path: 'utilities>dynamicColumns/' + businessNo,
                                    formatter: function (value) {
                                        return value || "0";
                                    }
                                },
                                // Fixed visibility binding - check isCumulativeRow property
                                visible: "{= ${utilities>isCumulativeRow} === true}",
                                press: this._onCumulativeLinkPress.bind(this, businessNo)
                            }),
                            // Text for all other rows (non-cumulative)
                            new Text({
                                text: {
                                    path: 'utilities>dynamicColumns/' + businessNo,
                                    formatter: function (value) {
                                        return value || "0";
                                    }
                                },
                                // Show text for non-cumulative rows
                                visible: "{= ${utilities>isCumulativeRow} !== true}"
                            })
                        ]
                    }),
                    label: new Label({
                        text: businessNo
                    })
                });

                this._dynamicColumns.push(column);
                treeTable.addColumn(column);
            }.bind(this));
            this._addStaticColumns(treeTable);
        },

        _addStaticColumns: function (treeTable) {
            // Inter UFO Column
            var interUfoColumn = new Column({
                width: "5rem",
                template: new HBox({
                    items: [
                        new Text({
                            text: "{utilities>InterUFOBudget}",
                            //visible: "{= !${utilities>isNode} && !${utilities>isTotalRow}}"
                            visible: "{= !${isNode}}"
                        })
                    ]
                }),
                label: new Label({
                    text: "Inter UFO"
                })
            });

            // Intra UFO Column
            var intraUfoColumn = new Column({
                width: "5rem",
                template: new HBox({
                    items: [
                        new Text({
                            text: "{utilities>IntraUFOBudget}",
                            //visible: "{= !${utilities>isNode} && !${utilities>isTotalRow}}"
                            visible: "{= !${isNode}}"
                        })
                    ]
                }),
                label: new Label({
                    text: "Intra UFO"
                })
            });

            // Intercompagnie Column
            var intercompagnieColumn = new Column({
                width: "8rem",
                template: new HBox({
                    items: [
                        new Text({
                            text: "{utilities>IntercompagnieBudget}",
                            //visible: "{= !${utilities>isNode} && !${utilities>isTotalRow}}"
                            visible: "{= !${isNode}}"
                        })
                    ]
                }),
                label: new Label({
                    text: "Intercompagnie"
                })
            });

            // Add static columns to tree table
            treeTable.addColumn(interUfoColumn);
            treeTable.addColumn(intraUfoColumn);
            //treeTable.addColumn(intercompagnieColumn);

            // Store references for cleanup if needed
            this._staticColumns = [interUfoColumn, intraUfoColumn]; //, intercompagnieColumn];
        },


        _removeDynamicColumns: function () {
            var treeTable = this.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSTITreeTable");
            if (!treeTable || !this._dynamicColumns) return; // Add null check

            this._dynamicColumns.forEach(function (column) {
                treeTable.removeColumn(column);
                column.destroy();
            });

            this._dynamicColumns = [];
        },

        _removeStaticColumns: function () {
            var treeTable = this.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSTITreeTable");
            if (!treeTable || !this._staticColumns) return; // Add null check

            this._staticColumns.forEach(function (column) {
                treeTable.removeColumn(column);
                column.destroy();
            });

            this._staticColumns = [];
        },

        _addDynamicColumnValues: function (item, pSTIs) {
            if (!item.dynamicColumns) {
                item.dynamicColumns = {};
            }

            // Initialize all dynamic columns with 0
            this._pSTIBusinessNos.forEach(function (businessNo) {
                item.dynamicColumns[businessNo] = "0";
            });

            // Initialize static column sums as numbers
            var interUfoSum = 0;
            var intraUfoSum = 0;
            var intercompanySum = 0;

            // Find matching pSTI items for this item's MissionId
            var matchingPSTIs = pSTIs.filter(function (pSTI) {
                return pSTI.business_no_p && this._pSTIBusinessNos.includes(pSTI.business_no_p);
            }.bind(this));

            // Set the values from matching pSTI items and calculate sums based on TypeBudg
            matchingPSTIs.forEach(function (pSTI) {
                if (pSTI.to_budg) {
                    // Find the specific to_budg item that matches this MissionId
                    var matchingBudg = pSTI.to_budg.find(function (budg) {
                        return budg.Mission_e === item.MissionId;
                    });

                    if (matchingBudg && matchingBudg.BudgetAlloue) {
                        var budgetValue = Number(matchingBudg.BudgetAlloue) || 0;
                        item.dynamicColumns[pSTI.business_no_p] = budgetValue.toString();

                        // Distribute the sum based on TypeBudg
                        switch (pSTI.TypeBudg) {
                            case "INTRAUFO":
                            case "intraUFO":
                                intraUfoSum += budgetValue;
                                break;
                            case "INTERCO":
                            case "interCO":
                                intercompanySum += budgetValue;
                                break;
                            case "INTERUFO":
                            case "interUFO":
                                interUfoSum += budgetValue;
                                break;
                            default:
                                //console.warn("Unknown TypeBudg value:", pSTI.TypeBudg, "for business_no_p:", pSTI.business_no_p);
                                //unknownTypeSum += budgetValue;
                                break;

                        }
                    }
                }
            }.bind(this));

            // Convert sums to strings for display
            item.InterUFOBudget = interUfoSum.toString();
            item.IntraUFOBudget = intraUfoSum.toString();
            item.IntercompagnieBudget = intercompanySum.toString();
        },

        createRegroupementTotalRow: function (totals, regroupementName) {
            var row = {
                name: "Total " + regroupementName,
                isTotalRow: true,
                isNode: false,
                isRegroupementTotal: true,
                dynamicColumns: totals.dynamicColumns || {},
                InterUFOBudget: totals.InterUFOBudget || "0",
                IntraUFOBudget: totals.IntraUFOBudget || "0",
                IntercompagnieBudget: totals.IntercompagnieBudget || "0"
            };

            // Ensure all dynamic columns are present
            this._pSTIBusinessNos.forEach(function (businessNo) {
                if (!row.dynamicColumns[businessNo]) {
                    row.dynamicColumns[businessNo] = "0";
                }
            });

            return row;
        },

        calculateGlobalTotals: function (items) {
            var totals = {
                totalAcquis: {},
                cumule: {},
                pourcentage: {},
                rad: {}
            };

            // Init all dynamic columns
            this._pSTIBusinessNos.forEach(function (businessNo) {
                totals.cumule[businessNo] = this._pSTICumulativeValues[businessNo] || 0;
                totals.totalAcquis[businessNo] = 0;
                totals.pourcentage[businessNo] = 0;
                totals.rad[businessNo] = 0;
            }.bind(this));

            // Init static columns
            var staticCols = ["InterUFOBudget", "IntraUFOBudget", "IntercompagnieBudget"];
            staticCols.forEach(function (col) {
                totals.totalAcquis[col] = 0;
                totals.cumule[col] = 0;
                totals.pourcentage[col] = 0;
                totals.rad[col] = 0;
            });

            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI");

            // Calculate actual usage for static columns from pSTI data
            if (pSTIs) {
                pSTIs.forEach(function (pSTI) {
                    if (pSTI.to_budg && pSTI.Cumul !== undefined) {
                        var cumulValue = Number(pSTI.Cumul) || 0;

                        // Distribute the cumulative value to the appropriate static column based on TypeBudg
                        switch (pSTI.TypeBudg) {
                            case "INTRAUFO":
                            case "intraUFO":
                                totals.cumule.IntraUFOBudget += cumulValue;
                                break;
                            case "INTERCO":
                            case "interCO":
                                totals.cumule.IntercompagnieBudget += cumulValue;
                                break;
                            case "INTERUFO":
                            case "interUFO":
                                totals.cumule.InterUFOBudget += cumulValue;
                                break;
                            default:
                                // Handle unknown types or distribute evenly?
                                break;
                        }
                    }
                });
            }

            // Recursive sum
            var sumValues = function (node) {
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(sumValues);
                } else if (!node.isNode && !node.isTotalRow && !node.isRegroupementTotal) {
                    // ---- Dynamic columns ----
                    this._pSTIBusinessNos.forEach(function (businessNo) {
                        totals.totalAcquis[businessNo] += Number(node.dynamicColumns[businessNo]) || 0;

                    });

                    // ---- Static columns ----
                    staticCols.forEach(function (col) {
                        totals.totalAcquis[col] += Number(node[col]) || 0;

                        //totals.cumule[col] += Number(node[col]) || 0;

                    });
                }
            }.bind(this);

            items.forEach(sumValues);

            // ---- Calculate Pourcentage + Reste ----
            this._pSTIBusinessNos.forEach(function (businessNo) {
                totals.pourcentage[businessNo] = totals.totalAcquis[businessNo] > 0
                    ? (totals.cumule[businessNo] / totals.totalAcquis[businessNo] * 100)
                    : 0;
                totals.rad[businessNo] = totals.totalAcquis[businessNo] - totals.cumule[businessNo];
            });

            staticCols.forEach(function (col) {
                totals.pourcentage[col] = totals.totalAcquis[col] > 0
                    ? (totals.cumule[col] / totals.totalAcquis[col] * 100)
                    : 0;
                totals.rad[col] = totals.totalAcquis[col] - totals.cumule[col];
            });

            return totals;
        },


        createSummaryRow: function (name, values, isPercentage) {
            var row = {
                name: name,
                isTotalRow: true,
                isNode: false,
                isCumulativeRow: (name === "Cumule comptabilisé"),
                dynamicColumns: {},
                children: []
            };

            // Add dynamic columns to summary row
            this._pSTIBusinessNos.forEach(function (businessNo) {
                var value = values[businessNo] || 0;
                row.dynamicColumns[businessNo] = isPercentage ?
                    value.toFixed(2) + "%" :
                    value.toString();
            });

            // Add static columns to summary row
            var staticColumns = ['InterUFOBudget', 'IntraUFOBudget', 'IntercompagnieBudget'];
            staticColumns.forEach(function (column) {
                var value = values[column] || 0;
                row[column] = isPercentage ?
                    value.toFixed(2) + "%" :
                    value.toString();
            });

            return row;
        },

        _extractCumulativeValues: function (pSTIs) {
            this._pSTICumulativeValues = {};

            if (!pSTIs) return;

            pSTIs.forEach(function (pSTI) {
                if (pSTI.business_no_p && pSTI.Cumul !== undefined) {
                    this._pSTICumulativeValues[pSTI.business_no_p] = Number(pSTI.Cumul) || 0;
                }
            }.bind(this));
        },

        preparePxSTITreeData: function () {
            var self = this;
            var PxSTIs = this.getView().getModel("utilities").getProperty("/pxSTI");
            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI");

            this._pSTIBusinessNos = this._getUniqueBusinessNos(pSTIs);

            this._extractCumulativeValues(pSTIs);

            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                items.forEach(function (item) {
                    item.isTotalRow = false;

                    if (!item.isNode && !item.isTotalRow) {
                        self._addDynamicColumnValues(item, pSTIs);
                    }

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
                            children: [],
                            totals: {
                                dynamicColumns: {},
                                InterUFOBudget: 0,
                                IntraUFOBudget: 0,
                                IntercompagnieBudget: 0
                            }
                        };

                        // Initialize dynamic columns in totals
                        self._pSTIBusinessNos.forEach(function (businessNo) {
                            fgaGroups[item.BusinessNo].children[item.Regroupement].totals.dynamicColumns[businessNo] = 0;
                        });
                    }

                    var regroupement = fgaGroups[item.BusinessNo].children[item.Regroupement];
                    regroupement.children.push(item);

                    // Accumulate totals for the Regroupement - dynamic columns
                    self._pSTIBusinessNos.forEach(function (businessNo) {
                        var value = Number(item.dynamicColumns[businessNo]) || 0;
                        regroupement.totals.dynamicColumns[businessNo] += value;
                    });

                    // Accumulate all static column totals
                    regroupement.totals.InterUFOBudget += Number(item.InterUFOBudget) || 0;
                    regroupement.totals.IntraUFOBudget += Number(item.IntraUFOBudget) || 0;
                    regroupement.totals.IntercompagnieBudget += Number(item.IntercompagnieBudget) || 0;
                });

                // Convert children objects to arrays while preserving names
                for (var fga in fgaGroups) {
                    var fgaGroup = fgaGroups[fga];
                    var regroupementArray = [];

                    for (var regroupementKey in fgaGroup.children) {
                        if (fgaGroup.children.hasOwnProperty(regroupementKey)) {
                            var regroupement = fgaGroup.children[regroupementKey];

                            // Create totals object for the regroupement row
                            var totalsForRow = {
                                dynamicColumns: {},
                                InterUFOBudget: regroupement.totals.InterUFOBudget.toString(),
                                IntraUFOBudget: regroupement.totals.IntraUFOBudget.toString(),
                                IntercompagnieBudget: regroupement.totals.IntercompagnieBudget.toString()
                            };

                            // Convert dynamic column totals to strings
                            self._pSTIBusinessNos.forEach(function (businessNo) {
                                totalsForRow.dynamicColumns[businessNo] = regroupement.totals.dynamicColumns[businessNo].toString();
                            });

                            // Add total row with the regroupement's name
                            regroupement.children.push(
                                self.createRegroupementTotalRow(totalsForRow, regroupement.name)
                            );
                            regroupementArray.push(regroupement);
                        }
                    }

                    fgaGroup.children = regroupementArray;
                    treeData.push(fgaGroup);
                }

                return treeData;
            };

            // Create dynamic columns
            this._createDynamicColumns();

            // Build trees 
            var PxSTIsTreeData = buildTree(PxSTIs);

            // Calculate global totals
            var globalTotals = this.calculateGlobalTotals(PxSTIsTreeData);

            // Create flat summary rows (level 0)
            var summaryRows = [
                this.createSummaryRow("Budget STI", globalTotals.totalAcquis, false),
                this.createSummaryRow("Cumule comptabilisé", globalTotals.cumule, false),
                this.createSummaryRow("Pourcentage", globalTotals.pourcentage, true),
                this.createSummaryRow("Reste", globalTotals.rad, false)
            ];

            // Add summary rows directly to the root array (as level 0 items)
            PxSTIsTreeData = PxSTIsTreeData.concat(summaryRows);

            // Set tree
            this.getView().getModel("utilities").setProperty("/PxSTIHierarchyWithTotals", PxSTIsTreeData);

            console.log("Model updated with tree data");

            // Refresh the TreeTable - try different approaches
            var treeTable = this.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSTITreeTable");

            if (treeTable) {
                console.log("TreeTable found");

                // Try multiple refresh methods
                setTimeout(function () {
                    if (treeTable.getBinding("rows")) {
                        treeTable.getBinding("rows").refresh();
                        console.log("Rows binding refreshed");
                    }

                    // Also try force refresh
                    treeTable.invalidate();
                    sap.ui.getCore().applyChanges();
                    console.log("UI forced refresh");
                }, 100);
            } else {
                console.error("TreeTable NOT found!");
            }
        },

        _onCumulativeLinkPress: async function (businessNo, oEvent) {
            var oLink = oEvent.getSource();
            var oContext = oLink.getBindingContext("utilities");
            var oItem = oContext.getObject();
            var oView = this.getView();

            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI");
            var period = this.getView().getModel("utilities").getProperty("/period");

            var BusinessNo = this.getView().getModel("utilities").getBusinessNo();

            try {

                var matchingPSTI = pSTIs.find(function (pSTI) {
                    return pSTI.business_no_p === businessNo;
                });

                if (!matchingPSTI) {
                    sap.m.MessageToast.show("Données pSTI non trouvées pour le business number: " + businessNo);
                    return;
                }

                // Get GL Account from the pSTI item
                var sGLAccount = matchingPSTI.glaccountPxSTI;

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

                const wbsElements = [BusinessNo];
                if (missions && missions.length > 0) {
                    // Add missions to the WBS elements array
                    wbsElements.push(...missions.map(mission => mission.MissionId));
                }

                // 5. Create navigation
                const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

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


            } catch (err) {
                console.error("Error during navigation:", err);
            }
        },
    });
});

