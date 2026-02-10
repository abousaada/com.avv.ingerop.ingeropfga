
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Text",
    "sap/m/HBox",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/ui/model/type/Float"
], function (Controller, Text, HBox, Column, Label, Float) {
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
                if (item.business_no_p) {
                    // Create compound key with business_no_p and id_formulaire
                    var compoundKey = item.id_formulaire ?
                        item.business_no_p + "_" + item.id_formulaire :
                        item.business_no_p;

                    if (!uniqueBusinessNos.includes(compoundKey)) {
                        uniqueBusinessNos.push(compoundKey);
                    }
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

            // Ensure _pSTIBusinessNos is initialized with compound keys
            if (!this._pSTIBusinessNos) {
                this._pSTIBusinessNos = [];
            }

            // Get pSTIs data to categorize by TypeBudg
            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI") || [];

            // Separate business numbers by TypeBudg (using compound keys)
            var interUfoBusinessNos = [];
            var intraUfoBusinessNos = [];
            var intercoBusinessNos = [];

            pSTIs.forEach(function (pSTI) {
                if (!pSTI.business_no_p) return;

                // Create compound key
                var compoundKey = pSTI.id_formulaire ?
                    pSTI.business_no_p + "_" + pSTI.id_formulaire :
                    pSTI.business_no_p;

                switch (pSTI.TypeBudg) {
                    case "INTERUFO":
                    case "interUFO":
                        if (!interUfoBusinessNos.includes(compoundKey)) {
                            interUfoBusinessNos.push(compoundKey);
                        }
                        break;
                    case "INTRAUFO":
                    case "intraUFO":
                        if (!intraUfoBusinessNos.includes(compoundKey)) {
                            intraUfoBusinessNos.push(compoundKey);
                        }
                        break;
                    case "INTERCO":
                    case "interCO":
                        if (!intercoBusinessNos.includes(compoundKey)) {
                            intercoBusinessNos.push(compoundKey);
                        }
                        break;
                }
            });

            // Add static Inter UFO column first
            this._addStaticColumns(treeTable);

            // Add dynamic Inter UFO columns
            interUfoBusinessNos.forEach(function (compoundKey) {
                var column = this._createDynamicColumn(compoundKey);
                this._dynamicColumns.push(column);
                treeTable.addColumn(column);
            }.bind(this));

            var floatFormatter = new Float({
                minFractionDigits: 2,
                maxFractionDigits: 2
            });
            // Add static Intra UFO column
            var intraUfoColumn = new Column({
                width: "7rem",
                template: new HBox({
                    items: [
                        /*new Text({
                            text: "{utilities>IntraUFOBudget}",
                            
                            visible: "{= !${isNode}}"
                        })*/

                        new Text({
                            //text: "{utilities>IntraUFOBudget}",
                            text: {
                                path: 'utilities>IntraUFOBudget',
                                //type: floatFormatter,  // Use Float type
                                /*formatter: function (value) {
                                    return value || "0.00";
                                }*/
                                formatter: function (value) {
                                    if (!value) return "0";

                                    // If the value is a string with %, return as is
                                    if (typeof value === "string" && value.includes("%")) {
                                        return value;
                                    }

                                    // Otherwise, format as float with 2 decimals
                                    var number = parseFloat(value);
                                    if (isNaN(number)) return value;
                                    return new Intl.NumberFormat('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                        useGrouping: true
                                    }).format(number);
                                }

                            },
                            //visible: "{= !${isNode}}"
                            //visible: "{= !${utilities>isNode} && !${utilities>isRegroupementTotal}}"
                            visible: "{= ${utilities>isCumulativeRow} !== true && (!${utilities>isNode} || ${utilities>isRegroupementTotal})}"
                        })


                    ]
                }),
                label: new Label({
                    text: "Intra UFO"
                })
            });

            this._staticColumns.push(intraUfoColumn);
            treeTable.addColumn(intraUfoColumn);

            // Add dynamic Intra UFO columns
            intraUfoBusinessNos.forEach(function (compoundKey) {
                var column = this._createDynamicColumn(compoundKey);
                this._dynamicColumns.push(column);
                treeTable.addColumn(column);
            }.bind(this));

            // Add Intercompagnie static column and dynamic columns if needed
            /*var intercompagnieColumn = new Column({
                width: "9rem",
                template: new HBox({
                    items: [
                        new Text({
                            text: "{utilities>IntercompagnieBudget}",
                            visible: "{= !${isNode}}"
                        })
                    ]
                }),
                label: new Label({
                    text: "Intercompagnie"
                })
            });

            this._staticColumns.push(intercompagnieColumn);
            treeTable.addColumn(intercompagnieColumn);

            intercoBusinessNos.forEach(function (compoundKey) {
                var column = this._createDynamicColumn(compoundKey);
                this._dynamicColumns.push(column);
                treeTable.addColumn(column);
            }.bind(this));*/
        },


        _createDynamicColumn: function (compoundKey) {
            // Extract business_no_p from compound key for display
            var displayName = compoundKey.split('_')[0];

            // Get the pSTIs data to find the business_p_cdp
            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI") || [];

            // Find the matching pSTI item to get business_p_cdp
            var businessPCDP = "";
            pSTIs.forEach(function (pSTI) {
                // Create compound key for this pSTI
                var pSTICompoundKey = pSTI.id_formulaire ?
                    pSTI.business_no_p + "_" + pSTI.id_formulaire :
                    pSTI.business_no_p;

                if (pSTICompoundKey === compoundKey && pSTI.business_p_cdp) {
                    businessPCDP = pSTI.business_p_cdp;
                }
            }.bind(this));

            // Create a VBox for the header label to display two lines
            var headerLabel = new HBox({
                direction: "Column",
                alignItems: "Start",
                justifyContent: "Center",
                items: [
                    new Label({
                        text: displayName,
                        width: "100%",
                        textAlign: "Center",
                        //design: "Bold"
                        design: displayName.includes("###") ? "Bold" : "Standard"
                    }),
                    new Label({
                        text: businessPCDP,
                        width: "100%",
                        textAlign: "Center"

                    })
                ]
            });

            var floatFormatter = new Float({
                minFractionDigits: 2,
                maxFractionDigits: 2
            });
            return new Column({
                width: "13rem",
                template: new HBox({
                    items: [
                        // Link for cumulative row only
                        new sap.m.Link({
                            text: {
                                path: 'utilities>dynamicColumns/' + compoundKey,
                                type: floatFormatter,
                                formatter: function (value) {
                                    return value || "0";
                                }
                            },
                            // Fixed visibility binding - check isCumulativeRow property
                            visible: "{= ${utilities>isCumulativeRow} === true}",
                            press: this._onCumulativeLinkPress.bind(this, compoundKey)
                        }),
                        // Text for all other rows (non-cumulative)
                        new Text({
                            /*text: {
                                path: 'utilities>dynamicColumns/' + compoundKey,
                                //type: floatFormatter,
                                /*formatter: function (value) {
                                    return value || "0";
                                }* /
                            },*/

                            text: {
                                path: 'utilities>dynamicColumns/' + compoundKey,
                                formatter: function (value) {
                                    if (!value) return "0";

                                    // If the value is a string with %, return as is
                                    if (typeof value === "string" && value.includes("%")) {
                                        return value;
                                    }

                                    // Otherwise, format as float with 2 decimals
                                    var number = parseFloat(value);
                                    if (isNaN(number)) return value;
                                    return new Intl.NumberFormat('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                        useGrouping: true
                                    }).format(number);
                                }
                            },

                            // Show text for non-cumulative rows
                            //visible: "{= ${utilities>isCumulativeRow} !== true}"
                            //visible: "{= ${utilities>isCumulativeRow} !== true && !${utilities>isNode} && !${utilities>isRegroupementTotal}}"
                            visible: "{= ${utilities>isCumulativeRow} !== true && (!${utilities>isNode} || ${utilities>isRegroupementTotal})}"
                        })

                    ]
                }),
                label: headerLabel
            });
        },


        _addStaticColumns: function (treeTable) {

            var floatFormatter = new Float({
                minFractionDigits: 2,
                maxFractionDigits: 2
            });

            // Only add Inter UFO column here, Intra UFO and Intercompagnie will be added in _createDynamicColumns
            var interUfoColumn = new Column({
                width: "7rem",
                template: new HBox({
                    items: [
                        new Text({
                            //text: "{utilities>InterUFOBudget}",
                            text: {
                                path: 'utilities>InterUFOBudget',
                                //type: floatFormatter,  // Use Float type
                                /*formatter: function (value) {
                                    return value || "0.00";
                                }*/
                                formatter: function (value) {
                                    if (!value) return "0";

                                    // If the value is a string with %, return as is
                                    if (typeof value === "string" && value.includes("%")) {
                                        return value;
                                    }

                                    // Otherwise, format as float with 2 decimals
                                    var number = parseFloat(value);
                                    if (isNaN(number)) return value;
                                    return new Intl.NumberFormat('fr-FR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                        useGrouping: true
                                    }).format(number);
                                }
                            },
                            //visible: "{= !${isNode}}"
                            //visible: "{= !${utilities>isNode} && !${utilities>isRegroupementTotal}}"
                            visible: "{= ${utilities>isCumulativeRow} !== true && (!${utilities>isNode} || ${utilities>isRegroupementTotal})}"
                        })
                    ]
                }),
                label: new Label({
                    text: "Inter UFO"
                })
            });

            this._staticColumns = [interUfoColumn];
            treeTable.addColumn(interUfoColumn);
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
            this._pSTIBusinessNos.forEach(function (compoundKey) {
                item.dynamicColumns[compoundKey] = "0";
            });

            // Initialize static column sums as numbers
            var interUfoSum = 0;
            var intraUfoSum = 0;
            var intercompanySum = 0;

            // Find matching pSTI items for this item's MissionId
            var matchingPSTIs = pSTIs.filter(function (pSTI) {
                if (!pSTI.business_no_p) return false;

                // Create compound key for this pSTI
                var pSTICompoundKey = pSTI.id_formulaire ?
                    pSTI.business_no_p + "_" + pSTI.id_formulaire :
                    pSTI.business_no_p;

                return this._pSTIBusinessNos.includes(pSTICompoundKey);
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

                        var negativeBudgetValue = -budgetValue;

                        // Create compound key for this pSTI
                        var pSTICompoundKey = pSTI.id_formulaire ?
                            pSTI.business_no_p + "_" + pSTI.id_formulaire :
                            pSTI.business_no_p;

                        item.dynamicColumns[pSTICompoundKey] = negativeBudgetValue.toString();

                        // Distribute the sum based on TypeBudg
                        switch (pSTI.TypeBudg) {
                            case "INTRAUFO":
                            case "intraUFO":
                                intraUfoSum += negativeBudgetValue; // budgetValue;
                                break;
                            case "INTERCO":
                            case "interCO":
                                intercompanySum += negativeBudgetValue; //budgetValue;
                                break;
                            case "INTERUFO":
                            case "interUFO":
                                interUfoSum += negativeBudgetValue; //budgetValue;
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
                name: "Total " + regroupementName + " acquis",
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

            // Get pSTIs to categorize business numbers
            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI") || [];

            // Initialize columns by category using compound keys
            var interUfoCols = [];
            var intraUfoCols = [];
            var intercoCols = [];

            pSTIs.forEach(function (pSTI) {
                if (!pSTI.business_no_p) return;

                // Create compound key
                var compoundKey = pSTI.id_formulaire ?
                    pSTI.business_no_p + "_" + pSTI.id_formulaire :
                    pSTI.business_no_p;

                switch (pSTI.TypeBudg) {
                    case "INTERUFO":
                    case "interUFO":
                        if (!interUfoCols.includes(compoundKey)) {
                            interUfoCols.push(compoundKey);
                        }
                        break;
                    case "INTRAUFO":
                    case "intraUFO":
                        if (!intraUfoCols.includes(compoundKey)) {
                            intraUfoCols.push(compoundKey);
                        }
                        break;
                    case "INTERCO":
                    case "interCO":
                        if (!intercoCols.includes(compoundKey)) {
                            intercoCols.push(compoundKey);
                        }
                        break;
                }
            });

            // Init all dynamic columns using compound keys
            var allBusinessNos = interUfoCols.concat(intraUfoCols).concat(intercoCols);
            allBusinessNos.forEach(function (compoundKey) {
                totals.cumule[compoundKey] = this._pSTICumulativeValues[compoundKey] || 0;
                totals.totalAcquis[compoundKey] = 0;
                totals.pourcentage[compoundKey] = 0;
                totals.rad[compoundKey] = 0;
            }.bind(this));


            // Rest of the method remains the same for static columns...
            // Init static columns
            var staticCols = ["InterUFOBudget", "IntraUFOBudget", "IntercompagnieBudget"];
            staticCols.forEach(function (col) {
                totals.totalAcquis[col] = 0;
                totals.cumule[col] = 0;
                totals.pourcentage[col] = 0;
                totals.rad[col] = 0;
            });

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
                        }
                    }
                });
            }

            // Recursive sum
            var sumValues = function (node) {
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(sumValues);
                } else if (!node.isNode && !node.isTotalRow && !node.isRegroupementTotal) {
                    // Sum dynamic columns using compound keys
                    allBusinessNos.forEach(function (compoundKey) {
                        totals.totalAcquis[compoundKey] += Number(node.dynamicColumns[compoundKey]) || 0;
                    });

                    // Sum static columns
                    staticCols.forEach(function (col) {
                        totals.totalAcquis[col] += Number(node[col]) || 0;
                    });
                }
            }.bind(this);

            items.forEach(sumValues);

            // Calculate Pourcentage + Reste
            /*allBusinessNos.forEach(function (compoundKey) {
                totals.pourcentage[compoundKey] = totals.totalAcquis[compoundKey] > 0
                    ? (totals.cumule[compoundKey] / totals.totalAcquis[compoundKey] * 100)
                    : 0;
                totals.rad[compoundKey] = totals.totalAcquis[compoundKey] - totals.cumule[compoundKey];
            });*/

            allBusinessNos.forEach(function (compoundKey) {
                // Use Math.abs() to get absolute values for percentage calculation
                // totalAcquis is negative, cumule is positive
                var absoluteTotalAcquis = Math.abs(totals.totalAcquis[compoundKey]);
                var absoluteCumule = Math.abs(totals.cumule[compoundKey]);

                // Calculate percentage based on absolute values
                totals.pourcentage[compoundKey] = absoluteTotalAcquis > 0
                    ? (absoluteCumule / absoluteTotalAcquis * 100)
                    : 0;

                // For RAD: Remaining = Absolute total - Cumulative
                // This shows how much budget is left to use
                totals.rad[compoundKey] = absoluteTotalAcquis - absoluteCumule;
            });


            /*staticCols.forEach(function (col) {
                totals.pourcentage[col] = totals.totalAcquis[col] > 0
                    ? (totals.cumule[col] / totals.totalAcquis[col] * 100)
                    : 0;
                totals.rad[col] = totals.totalAcquis[col] - totals.cumule[col];
            });*/
            staticCols.forEach(function (col) {
                // Use Math.abs() to get absolute values for percentage calculation
                var absoluteTotalAcquis = Math.abs(totals.totalAcquis[col]);
                var absoluteCumule = Math.abs(totals.cumule[col]);

                // Calculate percentage based on absolute values
                totals.pourcentage[col] = absoluteTotalAcquis > 0
                    ? (absoluteCumule / absoluteTotalAcquis * 100)
                    : 0;

                totals.rad[col] = absoluteTotalAcquis - absoluteCumule;
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

            // Add dynamic columns to summary row using compound keys
            this._pSTIBusinessNos.forEach(function (compoundKey) {
                var value = values[compoundKey] || 0;
                row.dynamicColumns[compoundKey] = isPercentage ?
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
                    // Create compound key
                    var compoundKey = pSTI.id_formulaire ?
                        pSTI.business_no_p + "_" + pSTI.id_formulaire :
                        pSTI.business_no_p;

                    this._pSTICumulativeValues[compoundKey] = Number(pSTI.Cumul) || 0;
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
                            name: item.Regroupement || "Sans groupement",
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

                            regroupement.children.sort(function (a, b) {
                                var nameA = (a.name || a.MissionId || "").toUpperCase();
                                var nameB = (b.name || b.MissionId || "").toUpperCase();
                                return nameA.localeCompare(nameB, "fr", {
                                    sensitivity: "base",
                                    numeric: true  
                                });
                            });

                            // Add total row with the regroupement's name
                            regroupement.children.push(
                                self.createRegroupementTotalRow(totalsForRow, regroupement.name)
                            );

                            regroupementArray.push(regroupement);
                        }
                    }

                    regroupementArray.sort(function (a, b) {
                        var nameA = (a.name || "").toUpperCase();
                        var nameB = (b.name || "").toUpperCase();
                        return nameA.localeCompare(nameB, "fr", { sensitivity: "base" });
                    });

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

            // DEBUG: Check the created summary rows
            console.log("=== DEBUG summaryRows ===");
            summaryRows.forEach(function (row, index) {
                console.log("Row", index, "name:", row.name);
                if (row.name === "Pourcentage") {
                    console.log("  Pourcentage row dynamicColumns:", row.dynamicColumns);
                    if (this._pSTIBusinessNos.length > 0) {
                        var sampleKey = this._pSTIBusinessNos[0];
                        console.log("  Sample value for", sampleKey + ":", row.dynamicColumns[sampleKey]);
                    }
                }
            }.bind(this));

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

        _onCumulativeLinkPress: async function (compoundKey, oEvent) {
            var oLink = oEvent.getSource();
            var oContext = oLink.getBindingContext("utilities");
            var oItem = oContext.getObject();
            var oView = this.getView();

            var pSTIs = this.getView().getModel("utilities").getProperty("/pSTI");
            var period = this.getView().getModel("utilities").getProperty("/period");
            var BusinessNo = this.getView().getModel("utilities").getBusinessNo();

            try {
                // Extract business_no_p and id_formulaire from compound key
                var parts = compoundKey.split("_");
                var businessNo = parts[0];
                var idFormulaire = parts.length > 1 ? parts[1] : null;

                // Find matching pSTI item
                var matchingPSTI = pSTIs.find(function (pSTI) {
                    if (pSTI.business_no_p !== businessNo) return false;

                    // If id_formulaire is part of the compound key, check it too
                    if (idFormulaire) {
                        return pSTI.id_formulaire === idFormulaire;
                    }
                    return true;
                });

                if (!matchingPSTI) {
                    sap.m.MessageToast.show("Données pSTI non trouvées pour: " + compoundKey);
                    return;
                }

                // Get GL Account from the pSTI item
                var sGLAccount = matchingPSTI.glaccountPxSTI;

                // 2. Get GL Accounts
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

        _onCumulativeLinkPress2: async function (businessNo, oEvent) {
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

