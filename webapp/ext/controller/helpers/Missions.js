sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend('com.avv.ingerop.ingeropfga.ext.Mission', {


        prepareMissionsTreeData: function () {
            var missions = this.getView().getModel("utilities").getProperty("/missions");

            missions.forEach(function (mission) {
                if (mission.isNew === undefined || mission.isNew === null) {
                    mission.isNew = true;
                }
            });


            // Create tree builder function
            var buildTree = function (items) {
                var treeData = [];
                var fgaGroups = {};

                if (!items) return treeData;

                items.forEach(function (item) {
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
            var missionsTreeData = buildTree(missions);

            // Set tree
            this.getView().getModel("utilities").setProperty("/missionsHierarchy", missionsTreeData);

            var totalRows = this.countRows(missionsTreeData);
            this.updateRowCount(totalRows);

        },


        isGroupementAddVisible: function (editable, isNode, isL0) {
            return editable === true && isNode === true && isL0 === false;
        },
        isFGAAddVisible: function (editable, isNode, isL0) {
            return editable === true && isNode === true && isL0 === true;
        },
        isDeleteVisible: function (editable, isNode, isNew) {
            console.log('isNEw : ', isNew);
            return editable === true && isNode === false && isNew === true;
        },

        onAddGroupement: function (oEvent) {
            // Get the FGA (BusinessNo) node
            var oContext = oEvent.getSource().getBindingContext("utilities");
            var oFGANode = oContext.getObject();

            // Create dialog
            var oExistingInput = sap.ui.getCore().byId("groupementInput");
            if (oExistingInput) {
                oExistingInput.destroy();
            }
            var oDialog = new sap.m.Dialog({
                title: "Add Groupement",
                content: [
                    new sap.m.VBox({
                        items: [
                            new sap.m.Label({
                                text: "Enter new groupement name",
                                labelFor: "groupementInput"
                            }),
                            new sap.m.Input({
                                id: "groupementInput",
                                placeholder: "Groupement name",
                                width: "100%",
                                liveChange: function (oEvent) {
                                    var sValue = oEvent.getSource().getValue();
                                    oAddButton.setEnabled(!!sValue.trim());
                                }
                            })
                        ]
                    })
                ],
                buttons: [
                    new sap.m.Button({
                        text: "Add",
                        type: "Accept",
                        icon: "sap-icon://add",
                        enabled: false,
                        press: function () {
                            var sValue = sap.ui.getCore().byId("groupementInput").getValue();
                            oDialog.close();

                            if (sValue) {
                                // Create new groupement  
                                var oNewGroupement = {
                                    name: sValue,
                                    isNode: true,
                                    isL0: false,
                                    Regroupement: sValue,
                                    children: [],
                                    BusinessNo: oFGANode.BusinessNo
                                };

                                // Add to the FGA node's children
                                oFGANode.children.push(oNewGroupement);

                                // Update the model
                                var oUtilitiesModel = this.getView().getModel("utilities");
                                oUtilitiesModel.updateBindings();

                                var oTreeTable = this.byId("missionsTreeTable");
                                oTreeTable.expand(oContext.getPath());
                            }
                        }.bind(this)
                    }),
                    new sap.m.Button({
                        text: "Cancel",
                        type: "Reject",
                        press: function () {
                            oDialog.close();
                        }
                    })
                ]
            });

            var oAddButton = oDialog.getButtons()[0];
            oDialog.open();
            sap.ui.getCore().byId("groupementInput").focus();
        },

        onAddMissionToGroupement: function (oEvent) {
            // Get the groupement node
            var oContext = oEvent.getSource().getBindingContext("utilities");
            var oGroupementNode = oContext.getObject();

            // ABO : This code needs refactoring
            const oldMissions = this.getView().getModel("utilities").getMissions();
            const BusinessNo = this.getView().getModel("utilities").getBusinessNo();
            const maxMission = oldMissions
                .filter(mission => mission.BusinessNo === BusinessNo)
                .reduce((max, current) => {
                    const currentMatch = current.MissionId.match(/^.+?(\d{2})$/);
                    const currentNum = currentMatch ? parseInt(currentMatch[1]) : 0;

                    const maxMatch = max.MissionId?.match(/^.+?(\d{2})$/);
                    const maxNum = maxMatch ? parseInt(maxMatch[1]) : 0;

                    return currentNum > maxNum ? current : max;
                }, { MissionId: `${BusinessNo}00` });

            const match = maxMission.MissionId.match(/^.+?(\d{2})$/);
            const currentMax = match ? parseInt(match[1]) : 0;
            const nextNum = currentMax + 1;
            const paddedNum = String(nextNum).padStart(2, '0'); // add zeros "005"
            const MissionId = `${BusinessNo}${paddedNum}`;
            //End this code needs refactoring

            const oContextFGA = oEvent.getSource().getBindingContext();
            const oFGAEntity = oContextFGA.getObject();
            const StartDate = oFGAEntity.StartDate;
            const EndDate = oFGAEntity.EndDate;

            // Create new mission with default values
            var oNewMission = {
                BusinessNo: BusinessNo,
                Regroupement: oGroupementNode.name,
                MissionId: MissionId, //"NEW_MISSION_" + new Date().getTime(),
                MissionCode: "",
                StartDate: StartDate,
                EndDate: EndDate,
                ExternalRevenue: 0,
                LaborBudget: 0,
                isSTI: '',
                isNode: false,
                isNew: true
            };

            // 1. Add to the 'main' missions list
            var oUtilitiesModel = this.getView().getModel("utilities");
            var aMissions = oUtilitiesModel.getProperty("/missions") || [];
            aMissions.push(oNewMission);
            oUtilitiesModel.setProperty("/missions", aMissions);

            // 2. Add to the groupement's children
            oGroupementNode.children.push(oNewMission);

            // Update the model
            var oUtilitiesModel = this.getView().getModel("utilities");
            oUtilitiesModel.setProperty("/missionsHierarchy", oUtilitiesModel.getProperty("/missionsHierarchy"));

            this.getView().byId("missionsTreeTable").getBinding("rows").refresh();
        },

        onDeleteMission: function (oEvent) {
            var oRowContext = oEvent.getSource().getBindingContext("utilities");
            if (!oRowContext) {
                sap.m.MessageToast.show("Error: Could not find mission to delete");
                return;
            }

            var oUtilitiesModel = this.getView().getModel("utilities");
            var oMissionToDelete = oRowContext.getObject();

            // 1. Delete
            var aMissions = oUtilitiesModel.getProperty("/missions");
            var iIndex = aMissions.findIndex(function (mission) {
                return mission.MissionId === oMissionToDelete.MissionId &&
                    mission.BusinessNo === oMissionToDelete.BusinessNo;
            });

            if (iIndex !== -1) {
                aMissions.splice(iIndex, 1);
                oUtilitiesModel.setProperty("/missions", aMissions);
            }

            // 2. Delete from hierarchical missionsHierarchy
            var aMissionsHierarchy = oUtilitiesModel.getProperty("/missionsHierarchy");

            var bDeleted = this._deleteFromHierarchy(aMissionsHierarchy, oMissionToDelete);

            if (bDeleted) {
                // Update TreeTable
                oUtilitiesModel.setProperty("/missionsHierarchy", aMissionsHierarchy);
                oUtilitiesModel.updateBindings(true);
            } else {
                sap.m.MessageToast.show("Warning: Mission not found in hierarchy");
            }
        },

        _deleteFromHierarchy: function (aNodes, oMissionToDelete) {
            for (var i = 0; i < aNodes.length; i++) {
                var oNode = aNodes[i];

                // If this is a mission node (not a groupement) <--ABO to manage
                if (!oNode.isNode &&
                    oNode.MissionId === oMissionToDelete.MissionId &&
                    oNode.BusinessNo === oMissionToDelete.BusinessNo) {
                    aNodes.splice(i, 1);
                    return true;
                }

                // Generic case
                if (oNode.children && oNode.children.length > 0) {
                    if (this._deleteFromHierarchy(oNode.children, oMissionToDelete)) {
                        return true;
                    }
                }
            }
            return false;
        },

        onRefreshTree: function () {
            this.getView().setBusy(true);

            var oModel = this.getView().getModel("utilities");
            var aMissions = oModel.getProperty("/missions");

            try {
                // Rebuild the hierarchy
                var aHierarchy = this.buildMissionHierarchy(aMissions);

                // Update the model
                oModel.setProperty("/missionsHierarchy", aHierarchy);

                sap.m.MessageToast.show("Mission tree structure refreshed successfully");
            } catch (error) {
                sap.m.MessageBox.error("Error refreshing tree: " + error.message);
            } finally {
                // Hide busy indicator
                this.getView().setBusy(false);
            }
        },

        buildMissionHierarchy: function (aMissions) {
            var treeData = [];
            var fgaGroups = {};

            if (!aMissions) return treeData;

            aMissions.forEach(function (item) {
                if (!fgaGroups[item.BusinessNo]) {
                    fgaGroups[item.BusinessNo] = {
                        name: item.BusinessNo,
                        isNode: true,
                        isL0: true,
                        BusinessNo: item.BusinessNo,
                        children: {}
                    };
                }

                // Create Regroupement level if it doesn't exist
                if (!fgaGroups[item.BusinessNo].children[item.Regroupement]) {
                    fgaGroups[item.BusinessNo].children[item.Regroupement] = {
                        name: item.Regroupement,
                        isNode: true,
                        isL0: false,
                        Regroupement: item.Regroupement,
                        children: []
                    };
                }

                fgaGroups[item.BusinessNo].children[item.Regroupement].children.push(item);
            });

            for (var businessNo in fgaGroups) {
                var fgaGroup = fgaGroups[businessNo];
                fgaGroup.children = Object.values(fgaGroup.children);
                treeData.push(fgaGroup);
            }

            // Sort the hierarchy
            treeData.sort(function (a, b) {
                return (a.name || "").localeCompare(b.name || "");
            });

            treeData.forEach(function (fgaGroup) {
                fgaGroup.children.sort(function (a, b) {
                    return (a.name || "").localeCompare(b.name || "");
                });
            });

            return treeData;
        },

        validateMissionsTreeRequiredFields: function (oView) {
            const oTable = oView.byId("missionsTreeTable");
            const aRows = oTable.getRows();
            let isValid = true;

            aRows.forEach((oRow) => {
                const oContext = oRow.getBindingContext("utilities");
                if (!oContext) return;

                const oData = oContext.getObject();
                if (!oData.isNode) {
                    const aCells = oRow.getCells();

                    // Type validation
                    /* const typeContainer = aCells[1];
                     if (typeContainer && typeContainer.isA("sap.m.HBox")) {
                         const typeControl = this._findInputControl(typeContainer);
                         if (typeControl && typeControl.setValueState) {
                             const typeValue = this._getControlValue(typeControl);
                             if (!typeValue) {
                                 typeControl.setValueState("Error");
                                 typeControl.setValueStateText("Type required");
                                 isValid = false;
                             } 
                             else {
                                 typeControl.setValueState("None");
                             }
                         }
                     }*/
                    const typeContainer = aCells[1];
                    if (typeContainer && typeContainer.isA("sap.m.HBox")) {
                        const typeControl = this._findInputControl(typeContainer);
                        if (typeControl && typeControl.setValueState) {
                            const typeValue = this._getControlValue(typeControl);

                            if (!typeValue) {
                                typeControl.setValueState("Error");
                                typeControl.setValueStateText("Type required");
                                isValid = false;
                            }
                            else if (typeValue.length > 15) {
                                typeControl.setValueState("Error");
                                typeControl.setValueStateText("La longueur doit être inférieure à 15 caractères");
                                isValid = false;
                            }
                            else {
                                typeControl.setValueState("None");
                                typeControl.setValueStateText(""); // reset text
                            }
                        }
                    }

                    // Regroupement validation
                    const regroupementContainer = aCells[3];
                    const regroupementControl = this._findInputControl(regroupementContainer);
                    if (regroupementControl && regroupementControl.setValueState) {
                        const value = this._getControlValue(regroupementControl);
                        if (!value) {
                            regroupementControl.setValueState("Error");
                            regroupementControl.setValueStateText("Regroupement required");
                            isValid = false;
                        } else {
                            regroupementControl.setValueState("None");
                        }
                    }
                    // Status validation 
                    const statusContainer = aCells[4];
                    if (statusContainer && statusContainer.isA("sap.m.HBox")) {
                        const statusControl = this._findInputControl(statusContainer);
                        if (statusControl && statusControl.setValueState) {
                            const statusValue = this._getControlValue(statusControl);
                            if (!statusValue) {
                                statusControl.setValueState("Error");
                                statusControl.setValueStateText("Status required");
                                isValid = false;
                            } else {
                                statusControl.setValueState("None");
                            }
                        }
                    }

                    // Date validation
                    const startDateContainer = aCells[5];
                    const startDateControl = this._findInputControl(startDateContainer);
                    if (startDateControl && startDateControl.isA("sap.m.DatePicker")) {
                        if (!startDateControl.getDateValue()) {
                            startDateControl.setValueState("Error");
                            startDateControl.setValueStateText("Start date required");
                            isValid = false;
                        } else {
                            startDateControl.setValueState("None");
                        }
                    }

                    const endDateContainer = aCells[6];
                    const endDateControl = this._findInputControl(endDateContainer);
                    if (endDateControl && endDateControl.isA("sap.m.DatePicker")) {
                        if (!endDateControl.getDateValue()) {
                            endDateControl.setValueState("Error");
                            endDateControl.setValueStateText("End date required");
                            isValid = false;
                        } else {
                            endDateControl.setValueState("None");
                        }
                    }
                }
            });

            return isValid;
        },

        _findInputControl: function (hboxContainer) {
            if (hboxContainer && hboxContainer.isA && hboxContainer.isA("sap.m.HBox")) {
                const aItems = hboxContainer.getItems();
                for (let i = 0; i < aItems.length; i++) {
                    const oControl = aItems[i];
                    if (oControl.isA("sap.m.Input") ||
                        oControl.isA("sap.m.Select") ||
                        oControl.isA("sap.m.ComboBox") ||
                        oControl.isA("sap.m.DatePicker")) {
                        return oControl;
                    }
                }
            }
            return null;
        },


        _getControlValue: function (oControl) {
            if (!oControl) return null;

            if (oControl.isA("sap.m.Select")) {
                return oControl.getSelectedKey();
            } else if (oControl.isA("sap.m.ComboBox")) {
                return oControl.getValue();
            } else if (oControl.isA("sap.m.Input")) {
                return oControl.getValue();
            } else if (oControl.isA("sap.m.DatePicker")) {
                return oControl.getDateValue();
            }
            return null;
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
                    count++; // Add 1 for the line total
                }
                if (node.children && node.children.length > 0) {
                    count += this.countRows(node.children);
                }
            }.bind(this));

            // Add 4 lines for global totals 
            if (nodes[0] && nodes[0].isL0) {
                count += 4;
            }

            return count;
        },

        onMissionCodeChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sKey = oComboBox.getSelectedKey();

            var sValue = oComboBox.getValue();
            var oBindingContext = oComboBox.getBindingContext("utilities");

            /*if (sValue && sValue.length > 15) {
                // Truncate to 15 characters
                sValue = sValue.substring(0, 15);

                oComboBox.setValue(sValue);

                sap.m.MessageToast.show("Value limited to 15 characters");

            }*/
            if (oBindingContext) {
                oBindingContext.getModel().setProperty(oBindingContext.getPath() + "/MissionCode", sValue);
            }
        },



    });
});
