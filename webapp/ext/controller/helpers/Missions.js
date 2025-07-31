sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend('com.avv.ingerop.ingeropfga.ext.Mission', {


        prepareMissionsTreeData: function () {
            var missions = this.getView().getModel("utilities").getProperty("/missions");

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
        },


        isGroupementAddVisible: function (editable, isNode, isL0) {
            return editable === true && isNode === true && isL0 === false;
        },
        isFGAAddVisible: function (editable, isNode, isL0) {
            return editable === true && isNode === true && isL0 === true;
        },
        isDeleteVisible: function (editable, isNode) {
            return editable === true && isNode !== true;
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
            const BusinessNo = this.getView().getModel("utilities").getBusinessNo().slice(0, -2);
            const maxMission = oldMissions
                .filter(mission => mission.BusinessNo === BusinessNo)
                .reduce((max, current) => {
                    const currentMatch = current.MissionId.match(/-(\d+)$/);
                    const currentNum = currentMatch ? parseInt(currentMatch[1]) : 0;

                    const maxMatch = max.MissionId?.match(/-(\d+)$/);
                    const maxNum = maxMatch ? parseInt(maxMatch[1]) : 0;

                    return currentNum > maxNum ? current : max;
                }, { MissionId: `${BusinessNo}-000` });

            const match = maxMission.MissionId.match(/-(\d+)$/);
            const currentMax = match ? parseInt(match[1]) : 0;
            const nextNum = currentMax + 1;
            const paddedNum = String(nextNum).padStart(3, '0'); // add zeros "005"
            const MissionId = `${BusinessNo}00-${paddedNum}`; // "MEDXXXXXX000000069-005"
            //End this code needs refactoring

            // Create new mission with default values
            var oNewMission = {
                BusinessNo: BusinessNo,
                Regroupement: oGroupementNode.name,
                MissionId: MissionId, //"NEW_MISSION_" + new Date().getTime(),
                MissionCode: "",
                StartDate: null,
                EndDate: null,
                ExternalRevenue: 0,
                LaborBudget: 0,
                isNode: false
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

        onRefreshTree: function() {
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
        
        buildMissionHierarchy: function(aMissions) {
            var treeData = [];
            var fgaGroups = {};
        
            if (!aMissions) return treeData;
        
            aMissions.forEach(function(item) {
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
            treeData.sort(function(a, b) {
                return (a.name || "").localeCompare(b.name || "");
            });
        
            treeData.forEach(function(fgaGroup) {
                fgaGroup.children.sort(function(a, b) {
                    return (a.name || "").localeCompare(b.name || "");
                });
            });
        
            return treeData;
        },


    });
});
