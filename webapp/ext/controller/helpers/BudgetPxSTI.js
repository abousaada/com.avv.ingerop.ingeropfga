
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
                            new Text({
                                text: {
                                    path: 'utilities>dynamicColumns/' + businessNo,
                                    formatter: function (value) {
                                        return value || "0";
                                    }
                                },
                                //visible: "{= !${utilities>isNode} && !${utilities>isTotalRow}}"
                                visible: "{= !${isNode}}"
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
            treeTable.addColumn(intercompagnieColumn);

            // Store references for cleanup if needed
            this._staticColumns = [interUfoColumn, intraUfoColumn, intercompagnieColumn];
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
                                intraUfoSum += budgetValue;
                                break;
                            case "INTERCO":
                                intercompanySum += budgetValue;
                                break;
                            case "INTERUFO":
                            default:
                                interUfoSum += budgetValue;
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
                totals.totalAcquis[businessNo] = 0;
                totals.cumule[businessNo] = 0;
                totals.pourcentage[businessNo] = 0;
                totals.rad[businessNo] = 0;
            });

            // Init static columns
            var staticCols = ["InterUFOBudget", "IntraUFOBudget", "IntercompagnieBudget"];
            staticCols.forEach(function (col) {
                totals.totalAcquis[col] = 0;
                totals.cumule[col] = 0;
                totals.pourcentage[col] = 0;
                totals.rad[col] = 0;
            });

            // Recursive sum
            var sumValues = function (node) {
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(sumValues);
                } else if (!node.isNode && !node.isTotalRow && !node.isRegroupementTotal) {
                    // ---- Dynamic columns ----
                    this._pSTIBusinessNos.forEach(function (businessNo) {
                        totals.totalAcquis[businessNo] += Number(node.dynamicColumns[businessNo]) || 0;

                        // If your row has cumulative values per businessNo
                        if (node.cumule && node.cumule[businessNo] !== undefined) {
                            totals.cumule[businessNo] += Number(node.cumule[businessNo]) || 0;
                        }
                    });

                    // ---- Static columns ----
                    staticCols.forEach(function (col) {
                        totals.totalAcquis[col] += Number(node[col]) || 0;

                        // If your row has cumulative values for static columns
                        if (node.cumule && node.cumule[col] !== undefined) {
                            totals.cumule[col] += Number(node.cumule[col]) || 0;
                        }
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


        calculateGlobalTotals2: function (items) {
            var totals = {
                totalAcquis: {},
                cumule: {},
                pourcentage: {},
                rad: {}
            };

            // Initialize all properties with 0
            this._pSTIBusinessNos.forEach(function (businessNo) {
                totals.totalAcquis[businessNo] = 0;
                totals.cumule[businessNo] = 0;
                totals.pourcentage[businessNo] = 0;
                totals.rad[businessNo] = 0;
            });

            // Initialize InterUFO totals
            totals.totalAcquis.InterUFOBudget = 0;
            totals.cumule.InterUFOBudget = 0;
            totals.pourcentage.InterUFOBudget = 0;
            totals.rad.InterUFOBudget = 0;

            // Initialize IntraUFO totals
            totals.totalAcquis.IntraUFOBudget = 0;
            totals.cumule.IntraUFOBudget = 0;
            totals.pourcentage.IntraUFOBudget = 0;
            totals.rad.IntraUFOBudget = 0;

            // Initialize Intercompagnie totals
            totals.totalAcquis.IntercompagnieBudget = 0;
            totals.cumule.IntercompagnieBudget = 0;
            totals.pourcentage.IntercompagnieBudget = 0;
            totals.rad.IntercompagnieBudget = 0;

            // Recursive function to sum values from all nodes
            var sumValues = function (node) {
                if (node.children && Array.isArray(node.children)) {
                    // If it's a node with children, process each child
                    node.children.forEach(function (child) {
                        sumValues(child);
                    });
                } else if (!node.isNode && !node.isTotalRow && !node.isRegroupementTotal) {
                    // Only sum values from actual data rows (not totals or nodes)

                    // Sum dynamic columns
                    this._pSTIBusinessNos.forEach(function (businessNo) {
                        totals.totalAcquis[businessNo] += Number(node.dynamicColumns[businessNo]) || 0;
                        // TODO: You need to add logic here to populate cumule[businessNo] with actual cumulative values
                        // Currently cumule is always 0, which is why your percentages and RAD don't work
                    });

                    // Sum static columns
                    totals.totalAcquis.InterUFOBudget += Number(node.InterUFOBudget) || 0;
                    totals.totalAcquis.IntraUFOBudget += Number(node.IntraUFOBudget) || 0;
                    totals.totalAcquis.IntercompagnieBudget += Number(node.IntercompagnieBudget) || 0;

                    // TODO: You need similar logic here to populate cumule for static columns
                }
            }.bind(this);

            // Process all items
            items.forEach(sumValues);

            // Calculate percentages and RAD for dynamic columns
            this._pSTIBusinessNos.forEach(function (businessNo) {
                totals.pourcentage[businessNo] = totals.totalAcquis[businessNo] > 0 ?
                    (totals.cumule[businessNo] / totals.totalAcquis[businessNo] * 100) : 0;
                totals.rad[businessNo] = totals.totalAcquis[businessNo] - totals.cumule[businessNo];
            });

            // Calculate percentages and RAD for static columns
            totals.pourcentage.InterUFOBudget = totals.totalAcquis.InterUFOBudget > 0 ?
                (totals.cumule.InterUFOBudget / totals.totalAcquis.InterUFOBudget * 100) : 0;
            totals.rad.InterUFOBudget = totals.totalAcquis.InterUFOBudget - totals.cumule.InterUFOBudget;

            totals.pourcentage.IntraUFOBudget = totals.totalAcquis.IntraUFOBudget > 0 ?
                (totals.cumule.IntraUFOBudget / totals.totalAcquis.IntraUFOBudget * 100) : 0;
            totals.rad.IntraUFOBudget = totals.totalAcquis.IntraUFOBudget - totals.cumule.IntraUFOBudget;

            totals.pourcentage.IntercompagnieBudget = totals.totalAcquis.IntercompagnieBudget > 0 ?
                (totals.cumule.IntercompagnieBudget / totals.totalAcquis.IntercompagnieBudget * 100) : 0;
            totals.rad.IntercompagnieBudget = totals.totalAcquis.IntercompagnieBudget - totals.cumule.IntercompagnieBudget;

            return totals;
        },

        calculateGlobalTotals1: function (items) {
            var totals = {
                totalAcquis: {},
                cumule: {},
                pourcentage: {},
                rad: {}
            };

            // Initialize dynamic columns in totals
            this._pSTIBusinessNos.forEach(function (businessNo) {
                totals.totalAcquis[businessNo] = 0;
                totals.cumule[businessNo] = 0;
                totals.pourcentage[businessNo] = 0;
                totals.rad[businessNo] = 0;
            });

            // Initialize InterUFO totals
            totals.totalAcquis.InterUFOBudget = 0;
            totals.cumule.InterUFOBudget = 0;
            totals.pourcentage.InterUFOBudget = 0;
            totals.rad.InterUFOBudget = 0;

            // Recursive function to sum values from all nodes
            var sumValues = function (node) {
                if (node.children && Array.isArray(node.children)) {
                    // If it's a node with children, process each child
                    node.children.forEach(function (child) {
                        sumValues(child);
                    });
                } else if (!node.isNode && !node.isTotalRow && !node.isRegroupementTotal) {
                    // Only sum values from actual data rows (not totals or nodes)
                    this._pSTIBusinessNos.forEach(function (businessNo) {
                        totals.totalAcquis[businessNo] += Number(node.dynamicColumns[businessNo]) || 0;
                    });
                    totals.totalAcquis.InterUFOBudget += Number(node.InterUFOBudget) || 0;
                }
            }.bind(this);

            // Process all items
            items.forEach(sumValues);

            // Calculate percentages and RAD for dynamic columns
            this._pSTIBusinessNos.forEach(function (businessNo) {
                totals.pourcentage[businessNo] = totals.totalAcquis[businessNo] > 0 ?
                    (totals.cumule[businessNo] / totals.totalAcquis[businessNo] * 100) : 0;
                totals.rad[businessNo] = totals.totalAcquis[businessNo] - totals.cumule[businessNo];
            });

            // Calculate percentages and RAD for InterUFO column
            totals.pourcentage.InterUFOBudget = totals.totalAcquis.InterUFOBudget > 0 ?
                (totals.cumule.InterUFOBudget / totals.totalAcquis.InterUFOBudget * 100) : 0;
            totals.rad.InterUFOBudget = totals.totalAcquis.InterUFOBudget - totals.cumule.InterUFOBudget;

            return totals;
        },

        createSummaryRow: function (name, values, isPercentage) {
            var row = {
                name: name,
                isTotalRow: true,
                isNode: false,
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

        preparePxSTITreeData: function () {
            var self = this;
            var PxSTIs = this.getView().getModel("utilities").getProperty("/pxSTI");
            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI");

            this._pSTIBusinessNos = this._getUniqueBusinessNos(pSTIs);

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
                this.createSummaryRow("Cumulé comptabilisé", globalTotals.cumule, false),
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


    });
});

