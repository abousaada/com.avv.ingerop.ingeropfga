sap.ui.define(
    [
        "sap/ui/core/mvc/ControllerExtension",
        "sap/ui/model/json/JSONModel",
        "sap/m/Dialog",
        "sap/m/library",
        "sap/m/Text",
        "sap/m/Button",
        "sap/m/MessageToast",
        "sap/ui/core/message/MessageType",
        "sap/ui/core/mvc/Controller",
        "com/avv/ingerop/ingeropfga/ext/controller/BaseController",
        "sap/ui/core/UIComponent",
        "com/avv/ingerop/ingeropfga/model/models",
        "sap/ui/model/Filter",
        "com/avv/ingerop/ingeropfga/util/helper",
        "sap/ui/generic/app/navigation/service/SelectionVariant",
        "sap/ui/generic/app/navigation/service/NavigationHandler",
        "com/avv/ingerop/ingeropfga/util/constant",
        "com/avv/ingerop/ingeropfga/util/param",
    ],
    function (
        ControllerExtension,
        JSONModel,
        Dialog,
        mLibrary,
        Text,
        Button,
        MessageToast,
        MessageType,
        Controller,
        BaseController,
        UIComponent,
        models,
        Filter,
        Helper,
        SelectionVariant,
        NavigationHandler,
        Constant,
        Params
    ) {
        "use strict";

        return ControllerExtension.extend("com.avv.ingerop.ingeropfga.ext.controller.extendOP", {
            // Override or add custom methods here

            _getExtensionAPI: function () {
                return this.getInterface().getView().getController().extensionAPI;
            },

            _setTabsVisible() {
                const isCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                Constant.headerSectionList.map(section => {
                    this.getView().byId(section)?.setVisible(!Helper.getObjectPageSectionVisibilityMap(isCreateMode).includes(section));
                });
            },

            _setFieldVisible() {
                const isCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                Object.entries(Constant.headerFieldsList).map(([identifiant, champs]) => {
                    champs.map(champ => {
                        this._getField(identifiant, champ)?.setVisible(
                            !Helper.getHeaderFieldVisibilityMap(isCreateMode)[identifiant].includes(champ)
                        );
                    });
                });
            },

            _setFieldEnabled() {
                const isCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                Object.entries(Constant.headerFieldsList).map(([identifiant, champs]) => {
                    champs.map(champ => {
                        this._getField(identifiant, champ)?.setEditable(
                            !Helper.getHeaderFieldUnabledMap(isCreateMode)[identifiant].includes(champ)
                        );
                    });
                });
            },

            _setDefaultMandatory(){
                this._getField("Identification", "Type").setMandatory(true);
            },

            _getField(identifiant, champ) {
                return this.getView().byId(Helper.headerFieldIdBySectionAndFieldName(identifiant, champ));
            },

            _attachChangeEventOnFields() {
                const changeActions = [{
                    identification: "Identification",
                    champ: "Type",
                    action: "onTypeChange"
                }, {
                    identification: "Travaux",
                    champ: "Mttrvx",
                    action: "onCalcTauxTravaux"
                }, {
                    identification: "Prix",
                    champ: "Mtctr",
                    action: "onCalcTauxTravaux"
                }, {
                    identification: "Identification",
                    champ: "Activity",
                    action: "onActivityChange"
                }, {
                    identification: "Duree",
                    champ: "StartDate",
                    action: "onDateChange"
                }, {
                    identification: "Duree",
                    champ: "EndDate",
                    action: "onDateChange"
                }];

                changeActions.map(({ identification, champ, action }) => {
                    this.getView().byId(Helper.headerFieldIdBySectionAndFieldName(identification, champ)).attachChange(this[action].bind(this));
                })
            },

            onActivityChange(oEvent) {
                this._getField("Identification", "Soufam").setValue(null);
            },

            onDateChange(oEvent) {
                const { StartDate, EndDate } = this.getView().getBindingContext().getObject();

                if (EndDate) {
                    const diffFromNow = Helper.diffEnMois(new Date(), EndDate);
                    this._getField("Duree", "RemainingMonth").setValue(diffFromNow);
                } else {
                    this._getField("Duree", "RemainingMonth").setValue(null);
                }

                if (StartDate && EndDate) {
                    const diff = Helper.diffEnMois(StartDate, EndDate);
                    this._getField("Duree", "NbOfMonth").setValue(diff);
                } else {
                    this._getField("Duree", "NbOfMonth").setValue(null);
                }

            },

            onCalcTauxTravaux(oEvent) {
                const { Mttrvx, Mtctr } = this.getView().getBindingContext().getObject();
                if (Mttrvx == undefined || Mtctr == undefined
                    || Mttrvx == null || Mtctr == null
                    || Mttrvx == 0 || Mtctr == 0) {
                    this._getField("Travaux", "Ingtrvx").setValue("0");
                    return;
                }
                const ing = parseFloat(Mtctr);
                const trav = parseFloat(Mttrvx);
                const diff = ing / trav;
                this._getField("Travaux", "Ingtrvx").setValue(diff.toString());
            },

            onTypeChange(event) {
                const newValue = event.getParameter("newValue");
                this._setMandatoryFieldByType(newValue);
            },

            _setMandatoryFieldByType(type) {
                const headerFieldMandatory = Params.headerFieldMandatoryByType[type];
                if (headerFieldMandatory) {
                    Object.entries(Constant.headerFieldsList)
                        .map(([identifiant, champs]) => {
                            champs.map(champ => {
                                const isMandatory = (headerFieldMandatory[identifiant] || []).includes(champ);
                                this._getField(identifiant, champ).setMandatory(isMandatory);
                            });
                        });
                }
            },

            async _getTabsData() {
                const utilitiesModel = this.getInterface().getModel("utilities");
                const [missions, previsions, recaps, opport, pxAutres] = await Promise.all([
                    utilitiesModel.getBEMissions(),
                    utilitiesModel.getBEPrevisions(),
                    utilitiesModel.getBERecaps(),
                    utilitiesModel.getBEOpport(),

                    //Bugets PX
                    //utilitiesModel.getBEPxAutres()
                ]);

                utilitiesModel.setMissions(missions || []);
                utilitiesModel.setRecaps(recaps || []);
                utilitiesModel.setPrevisions(previsions || []);
                utilitiesModel.setOpport(opport || []);
                
                //Bugets PX
                //utilitiesModel.setPxAutres(pxAutres || []);

            },

            _onObjectExtMatched: async function (e) {
                const utilitiesModel = this.getInterface().getModel("utilities");
                const bCreateMode = this.getView().getModel("ui").getProperty("/createMode");

                this._setTabsVisible();
                this._setFieldVisible();
                this._attachChangeEventOnFields();
                this._setFieldEnabled();
                this._setDefaultMandatory();
                

                //1. if create
                if (bCreateMode) { utilitiesModel.reInit(); return }

                const sPeriod = e.context.getProperty("p_period");
                if (sPeriod) { utilitiesModel.setYearByPeriod(sPeriod); }

                const sBusinessNo = e.context.getProperty("BusinessNo");
                if (sBusinessNo) { utilitiesModel.setBusinessNo(sBusinessNo); }

                //redirection, si pas de period ou non en création mode
                if (!utilitiesModel.getYear() && !bCreateMode) {
                    window.location.hash = "";
                    return;
                }

                if (sPeriod && sBusinessNo && !bCreateMode) {
                    try {
                        const tabData = await this._getTabsData();
                    } catch (error) {
                        console.logs(error);
                    }
                }

                //2. Display Different Fragments Based on Company Code Country
                const sCountry = e.context.getProperty("CompanyCountry");

                if (sCountry === "FR") {
                    this._loadFragment("Missions");
                } else {
                    this._loadFragment("hoai");
                }

            },

            //_loadFragment: function (sFragmentName) {
            _loadFragment: async function (sFragmentName) {
                var sViewId = this.getView().getId();
                var oContainer = sap.ui.getCore().byId(
                    sViewId + "--budgets--detailsDynamicContainer");

                if (!oContainer) {
                    console.error("Dynamic container not found");
                    return;
                }

                // Clear any existing content
                oContainer.destroyItems();


                //if missions -- clean this !
                if (sFragmentName === "Missions") {
                    try {
                        const oFragment = await sap.ui.core.Fragment.load({
                            name: "com.avv.ingerop.ingeropfga.ext.view.tab.detail." + sFragmentName,
                            id: sViewId,
                            controller: this
                        });

                        oContainer.addItem(oFragment);
                    } catch (oError) {
                        sap.m.MessageBox.error("Failed to load fragment: " + oError.message);
                    }

                    //Prepare tree for missions
                    this.prepareMissionsTreeData();
                }
                else {

                    try {
                        const oFragment = await sap.ui.core.Fragment.load({
                            name: "com.avv.ingerop.ingeropfga.ext.view.tab.DetailsTab",
                            id: sViewId,
                            controller: this
                        });

                        oContainer.addItem(oFragment);
                    } catch (oError) {
                        sap.m.MessageBox.error("Failed to load fragment: " + oError.message);
                    }

                }

            },

            _onRouteMatched(event) {
                console.logs(event);
            },

            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {
                /**
                * Called when a controller is instantiated and its View controls (if available) are already created.
                * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time       initialization.
                * @memberOf sap.fe.cap.customer.ext.controller.PassengerOPExtend
                */

                onInit: async function () {

                    // call the base component's init function
                    //UIComponent.prototype.init.apply(this, arguments);

                    /*var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZFGA_SRV");
                    var sPath = sap.ui.require.toUrl("com/avv/ingerop/ingeropfga/model/mock/");

                    var oRafListModel = new JSONModel();
                    oRafListModel.loadData(sPath + "rafList.json", null, false);
                    this.getView().setModel(oRafListModel, "rafList");

                    var olistModel = new JSONModel();
                    olistModel.loadData(sPath + "list.json", null, false);
                    this.getView().setModel(olistModel, "list");

                    var olistLineModel = new JSONModel();
                    olistLineModel.loadData(sPath + "listLine.json", null, false);
                    this.getView().setModel(olistLineModel, "listLine");

                    var oProfileModel = new JSONModel();
                    oProfileModel.loadData(sPath + "profile.json", null, false);
                    this.getView().setModel(oProfileModel, "profile");

                    var oMoProfileModel = new JSONModel();
                    oMoProfileModel.loadData(sPath + "moProfile.json", null, false);
                    this.getView().setModel(oMoProfileModel, "moProfile");


                    var oScProfileModel = new JSONModel();
                    oScProfileModel.loadData(sPath + "scProfile.json", null, false);
                    this.getView().setModel(oScProfileModel, "scProfile");

                    var oStProfileModel = new JSONModel();
                    oStProfileModel.loadData(sPath + "stProfile.json", null, false);
                    this.getView().setModel(oStProfileModel, "stProfile");

                    var oPrevProfileModel = new JSONModel();
                    oPrevProfileModel.loadData(sPath + "prevProfile.json", null, false);
                    this.getView().setModel(oPrevProfileModel, "prevProfile");*/


                    /*var oBudgetModel = new JSONModel();
                    oBudgetModel.loadData(sPath + "budget.json", null, false);

                    var oBindingContext = this.getView().getBindingContext();
                    if (oBindingContext) {
                        var sBusinessNo = oBindingContext.getProperty("BusinessNo");

                        var oBudgetModel = new JSONModel();
                        if (sBusinessNo === "CC526901") { //Hoai
                            oBudgetModel.loadData(sPath + "budgetHoai.json", null, false);
                        } else {
                            oBudgetModel.loadData(sPath + "budget.json", null, false);
                        }
                    }*/

                    /*this.getView().setModel(oBudgetModel, "budget");

                    var oRbaEvolModel = new JSONModel();
                    oRbaEvolModel.loadData(sPath + "rbaEvol.json", null, false);
                    this.getView().setModel(oRbaEvolModel, "rbaEvol");

                    var oZone = new JSONModel();
                    oZone.loadData(sPath + "Zone.json", null, false);
                    this.getView().setModel(oZone, "zone");

                    var oTarif = new JSONModel();
                    oTarif.loadData(sPath + "Tarif.json", null, false);
                    this.getView().setModel(oTarif, "tarif");

                    var oLaw = new JSONModel();
                    oLaw.loadData(sPath + "Law.json", null, false);
                    this.getView().setModel(oLaw, "law");

                    var oFormData = new JSONModel();
                    oFormData.loadData(sPath + "FormData.json", null, false);
                    this.getView().setModel(oFormData, "FormData");*/


                    //this.onObjectMatched(this);

                    this._getExtensionAPI().attachPageDataLoaded(this._onObjectExtMatched.bind(this));

                    // Bind the onItemPress function to the controller context
                    this.onItemPress = this.onItemPress.bind(this);
                    this.onCalculate = this.onCalculate.bind(this);
                    this.onAddHOAIItems = this.onAddHOAIItems.bind(this);
                    this.formatMonthLabel = this.formatMonthLabel.bind(this);


                    // Attach event handler to the list
                    var oList = this.byId("budgetTree");
                    if (oList) {
                        oList.attachItemPress(this.onItemPress);
                    }

                    var oTable = this.getView().byId("STIncomeTab");
                    if (oTable) {
                        oTable.addStyleClass("small-text");
                    }
                },

                // Called before the table is rebound (can be used to adjust binding parameters)
                onBeforeRebindTableExtension: function (oEvent) {
                    console.log("onBeforeRebindTableExtension called", oEvent);

                },

                // Called when the list navigation is triggered
                onListNavigationExtension: function (oEvent) {
                    console.log("onListNavigationExtension called", oEvent);
                },

                beforeSaveExtension() {
                    try {
                        const utilitiesModel = this.getModel("utilities");

                        // Accès au contexte via la vue
                        const oView = this.base.getView();
                        const oContext = oView.getBindingContext();

                        if (!oContext) {
                            MessageBox.error("Aucun contexte lié à la vue !");
                            throw new Error("Impossible d'accéder au contexte.");
                        }

                        if (!this.getModel("utilities").validDataBeforeSave()) {
                            MessageBox.error("Veuillez Vérifier tous les champs");
                            return new Promise().reject();
                        }

                        return new Promise(async (resolve, reject) => {
                            const formattedMissions = utilitiesModel.getFormattedMissions();
                            const oPayload = Helper.extractPlainData({ ...oContext.getObject(), "to_Missions": formattedMissions });
                            const updatedFGA = await utilitiesModel.deepUpsertFGA(oPayload);
                            if (updatedFGA) {
                                Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView());
                            }
                            reject();
                        });

                        // const isCreationMode = oView.getModel("ui").getProperty("/createMode");

                        // if (isCreationMode) {
                        //     return new Promise(async (resolve, reject) => {
                        //         const formattedMissions = utilitiesModel.getFormattedMissions();
                        //         const oPayload = Helper.extractPlainData({ ...oContext.getObject(), "to_Missions": formattedMissions });
                        //         const createdFGA = await utilitiesModel.deepCreateFGA(oPayload);
                        //         if (createdFGA) {
                        //             Helper.validMessage("FGA created: " + createdFGA.BusinessNo, this.getView());
                        //         }
                        //         reject();
                        //     });
                        // } else {
                        // return new Promise(async (resolve, reject) => {
                        //     const formattedMissions = utilitiesModel.getFormattedMissions();
                        //     const oPayload = Helper.extractPlainData({ ...oContext.getObject(), "to_Missions": formattedMissions });
                        //     const updatedFGA = await utilitiesModel.deepUpdatedFGA(oPayload);
                        //     if (updatedFGA) {
                        //         Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView());
                        //     }
                        //     reject();
                        // });
                        // }
                    } catch (error) {
                        // sap.m.MessageToast.show("FGA create fail");
                        Helper.errorMessage("FGA create fail");
                        console.log(error);
                    }
                },
            },

            routing: {

            },

            prepareMissionsTreeData: function () {
                var missions = this.getView().getModel("utilities").getProperty("/missions");
                var treeData = [];

                // Group by FGA (BusinessNo)
                var fgaGroups = {};
                missions.forEach(function (mission) {
                    if (!fgaGroups[mission.BusinessNo]) {
                        fgaGroups[mission.BusinessNo] = {
                            name: mission.BusinessNo,
                            isNode: true,
                            isL0: true,
                            children: {}
                        };
                    }

                    // Group by Regroupement within each FGA
                    if (!fgaGroups[mission.BusinessNo].children[mission.Regroupement]) {
                        fgaGroups[mission.BusinessNo].children[mission.Regroupement] = {
                            name: mission.Regroupement,
                            isNode: true,
                            isL0: false,
                            children: []
                        };
                    }

                    // Add mission
                    fgaGroups[mission.BusinessNo].children[mission.Regroupement].children.push(mission);
                });

                // Convert to array structure
                for (var fga in fgaGroups) {
                    var fgaNode = fgaGroups[fga];
                    fgaNode.children = Object.values(fgaNode.children);
                    treeData.push(fgaNode);
                }

                this.getView().getModel("utilities").setProperty("/missionsHierarchy", treeData);
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
                const MissionId = `${BusinessNo}-${paddedNum}`; // "MEDXXXXXX000000069-005"
                //End this code needs refactoring

                // Create new mission with default values
                var oNewMission = {
                    BusinessNo: oGroupementNode.name, // Or get from parent if stored differently
                    Regroupement: oGroupementNode.Regroupement,
                    MissionId: "NEW_MISSION_" + new Date().getTime(),
                    MissionCode: "",
                    StartDate: null,
                    EndDate: null,
                    isNode: false
                };

                // Add to the groupement's children
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

            formatMonthLabel: function (sMonth, sYear) {
                // console.log("Formatter appelé avec :", sMonth, sYear);
                return sMonth + "/" + sYear;
            },

            _logAllControlIds: function (oControl) {
                if (oControl) {
                    console.log(oControl.getId()); // Log the control's ID

                    // Recursively log IDs of child controls
                    if (oControl.getContent) {
                        oControl.getContent().forEach(this._logAllControlIds.bind(this));
                    }
                    if (oControl.getItems) {
                        oControl.getItems().forEach(this._logAllControlIds.bind(this));
                    }
                    if (oControl.getAggregation) {
                        var aAggregations = oControl.getMetadata().getAllAggregations();
                        aAggregations.forEach(function (sAggregation) {
                            var oAggregatedControl = oControl.getAggregation(sAggregation);
                            if (oAggregatedControl) {
                                if (Array.isArray(oAggregatedControl)) {
                                    oAggregatedControl.forEach(this._logAllControlIds.bind(this));
                                } else {
                                    this._logAllControlIds(oAggregatedControl);
                                }
                            }
                        }.bind(this));
                    }
                }
            },

            onCellDblClickSyntTable: function (oEvent) {
                var oSyntTable = this.getView().byId("synthesisTab");
                // oSyntTable._findAndfireCellEvent(null, oEvent);
                var oCellParams = this._getCellContext(oSyntTable, oEvent.target);
                if (!oCellParams) {
                    return;
                }

                var sNature = oCellParams.rowBindingContext.getObject("NatureBudgetCode");
                var sPeriod = oSyntTable.getColumns()[oCellParams.columnIndex].data("Period");

                if (sNature && sPeriod) {
                    this._displayComptaTable(sNature, sPeriod);
                }
            },

            /*onObjectMatched: function (oThis) {
                //var oArgument = oEvent.getParameter("arguments");
                //var sId = oArgument.id;

                var oTextControl = this.base.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGA--com.sap.vocabularies.UI.v1.FieldGroup::General::BusinessNo::Field");
                if (oTextControl) {
                    var sValue = oTextControl.getValue();
                    console.log("BusinessNo from control:", sValue);
                }
                var sId = 'CC526901'

                this.setAppVersion();

                this.getView().getModel("rafList").setProperty("/results/0/Mission", sId);

                this._buildListLineData(sId);

                //this._addSynthesisStyle();

                this._buildMoProfile();
                this._buildScProfile();
                this._buildStProfile();
                this._buildPrevProfile();

                this._calculAll();

            },*/

            onRowsUpdatedSyntTab: function () {
                //this._addSynthesisStyle();
            },
            onRowsUpdatedBudgetTab: function () {
                //var sTabName = this.getView().byId("budgetItb").getSelectedKey();
                var sTabName = this.oView.byId("budgetItb").getSelectedKey();

                this._addBudgetStyle(sTabName);
            },
            onRowsUpdatedSimulTab: function (oEvent) {
                var sTableId = oEvent.getSource().getId();
                if (sTableId.indexOf("SimulTab") !== -1) {
                    this._addBudgetStyle(sTableId);
                } else {
                    this._addPrevisionStyle(sTableId);
                }
            },

            onChangeBudget: function (oEvent) {
                this._persistBudgetValue(oEvent.getSource());

                this._calculAll();
            },

            onBtnOpenMOProfilePress: function () {
                this._ProfileType = "MO";
                this._openProfileDialog("MO");
            },
            onBtnOpenSCProfilePress: function () {
                this._ProfileType = "SC";
                this._openProfileDialog("SC");
            },
            onBtnOpenSTProfilePress: function () {
                this._ProfileType = "ST";
                this._openProfileDialog("ST");
            },

            onBtnProfileConfirmPressed: function () {
                this._persistProfileChange(this._ProfileType);
                this._closeDialog();
            },


            onBtnAddProfilePress: function () {
                let aProfileList = this.getModel("profileList").getProperty("/results");

                aProfileList.push({
                    "ProfileNo": aProfileList.length + 1,
                    "ProfileID": "",
                    "ProfileName": "",
                    "ProfileType": "",
                    "ProfileRate": "1"
                });

                this.getModel("profileList").setProperty("/results", aProfileList);

            },

            onBtnCancelPressed: function () {
                this._closeDialog();
            },

            onChangeSimulation: function () {
                this._persistBudgetValue(oEvent.getSource());

                this._calculSimulation();
            },

            onRAFListItemPress: function (oEvent) {
                this.getModel("settings").setProperty("/displatRafDetail", true);
            },


            onNavToJournalEntry: function (oEvent) {
                // const CrossApplicationNavigation =  Container.getServiceAsync("CrossApplicationNavigation");
                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");

                oCrossAppNav.hrefForExternalAsync({
                    target: {
                        semanticObject: "AccountingDocument",
                        action: "displayFactSheet"
                    },
                    params: {
                        "AccountingDocument": "100000000",
                        "CompanyCode": "AR10",
                        "FiscalYear": "2024"
                    }
                }).then(function (hRef) {
                    window.open(hRef, '_blank');
                });
            },


            /*********************************************************************************************
             * Internal Methods
             *********************************************************************************************/
            _persistBudgetValue: function (oSource) {
                var oValue = oSource.getValue();
                oSource.setValue(this.formatNumber(oValue));

                var oLinePath = oSource.getBindingContext("budget");
                var oFieldPath = oSource.getBinding("value").getPath();

                this.getModel("budget").setProperty(oLinePath + "/" + oFieldPath, this._convertToFloat(oValue));
            },

            _getCellContext: function (oTable, oTarget) {
                var $target = jQuery(oTarget);
                // find out which cell has been clicked
                var $cell = $target.closest(".sapUiTableDataCell");
                var sId = $cell.attr("id");
                var aMatches = /.*-row(\d*)-col(\d*)/i.exec(sId);
                var bCancel = false;
                var oParams = null;
                // TBD: cellClick event is currently not fired on row action cells.
                // If this should be enabled in future we need to consider a different set of event parameters.
                if (aMatches) {
                    var iRow = aMatches[1];
                    var iCol = aMatches[2];
                    var oRow = oTable.getRows()[iRow];
                    var oCell = oRow && oRow.getCells()[iCol];
                    var iRealRowIndex = oRow && oRow.getIndex();
                    var sColId = sap.ui.table.Column.ofCell(oCell).getId();
                    var oRowBindingContext = oRow.getRowBindingContext();
                    oParams = {
                        rowIndex: iRealRowIndex,
                        columnIndex: iCol,
                        columnId: sColId,
                        cellControl: oCell,
                        rowBindingContext: oRowBindingContext,
                        cellDomRef: $cell.get(0)
                    };
                }
                return oParams;
            },
            _displayComptaTable: function (sNature, sPeriod) {
                if (!this._DrilldownDialogFrg) {
                    this._DrilldownDialogFrg = this.loadFragment({
                        name: "com.avv.ingerop.ingeropfga.ext.view.tab.synthese.dialog.DrilldownDialog"
                    });
                }
                this._DrilldownDialogFrg.then(function (oDialog) {
                    var oComptaTable = this.getView().byId("importComptaTab");
                    var oVentilTable = this.getView().byId("importVentilTab");
                    var aComptaFilter = [];
                    var aVentilFilter = [];
                    aComptaFilter.push(new sap.ui.model.Filter("NatureBudgetCode", "EQ", sNature));
                    if (sPeriod === "CumulN-1") {
                        aComptaFilter.push(new sap.ui.model.Filter("Period", "LT", "202301"));
                        aVentilFilter.push(new sap.ui.model.Filter("Period", "LT", "202301"));
                    } else if (sPeriod === "YearN") {
                        aComptaFilter.push(new sap.ui.model.Filter("Period", "GE", "202301"));
                        aVentilFilter.push(new sap.ui.model.Filter("Period", "GE", "202301"));
                    } else if (sPeriod === "CumulN") {

                    } else {
                        aComptaFilter.push(new sap.ui.model.Filter("Period", "EQ", sPeriod));
                        aVentilFilter.push(new sap.ui.model.Filter("Period", "EQ", sPeriod));

                    }

                    // oComptaTable.getBinding("rows").filter(aComptaFilter);
                    // oVentilTable.getBinding("rows").filter(aVentilFilter);

                    this._aComptaFilter = aComptaFilter;
                    this._aVentilFilter = aVentilFilter;

                    oComptaTable.rebindTable();
                    oVentilTable.rebindTable();

                    oDialog.open();
                }.bind(this));
            },

            onBeforeRebindTableCompta: function (oEvent) {
                var oBindingParams = oEvent.getParameter("bindingParams");
                oBindingParams.filter = this._aComptaFilter;
            },

            onBeforeRebindTableVentil: function (oEvent) {
                var oBindingParams = oEvent.getParameter("bindingParams");
                oBindingParams.filter = this._aVentilFilter;
            },

            _openProfileDialog: function (sType) {
                let oProfileModel = this.getModel("profile");

                this.getModel("profileList").setProperty("/type", sType);
                if (!this._ProfileDialog) {
                    this._ProfileDialog = this.loadFragment({
                        name: "com.avv.ingerop.ingeropfga.ext.view.tab.budget.dialog.ProfileDialog"
                    });
                }
                switch (sType) {
                    case "MO":
                        this.getModel("profileList").setProperty("/results", oProfileModel.getProperty("/moProfile"));
                        break;
                    case "SC":
                        this.getModel("profileList").setProperty("/results", oProfileModel.getProperty("/scProfile"));
                        break;
                    case "ST":
                        this.getModel("profileList").setProperty("/results", oProfileModel.getProperty("/stProfile"));
                        break;
                }
                this._ProfileDialog.then(function (oDialog) {
                    oDialog.open();
                }.bind(this));
            },

            _persistProfileChange: function (sType) {
                let aProfileList = this.getModel("profileList").getProperty("/results");
                let oTable = null;
                switch (sType) {
                    case "MO":
                        this.getModel("profile").setProperty("/moProfile", aProfileList);
                        this._buildMoProfile();
                        // oTable = this.getView().byId("MOIncomeTab").invalidate();
                        break;
                    case "SC":
                        this.getModel("profile").setProperty("/scProfile", aProfileList);
                        this._buildScProfile();
                        // oTable = this.getView().byId("SCIncomeTab").invalidate();
                        break;
                    case "ST":
                        this.getModel("profile").setProperty("/stProfile", aProfileList);
                        this._buildStProfile();
                        // oTable = this.getView().byId("STIncomeTab").invalidate();
                        break;
                }
                // this.getView().getModel("scProfile").refresh(true);
                this._calculAll();
            },

            _closeDialog: function () {
                if (this._DrilldownDialogFrg) {
                    this._DrilldownDialogFrg.then(function (oDialog) {
                        oDialog.close();
                    });
                }
                if (this._ProfileDialog) {
                    this._ProfileDialog.then(function (oDialog) {
                        oDialog.close();
                    });
                }
            },
            // Calcul
            _calculAll: function () {
                this._calculTotals();

                this._calculChartInfos();

            },

            _calculSimulation: function () {

            },

            _calculPlanningLine: function (oBudgetLine) {

            },

            _calculTotals: function () {
                var aBudgetLine = this.getModel("budget").getProperty("/results");
                var oMOProfile = this.getModel("moProfile").getData();
                var oSCProfile = this.getModel("scProfile").getData();
                var oSTProfile = this.getModel("stProfile").getData();
                var oTotalLine = {};

                for (var i in aBudgetLine) {
                    var oLine = aBudgetLine[i];
                    if (oLine.Type == "T") {
                        var keys = Object.keys(oTotalLine);
                        for (var k in keys) {
                            var key = keys[k];
                            if (typeof oTotalLine[key] === "number") {
                                aBudgetLine[i][key] = this._convertToFloat(oTotalLine[key]);
                            } else {
                                aBudgetLine[i][key] = oTotalLine[key];
                            }
                        }

                        this._refreshSyntheseData(oTotalLine);
                    } else if (oLine.Type == "C") {
                    } else if (oLine.Type == "V") {
                    } else {

                        oLine.MOYetToCome = 0;
                        oLine.SCForecastExclCoef = 0;
                        oLine.SCForecastInclCoef = 0;
                        oLine.SCYetToCome = 0;
                        oLine.INVContractInterUFO = 0;
                        oLine.INVContractIntraUFO = 0;
                        for (var n = 1; n <= 10; n++) {
                            // Calculate line total
                            // MO Profile
                            var sProfileField = "Profile" + n;
                            var oCalculMORate = this._convertToFloat(oLine[sProfileField]) * this._convertToFloat(oMOProfile[sProfileField + "Rate"]);
                            oCalculMORate = this._convertToFloat(oCalculMORate);
                            if (oLine.Status === "Acquis") {
                                oLine.MOYetToCome += oCalculMORate;
                            }

                            if (!oTotalLine[sProfileField]) {
                                oTotalLine[sProfileField] = 0;
                            }
                            oTotalLine[sProfileField] += oCalculMORate;

                            // SC Supplier
                            if (oLine.Status === "Acquis") {
                                var sSupplierField = "Supplier" + n;
                                var oSupplierValue = this._convertToFloat(oLine[sSupplierField]);
                                var oCalculSCRate = oSupplierValue * this._convertToFloat(oSCProfile[sSupplierField + "Rate"]);
                                oCalculSCRate = this._convertToFloat(oCalculSCRate);

                                oLine.SCForecastExclCoef += oSupplierValue;
                                oLine.SCForecastInclCoef += oCalculSCRate;

                                if (!oTotalLine[sSupplierField]) {
                                    oTotalLine[sSupplierField] = 0;
                                }
                                oTotalLine[sSupplierField] += oSupplierValue;

                            }

                            // ST Profile
                            var sInteralField = "Internal" + n;
                            var oInternalValue = this._convertToFloat(oLine[sInteralField]);
                            if (oSTProfile[sInteralField + "Type"] === "Inter UFO") {
                                oLine.INVContractInterUFO += oInternalValue;
                            } else if (oSTProfile[sInteralField + "Type"] === "Intra UFO") {
                                oLine.INVContractIntraUFO += oInternalValue;
                            }

                            if (!oTotalLine[sInteralField]) {
                                oTotalLine[sInteralField] = 0;
                            }
                            oTotalLine[sInteralField] += oInternalValue;

                            // // Prevision
                            // var sInteralField = "PrevProfile" + n;

                            // oLine.PrevCost = oLine.SCForecastInclCoef 
                            // 			   + oLine.MOForecast
                            // 			   + oLine.OtherForecast;
                            // oLine.PrevRBA = oLine.INVForecast - oLine.PrevCost;
                            // if (oLine.INVForecast !== 0) {
                            // 	oLine.PrevRBAP = oLine.PrevRBA / oLine.INVForecast;
                            // }
                            // if (oLine.PrevPhysProgress) {
                            // 	oLine.PrevMOCostForecast = oLine.PrevPhysProgress * oLine.MOForecast;
                            // }

                        }
                        // MO
                        oLine.MOForecast = this._convertToFloat(oLine.CumulN) + this._convertToFloat(oLine.MOYetToCome);
                        if (!oTotalLine.NbOfMonth) {
                            oTotalLine.NbOfMonth = 0;
                        }
                        if (!oTotalLine.MOYetToCome) {
                            oTotalLine.MOYetToCome = 0;
                        }
                        if (!oTotalLine.MOForecast) {
                            oTotalLine.MOForecast = 0;
                        }
                        if (oLine.Status === "Acquis") {
                            // oTotalLine.NbOfMonth += this._convertToFloat(oLine.NbOfMonth);
                            oTotalLine.MOYetToCome += oLine.MOYetToCome;
                            oTotalLine.MOForecast += oLine.MOForecast;
                        }

                        // SC
                        if (!oTotalLine.SCForecastExclCoef) {
                            oTotalLine.SCForecastExclCoef = 0;
                        }
                        if (!oTotalLine.SCForecastInclCoef) {
                            oTotalLine.SCForecastInclCoef = 0;
                        }
                        if (oLine.Status === "Acquis") {
                            oLine.SCYetToCome = this._convertToFloat(oLine.SCForecastInclCoef) - this._convertToFloat(oLine.SCActual);
                            oTotalLine.SCForecastExclCoef += oLine.SCForecastExclCoef;
                            oTotalLine.SCForecastInclCoef += oLine.SCForecastInclCoef;
                        }

                        // ST
                        if (!oTotalLine.INVContractInterUFO) {
                            oTotalLine.INVContractInterUFO = 0;
                        }
                        if (!oTotalLine.INVContractIntraUFO) {
                            oTotalLine.INVContractIntraUFO = 0;
                        }
                        oTotalLine.INVContractInterUFO += oLine.INVContractInterUFO;
                        oTotalLine.INVContractIntraUFO += oLine.INVContractIntraUFO;


                        // Other
                        if (!oTotalLine.TravelExpense) {
                            oTotalLine.TravelExpense = 0;
                        }
                        if (!oTotalLine.OtherExpense) {
                            oTotalLine.OtherExpense = 0;
                        }
                        if (!oTotalLine.DoubtfullDept) {
                            oTotalLine.DoubtfullDept = 0;
                        }
                        if (!oTotalLine.Study) {
                            oTotalLine.Study = 0;
                        }
                        if (!oTotalLine.ClaimLitigation) {
                            oTotalLine.ClaimLitigation = 0;
                        }
                        if (!oTotalLine.OtherRisk) {
                            oTotalLine.OtherRisk = 0;
                        }
                        if (!oTotalLine.OtherForecast) {
                            oTotalLine.OtherForecast = 0;
                        }
                        if (!oTotalLine.OtherYetToCome) {
                            oTotalLine.OtherYetToCome = 0;
                        }
                        oTotalLine.TravelExpense += this._convertToFloat(oLine.TravelExpense);
                        oTotalLine.OtherExpense += this._convertToFloat(oLine.OtherExpense);
                        oTotalLine.DoubtfullDept += this._convertToFloat(oLine.DoubtfullDept);
                        oTotalLine.Study += this._convertToFloat(oLine.Study);
                        oTotalLine.ClaimLitigation += this._convertToFloat(oLine.ClaimLitigation);
                        oTotalLine.OtherRisk += this._convertToFloat(oLine.OtherRisk);

                        oLine.OtherForecast = this._convertToFloat(oLine.TravelExpense) +
                            this._convertToFloat(oLine.OtherExpense) +
                            this._convertToFloat(oLine.DoubtfullDept) +
                            this._convertToFloat(oLine.Study) +
                            this._convertToFloat(oLine.ClaimLitigation) +
                            this._convertToFloat(oLine.OtherRisk);
                        oLine.OtherForecast = this._convertToFloat(oLine.OtherForecast);
                        oTotalLine.OtherForecast += this._convertToFloat(oLine.OtherForecast);

                        oLine.OtherYetToCome = this._convertToFloat(oLine.OtherForecast) - this._convertToFloat(oLine.OtherActual);
                        oTotalLine.OtherYetToCome += this._convertToFloat(oLine.OtherYetToCome);

                        aBudgetLine[i] = oLine;
                    }

                }

                this.getModel("budget").setProperty("/results", aBudgetLine);
            },

            _calculChartInfos: function () {
                //this._calculRBAEvol();
            },

            _calculRBAEvol: function () {
                var aRBAEvolData = [];

                var oRBAInfo = this.getModel("recap").getProperty("/results").find(function (e) {
                    return e.ID === "RBAP";
                });

                if (oRBAInfo) {
                    //P0
                    aRBAEvolData.push(this._addRBALine(oRBAInfo, "P0"));
                    //Cumul N-1
                    aRBAEvolData.push(this._addRBALine(oRBAInfo, "CumulN-1"));
                    //Year N
                    aRBAEvolData.push(this._addRBALine(oRBAInfo, "YearN"));
                    //Month M
                    aRBAEvolData.push(this._addRBALine(oRBAInfo, "MonthM"));
                    //Forecast
                    aRBAEvolData.push(this._addRBALine(oRBAInfo, "Forecast"));
                }

                this.getModel("rbaEvol").setProperty("/results", aRBAEvolData);

            },

            _refreshSyntheseData: function (oTotalLine) {
                var aSyntheseLine = this.getModel("synthesis").getProperty("/results");
                var oRecetteLine = null;
                var oChargeLine = null;
                var oTotalForecast = 0;
                var oRecette = 0;
                var oCharge = 0;
                // var oTotalYetToCome = 0;
                for (var x in aSyntheseLine) {
                    if (!aSyntheseLine[x].TypeFact) {
                        continue;
                    }
                    switch (aSyntheseLine[x].NatureBudgetCode) {
                        case "B_RCAEXT": //Facturations externes
                            if (oTotalLine.INVExt) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVExt);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_RCAEXT": //Facturations Groupe
                            if (oTotalLine.INVGrp) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVGrp);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_RSTRIN": //Sous-traitance Inter UFO
                            if (oTotalLine.INVContractInterUFO) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVContractInterUFO);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_RSTRIA": //Sous-traitance Intra UFO
                            if (oTotalLine.INVContractIntraUFO) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVContractIntraUFO);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DMOINU": //Main d'Å’uvre ventilÃ©e UFO
                            if (oTotalLine.MOForecast) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.MOForecast);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_RCAOTH": //Autres produits
                            if (oTotalLine.INVOther) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVOther);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DMOEXU": //Main d'Å’uvre ventilÃ©e autres UFO/StÃ©s

                            break;
                        case "B_DDEPLA": //Voyages, dÃ©placements, rÃ©ception
                            if (oTotalLine.TravelExpense) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.TravelExpense);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DTIRAG": //Autres frais de fonctionnement
                            if (oTotalLine.OtherExpense) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.OtherExpense);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DFGXST": //Frais gÃ©nÃ©raux sur sous-traitance
                            if (oTotalLine.SCForecastExclCoef > 0 && oTotalLine.SCForecastInclCoef > 0) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.SCForecastInclCoef) - this._convertToFloat(oTotalLine.SCForecastExclCoef);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DSTREX": //Sous-Traitances Tiers
                            if (oTotalLine.SCForecastExclCoef) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.SCForecastExclCoef);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DETUDE"://Aleas Etude et travaux
                            if (oTotalLine.Study) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.Study);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DSINIS": //Aleas Sinistres et contentieux
                            if (oTotalLine.ClaimLitigation) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.ClaimLitigation);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;
                        case "B_DIVERS": //Aleas divers
                            if (oTotalLine.OtherRisk) {
                                aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.OtherRisk);
                                aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                            }
                            break;

                    }

                    if (aSyntheseLine[x].Type === "T") {
                        if (aSyntheseLine[x].TypeFact === "RC") {
                            oRecette += this._convertToFloat(oTotalForecast);
                        } else if (aSyntheseLine[x].TypeFact === "MO" || aSyntheseLine[x].TypeFact === "OT") {
                            oCharge += this._convertToFloat(oTotalForecast);
                        }
                        if (aSyntheseLine[x].TypeFact === "T") {
                            aSyntheseLine[x].Forecast = oRecette - oCharge;
                        } else if (aSyntheseLine[x].TypeFact === "CX") {
                            aSyntheseLine[x].Forecast = oCharge;
                        } else {
                            aSyntheseLine[x].Forecast = this._convertToFloat(oTotalForecast);
                        }
                        aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
                        if (aSyntheseLine[x].TypeFact === "RC") {
                            oRecetteLine = $.extend({}, aSyntheseLine[x]);
                        } else if (aSyntheseLine[x].TypeFact === "CX") {
                            oChargeLine = $.extend({}, aSyntheseLine[x]);
                        }
                        oTotalForecast = 0;
                    } else {
                        oTotalForecast += this._convertToFloat(aSyntheseLine[x].Forecast);
                    }
                }

                this.getModel("synthesis").setProperty("/results", aSyntheseLine);


                var aRecapLine = this.getModel("recap").getProperty("/results");
                var oRecapObject = {};

                for (var y in aRecapLine) {
                    var oRecap = aRecapLine[y];

                    switch (oRecap.ID) {
                        case "FAC": // Facturation
                            oRecap.Forecast = this._convertToFloat(oRecetteLine.Forecast);

                            oRecap.CumulN = this._convertToFloat(oRecetteLine.CumulN);

                            break;
                        case "CHR": // Charges
                            oRecap.Forecast = this._convertToFloat(oChargeLine.Forecast);

                            oRecap.CumulN = this._convertToFloat(oChargeLine.CumulN);

                            break;
                        case "AP": // Avancement (%)
                            oRecap.CumulN = this._convertToFloat(oChargeLine.CumulN) / this._convertToFloat(oChargeLine.Forecast);
                            oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"], 3);
                            oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"], 3);
                            break;

                    }

                    if (oRecap.Type !== "P") {
                        oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
                        oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
                        oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
                    }

                    oRecapObject[oRecap.ID] = $.extend({}, oRecap);


                    aRecapLine[y] = oRecap;
                }

                for (var y in aRecapLine) {
                    var oRecap = aRecapLine[y];

                    switch (oRecap.ID) {
                        case "CA":
                            oRecap.Forecast = this._convertToFloat(oRecetteLine.Forecast);
                            oRecap.CumulN = oRecapObject["AP"].CumulN * this._convertToFloat(oRecetteLine.Forecast);
                            oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
                            oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
                            oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
                            break;
                        case "AJU": // Ajustement
                            oRecap.CumulN = this._convertToFloat(oRecapObject["CA"].CumulN) - this._convertToFloat(oRecapObject["FAC"].CumulN);
                            oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
                            oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
                            oRecap.YetToCome = 0;
                            break;
                        case "PAR": // PAT
                            if ((this._convertToFloat(oRecetteLine.Forecast) - this._convertToFloat(oChargeLine.Forecast) < 0)) {
                                oRecap.CumulN = (1 - this._convertToFloat(oRecapObject["AP"].CumulN)) * (this._convertToFloat(oRecetteLine.Forecast) - this._convertToFloat(oChargeLine.Forecast));
                            } else {
                                oRecap.CumulN = 0;
                            }
                            oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
                            oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
                            oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
                            break;
                        case "RBA": // RBA
                            oRecap.Forecast = this._convertToFloat(oRecapObject["CA"].Forecast) - this._convertToFloat(oRecapObject["CHR"].Forecast);

                            oRecap.CumulN = this._convertToFloat(oRecapObject["CA"].CumulN) - this._convertToFloat(oRecapObject["CHR"].CumulN) + this._convertToFloat(oRecapObject["PAR"].CumulN);
                            oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
                            oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
                            oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
                            break;
                        case "RBAP": // RBA (%)
                            oRecap.Forecast = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].Forecast) / this._convertToFloat(oRecapObject["CA"].Forecast), 3);
                            oRecap.CumulN = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].CumulN) / this._convertToFloat(oRecapObject["CA"].CumulN), 3);
                            oRecap.YearN = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].YearN) / this._convertToFloat(oRecapObject["CA"].YearN), 3);
                            oRecap.MonthM = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].MonthM) / this._convertToFloat(oRecapObject["CA"].MonthM), 3);
                            oRecap.YetToCome = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].YetToCome) / this._convertToFloat(oRecapObject["CA"].YetToCome), 3);
                            break;
                    }
                    oRecapObject[oRecap.ID] = $.extend({}, oRecap);
                }


                this.getModel("recap").setProperty("/results", aRecapLine);
            },

            _addRBALine: function (oRBAInfo, sInfo) {
                return {
                    "Type": this.getResourceBundle().getText("recap." + sInfo),
                    "Percent": this._convertToPercent(oRBAInfo[sInfo])
                };
            },

            // Data management
            _buildListLineData: function (sId) {
                //console.log("Model data:", this.getModel("list").getData());

                var oListLine = this.getModel("list").getProperty("/results").find(function (e) {
                    return e.BusinessNo === sId;
                });

                this.getModel("listLine").setData(oListLine);
            },

            _buildMoProfile: function () {
                var sPrefix = "Profile";
                var aProfileData = this.getModel("profile").getProperty("/moProfile");
                // var aMOProfile = [];
                var oMOProfile = {};
                for (var i in aProfileData) {
                    var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
                    var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
                    var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
                    oMOProfile[sIDField] = aProfileData[i].ProfileID;
                    oMOProfile[sRateField] = aProfileData[i].ProfileRate;
                    oMOProfile[sNameField] = aProfileData[i].ProfileName;
                }

                this.getModel("moProfile").setData(oMOProfile);
            },
            _buildScProfile: function () {
                var sPrefix = "Supplier";
                var aProfileData = this.getModel("profile").getProperty("/scProfile");
                // var aMOProfile = [];
                var oSCProfile = {};
                for (var i in aProfileData) {
                    var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
                    var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
                    var sTypeField = sPrefix + aProfileData[i].ProfileNo + "Type";
                    var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
                    oSCProfile[sIDField] = aProfileData[i].ProfileID;
                    oSCProfile[sRateField] = aProfileData[i].ProfileRate;
                    oSCProfile[sTypeField] = aProfileData[i].ProfileType;
                    oSCProfile[sNameField] = aProfileData[i].ProfileName;
                }

                this.getModel("scProfile").setData(oSCProfile);
            },
            _buildStProfile: function () {
                var sPrefix = "Internal";
                var aProfileData = this.getModel("profile").getProperty("/stProfile");
                // var aMOProfile = [];
                var oSTProfile = {};
                for (var i in aProfileData) {
                    var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
                    var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
                    var sTypeField = sPrefix + aProfileData[i].ProfileNo + "Type";
                    var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
                    oSTProfile[sIDField] = aProfileData[i].ProfileID;
                    oSTProfile[sRateField] = aProfileData[i].ProfileRate;
                    oSTProfile[sTypeField] = aProfileData[i].ProfileType;
                    oSTProfile[sNameField] = aProfileData[i].ProfileName;
                }

                this.getModel("stProfile").setData(oSTProfile);
            },
            _buildPrevProfile: function () {
                var sPrefix = "PrevProfile";
                var aProfileData = this.getModel("profile").getProperty("/prevProfile");
                // var aMOProfile = [];
                var oPrevProfile = {};
                for (var i in aProfileData) {
                    var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
                    var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
                    var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
                    oPrevProfile[sIDField] = aProfileData[i].ProfileID;
                    oPrevProfile[sRateField] = aProfileData[i].ProfileRate;
                    oPrevProfile[sNameField] = aProfileData[i].ProfileName;
                }

                this.getModel("prevProfile").setData(oPrevProfile);
            },
            // utils
            _convertToFloat: function (oValue, sDecimal) {
                if (!oValue) {
                    return 0;
                }
                var iDecimal = 2;
                if (sDecimal >= 0) {
                    iDecimal = sDecimal;
                }
                return parseFloat(parseFloat(oValue.toString().replace(" ", "").replace(",", ".")).toFixed(iDecimal));
            },

            _convertToPercent: function (oValue, sDecimal) {
                if (!oValue) {
                    return 0;
                }
                var iDecimal = 2;
                if (sDecimal) {
                    iDecimal = sDecimal;
                }
                return parseFloat(parseFloat(oValue.toString().replace(" ", "").replace(",", ".") * 100).toFixed(iDecimal));
            },

            // Style management
            _addSynthesisStyle: function () {
                this._cssRender("synthesisTab");
            },

            _addBudgetStyle: function (tableName) {
                this._cssRender(tableName);
            },

            _addPrevisionStyle: function (tableName) {
                this._cssRenderPrevision(tableName);
            },

            _cssRender: function (tableName) {
                if (tableName == "synthesisTab") {
                    this._cssRenderSynthesis(tableName);
                } else {
                    this._cssRenderBudget(tableName);
                }
            },

            _cssRenderSynthesis: function (tableName) {

                //var oTable = this.getView().byId(tableName);                
                var rows = this.getView().byId(tableName).getRows();

                var rows = this.oView.byId("SyntheseTab--SyntheseTable--synthesisTab").getRows();

                rows.forEach(function (element, i) {
                    var row = element;
                    var rowDom = row.$();
                    this._removeClass(rowDom);
                    var oCtx = element.getBindingContext("synthesis");
                    if (oCtx) {
                        // var model = this.byId(tableName).getModel("devisItemDisplay").getProperty(oCtx.getPath());
                        var model = oCtx.getProperty(oCtx.getPath());
                        if (model.Type == "T") {
                            this._addClass(rowDom, "totalLine");
                        }
                    }
                }.bind(this));

            },


            _cssRenderBudget: function (tableName) {
                var rows = this.oView.byId(tableName).getRows();
                rows.forEach(function (element, i) {
                    var row = element;
                    // this._removeClass(row);
                    var oCtx = element.getBindingContext("budget");
                    /*if (oCtx) {
                        var rowDom = row.$();
                        this._removeClass(rowDom);
                        var model = oCtx.getProperty(oCtx.getPath());
                        if (model.Type) {
                            if (model.Type == "T") {
                                this._addClass(rowDom, "totalLine");
                            } else if (model.Type == "C") {
                                this._addClass(rowDom, "totalLine");
                            } else if (model.Type == "V") {
                                this._addClass(rowDom, "totalLine");
                            } 
                            var aCells = row.getCells();
                            for (var j in aCells) {
                                var cell = aCells[j];
                                var cellDom = cell.$().parent().parent();
                                this._removeClass(cellDom);
                            }
    
                        } else {
                            var oBudgetTabSettings = this.getModel("budgetTabSettings").getData();
                            var aCells = row.getCells();
                            for (var j in aCells) {
                                var cell = aCells[j];
                                var cellDom = cell.$().parent().parent();
                                this._removeClass(cellDom);
                                var sPath = "";
                                var sClass = cell.getMetadata()._sClassName;
                                switch(sClass) {
                                    case "sap.m.Text":
                                        sPath = cell.getBinding("text").getPath();
                                        break;
                                    case "sap.m.Input":
                                        sPath = cell.getBinding("value").getPath();
                                        break;
                                    case "sap.m.Select":
                                        sPath = cell.getBinding("selectedKey").getPath();
                                        break;
                                    case "sap.m.VBox":
                                        if (cell.getItems().length > 0) {
                                            sPath = cell.getItems()[0].getBinding("value").getPath();
                                        }
                                        break;
                                    default:
                                        break;
                                }
                                if (sPath &&$.inArray(sPath, oBudgetTabSettings.recommandedZone) != -1) {
                                    this._addClass(cellDom, "recommandedZone");
                                } else if (sPath && $.inArray(sPath, oBudgetTabSettings.mandatoryZone) != -1) {
                                    this._addClass(cellDom, "mandatoryZone");
                                }
                            }
                        }
    
                        // var model = this.byId(tableName).getModel("devisItemDisplay").getProperty(oCtx.getPath());
                        // var model = oCtx.getProperty(oCtx.getPath());
                        // if (model.Type == "T") {
                        // 	this._addClass(row, model);
                        // }
                    }*/
                }.bind(this));

            },

            _cssRenderPrevision: function (tableName) {
                var rows = this.getView().byId(tableName).getRows();
                rows.forEach(function (element, i) {
                    var row = element;
                    // this._removeClass(row);
                    var oCtx = element.getBindingContext("prevision");
                    if (oCtx) {
                        var rowDom = row.$();
                        this._removeClass(rowDom);
                        var model = oCtx.getProperty(oCtx.getPath());
                        var oBudgetTabSettings = this.getModel("budgetTabSettings").getData();
                        var aCells = row.getCells();
                        for (var j in aCells) {
                            var cell = aCells[j];
                            var cellDom = cell.$().parent().parent();
                            this._removeClass(cellDom);
                            var sPath = "";
                            var sClass = cell.getMetadata()._sClassName;
                            switch (sClass) {
                                case "sap.m.Text":
                                    sPath = cell.getBinding("text").getPath();
                                    break;
                                case "sap.m.Input":
                                    sPath = cell.getBinding("value").getPath();
                                    break;
                                case "sap.m.Select":
                                    sPath = cell.getBinding("selectedKey").getPath();
                                    break;
                                case "sap.m.VBox":
                                    if (cell.getItems().length > 0) {
                                        sPath = cell.getItems()[0].getBinding("value").getPath();
                                    }
                                    break;
                                default:
                                    break;
                            }
                            if (sPath && $.inArray(sPath, oBudgetTabSettings.prevision) != -1) {
                                this._addClass(cellDom, "recommandedZone");
                            }
                        }


                        // var model = this.byId(tableName).getModel("devisItemDisplay").getProperty(oCtx.getPath());
                        // var model = oCtx.getProperty(oCtx.getPath());
                        // if (model.Type == "T") {
                        // 	this._addClass(row, model);
                        // }
                    }
                }.bind(this));

            },

            _removeClass: function (element) {
                element.removeClass("totalLine");
                element.removeClass("mandatoryZone");
                element.removeClass("recommandedZone");
            },

            _addClassIfDifferent: function (element, className) {
                if (!element.hasClass(className)) {
                    this._removeClass(element);
                    element.addClass(className);
                    return true;
                }
                return false;
            },

            _addClass: function (element, className) {
                this._addClassIfDifferent(element, className);
            },

            // formatter
            formatRecap: function (oValue, sType) {
                if (sType === "P") {
                    return this._convertToPercent(oValue, 0) + "%";
                } else {
                    return this.formatNumbToNoDecimal(oValue);
                }
            },

            formatPercent: function (oValue) {
                return this._convertToPercent(oValue);
            },

            formatNumber: function (oValue) {
                var iValue = this._convertToFloat(oValue);
                var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                    "groupingEnabled": true,  // grouping is enabled
                    "groupingSeparator": ' ', // grouping separator is '.'
                    "groupingSize": 3,        // the amount of digits to be grouped (here: thousand)
                    "decimalSeparator": ","   // the decimal separator must be different from the grouping separator
                });

                return oFormat.format(iValue);
            },

            formatNumbToNoDecimal: function (oValue) {
                var iValue = this._convertToFloat(oValue, 0);
                var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                    "groupingEnabled": true,  // grouping is enabled
                    "groupingSeparator": ' ', // grouping separator is '.'
                    "groupingSize": 3,        // the amount of digits to be grouped (here: thousand)
                    "decimalSeparator": ","   // the decimal separator must be different from the grouping separator
                });

                return oFormat.format(iValue);
            },

            onMissionLinkPress: function (oEvent, oContext) {
                oEvent.stopPropagation();  // Prevent the tree item's itemPress event
                var oData = oContext.getObject();
                // Your link handling logic here
                sap.m.MessageToast.show("Link clicked: " + oData.Mission);
            },

            onMissionLinkPress: function (oEvent) {
                // Get the binding context of the clicked link
                var oBindingContext = oEvent.getSource().getBindingContext("budget");
                var oData = oBindingContext.getObject();

                // Extract the document number (e.g., 40007)
                var sDocumentNumber = oData.Mission; // Assuming "Mission" contains the document number

                // Construct the URL for the Fiori app
                var sUrl = "#SalesDocument-display?SalesDocument=" + sDocumentNumber;

                // Navigate to the URL
                /*
                sap.ui.core.UIComponent.getRouterFor(this).navTo("SalesDocumentDisplay", {
                    SalesDocument: sDocumentNumber
                }, true);*/

                window.open(
                    "https://demo.augustareeves.fr/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-client=100&sap-language=EN#SalesDocument-display?SalesDocument=40000007",
                    "_blank" // Open in a new tab
                );
            },



            //BaseController

            /**
 * Convenience method for accessing the router in every controller of the application.
 * @public
 * @returns {sap.ui.core.routing.Router} the router for this component
 */
            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            /**
             * Convenience method for getting the view model by name in every controller of the application.
             * @public
             * @param {string} sName the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            setAppVersion: function () {
                var sHash = window.location.hash;
                var aParams = sHash.split("?");
                var sParam = "";
                if (aParams.length > 1) {
                    sParam = aParams[1];
                }
                if (sParam) {
                    let searchParams = new URLSearchParams(sParam);
                    let version = searchParams.get("version");
                    if (version) {
                        this.getModel("settings").setProperty("/version", version);
                    }

                }
            },

            /**
             * Convenience method for setting the view model in every controller of the application.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
             * Convenience method for getting the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {

                var oView = this.getView(); // Get the view
                var oComponent = sap.ui.core.Component.getOwnerComponentFor(oView);
                if (oComponent) {
                    return oComponent.getModel("i18n").getResourceBundle();
                }

            },


            cssRender: function (tableName) {
                var rows = this.byId(tableName).getRows();
                var that = this;
                rows.forEach(function (element, i) {
                    var row = element;
                    that.removeClass(row);
                    var oCtx;
                    var model;
                    if (tableName === "itemsTablesDisplay") {
                        oCtx = element.getBindingContext("itemsHierarch");
                        if (oCtx) {
                            model = oCtx.getProperty(oCtx.getPath());
                            if (model && (parseFloat(model.DownPaymentChainItemIdHl) === 0) || !parseFloat(model.DownPaymentChainItemIdHl)) {
                                that.addClassDark(row, model);
                            } else if (model && model.Items && parseFloat(model.DownPaymentChainItemIdHl) !== 0) {
                                that.addClassLight(row, model);
                            }
                        }
                    } else if (tableName === "TableItems") {
                        oCtx = element.getBindingContext("json");
                        if (oCtx) {
                            model = oCtx.getProperty(oCtx.getPath());
                            if (model && (parseFloat(model.DownPaymentChainItemIdHl) === 0) || !parseFloat(model.DownPaymentChainItemIdHl)) {
                                that.addClassDark(row, model);
                            } else if (model && model.Childs === "X" && parseFloat(model.DownPaymentChainItemIdHl) !== 0) {
                                that.addClassLight(row, model);
                            }
                        }
                    }
                });
            },

            removeClass: function (row) {
                row.$().removeClass("darkblue");
                row.$().removeClass("lightblue");
            },

            addClassDark: function (row, model) {
                this.addClassIfDifferent(row, "darkblue");
            },

            addClassLight: function (row, model) {
                this.addClassIfDifferent(row, "lightblue");
            },

            addClassIfDifferent: function (row, className) {
                if (!row.$().hasClass(className)) {
                    this.removeClass(row);
                    row.$().addClass(className);
                    return true;
                }
                return false;
            },

            addHistoryEntry: (function () {
                var aHistoryEntries = [];

                return function (oEntry, bReset) {
                    if (bReset) {
                        aHistoryEntries = [];
                    }

                    var bInHistory = aHistoryEntries.some(function (oHistoryEntry) {
                        return oHistoryEntry.intent === oEntry.intent;
                    });

                    if (!bInHistory) {
                        aHistoryEntries.push(oEntry);
                        this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
                            oService.setHierarchy(aHistoryEntries);
                        });
                    }
                };
            })(),

            fnGetTvaList: function (sCompany) { //Get filtered VAT list from company id
                var that = this;
                var aFilters = [];
                aFilters.push(new Filter("CompanyId", FilterOperator.EQ, sCompany));

                var oData = new JSONModel();
                oData.loadData("./model/mock/TVAList.json");

                that.getModel("TvaListModel").setData(oData.results);
                that.fnGetTvaListProrata(sCompany);

                /*this.getOwnerComponent().getModel().read("/TVAListSet", {
                    filters: aFilters,
                    success: function (oData) {
                        that.getModel("TvaListModel").setData(oData.results);
                        that.fnGetTvaListProrata(sCompany);
                    },
                    error: function (oError) {}
                });*/

            },

            fnToFixedAmounts: function (value, dp) { //Set value to fixed amount
                return +parseFloat(value).toFixed(dp);
            },



            /*createTreeItem: function(sId, oContext) {
                var oModel = this.getView().getModel("budget");
                var oData = oContext.getObject();
                
                // Create the content based on the level
                var oContent;
                if (oData.level === 0) {
                    // First level - use Link
                    oContent = new sap.m.Link({
                        text: "{budget>Mission}",
                        press: this.onMissionLinkPress.bind(this),
                        wrapping: true
                    });
                } else {
                    // Other levels - use Text
                    oContent = new sap.m.Text({
                        text: "{budget>Mission}",
                        wrapping: true
                    });
                }
                
                // Create the TreeItem with the appropriate content
                var oTreeItem = new sap.m.TreeItem(sId, {
                    type: "Active",
                    content: oContent
                });
                
                // Bind the item's context
                oTreeItem.bindObject({
                    path: oContext.getPath(),
                    model: "budget"
                });
                
                return oTreeItem;
            },*/

            createTreeItem: function (sId, oContext) {
                var oData = oContext.getObject();

                console.log("Creating item:", oData.Mission, "Level:", oData.level); // Debug

                // Create the content based on the level
                var oContent;
                if (oData.level === "0") {
                    // First level - use Link with explicit styling
                    oContent = new sap.m.Link({
                        text: "{budget>Mission}",
                        press: function (oEvent) {
                            this.onMissionLinkPress(oEvent, oContext);
                        }.bind(this),
                        wrapping: true,
                        emphasized: true  // Makes it look more like a traditional link
                    });

                    // Add custom CSS class for additional styling
                    oContent.addStyleClass("customTreeLink");
                } else {
                    // Other levels - use Text
                    oContent = new sap.m.Text({
                        text: "{budget>Mission}",
                        wrapping: true
                    });
                }

                // Create the CustomTreeItem
                var oTreeItem = new sap.m.CustomTreeItem(sId, {
                    type: "Active",
                    content: oContent
                });

                // Bind the item's context
                oTreeItem.bindObject({
                    path: oContext.getPath(),
                    model: "budget"
                });

                return oTreeItem;
            },


            onItemPress: function (oEvent) {
                var oItem = oEvent.getParameter("listItem");
                var oContext = oItem.getBindingContext("budget");
                var oNode = oContext.getObject();

                var oSplitApp = this.oView.byId("detailsTab--splitApp");

                if (oNode.Mission === "Grouping Hoai") {
                    this.oView.byId("detailsTab--detailPage").setVisible(true);

                    oSplitApp.toDetail(this.oView.byId("detailsTab--detailPage"));
                }
                else if (oNode.Mission === "Order 4000007") {
                    oSplitApp.toDetail(this.oView.byId("detailsTab--detailPage2"));
                }
                // No need for else case as SplitApp maintains navigation history
            },


            /*HOAI*/

            afterScroll: function () {
                jQuery.sap.delayedCall(100, null, function () {
                    that.cssRender("TableItems");
                });
            },

            updateFga: function () {

            },


            onCancel: function () { //Cancel creation or modification
                var oModeli18n = this.getView().getModel("i18n").getResourceBundle();
                var sConfirmBoxTitle = oModeli18n.getText("Title_ChangesLost");
                var sTextConfirmTermination = oModeli18n.getText("Text_MessageSave");
                var sCancelText = oModeli18n.getText("Button_Cancel");
                var sConfirmText = oModeli18n.getText("Button_Validate");
                var oConfirmDialog = new Dialog({
                    title: sConfirmBoxTitle,
                    type: 'Message',
                    content: new Text({
                        text: sTextConfirmTermination
                    }),
                    beginButton: new Button({
                        text: sCancelText,
                        icon: "sap-icon://decline",
                        press: function () {
                            oConfirmDialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: sConfirmText,
                        icon: "sap-icon://accept",
                        press: function () {

                            that.getRouter().navTo("RouteMain");

                            oConfirmDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oConfirmDialog.destroy();
                    }
                });
                oConfirmDialog.open();
            },
            onChangeLaw: function () {
                var oFormData = this.getModel("FormDataFix").getProperty("/HOAI_2021");
                var oArticle = this.getModel("defaultPhaseRate").getProperty("/results").find(function (e) {
                    return e.Article == oFormData.Law;
                });

                if (oArticle.Rates) {
                    oFormData.Realize = this._setDefaultRate(oArticle.Rates);
                }

            },

            onCalculate: function () {
                // this.computSeuilDansTableauReference(I, 27000, '35', TarifBase);
                // return ;

                var oView = this.oView;

                var oSettings = oView.getModel("settings");

                /*this.getModel("settings").setProperty("/showResult", true);
                this.getModel("settings").setProperty("/showForm", false);*/

                oView.getModel("settings").setProperty("/showResult", true);
                oView.getModel("settings").setProperty("/showForm", false);

                var sNetFee;
                var sMwSt;

                //Tab1
                var oSelData = oView.getModel("FormDataFix").getProperty("/HOAI_2021");
                var oFormData = oView.getModel("FormData").getProperty("/HOAI_2021");
                // Get Interpolation data
                var aTarifByCost = oView.getModel("tarifByCost").getProperty("/results");
                var oTabRef = this.getTarifReference(aTarifByCost, oSelData.Zone, oSelData.Cost, oSelData.Law);

                // this.setInterpolationData(oTabRef);
                oFormData.Interpolation = {
                    "TarifBase": oTabRef.tarifBase,
                    "TarifBaseMin": oTabRef.tarifBaseMin,
                    "TarifBaseMax": oTabRef.tarifBaseMax,
                    "TarifSup": oTabRef.tarifSup,
                    "TarifSupMin": oTabRef.tarifSupMin,
                    "TarifSupMax": oTabRef.tarifSupMax
                };

                var sNetPriceBase = this.computTarifBaseInterpolation(oTabRef.tarifBaseMin, oSelData.Cost, oTabRef.tarifBase, oTabRef.tarifSupMin, oTabRef.tarifSup);
                var sNetPriceSup = this.computTarifBaseInterpolation(oTabRef.tarifBaseMax, oSelData.Cost, oTabRef.tarifBase, oTabRef.tarifSupMax, oTabRef.tarifSup);

                // result

                oFormData.Result.Base = sNetPriceBase;
                var ref = sNetPriceSup - sNetPriceBase;
                oFormData.Result.OneQuarter = sNetPriceBase + ref * 1 / 4;
                oFormData.Result.TwoQuarter = sNetPriceBase + ref * 2 / 4;
                oFormData.Result.ThreeQuarter = sNetPriceBase + ref * 3 / 4;
                oFormData.Result.Sup = sNetPriceSup;

                switch (oSelData.TarifType) {
                    case "1":
                        sNetFee = sNetPriceBase;
                        break;
                    case "2":
                        sNetFee = sNetPriceBase + ref * 1 / 4;
                        break;
                    case "3":
                        sNetFee = sNetPriceBase + ref * 2 / 4;
                        break;
                    case "4":
                        sNetFee = sNetPriceBase + ref * 3 / 4;
                        break;
                    case "5":
                        sNetFee = sNetPriceSup;
                        break;
                }


                //Affichage des UserInput selon le tableau des frais
                oFormData.Cost = oSelData.Cost;


                //Tab Leistungsphasen Pourcentage phase de travail
                oFormData.Realize["Total%"] = 0;
                oFormData.Realize["Totalâ‚¬"] = 0;

                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p1");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p2");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p3");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p4");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p5");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p6");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p7");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p8");
                oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p9");

                oFormData.Realize["Totalâ‚¬"] = oFormData.Realize["Totalâ‚¬"].toFixed(2);

                // Cout
                var sNetCost = parseFloat(oFormData.Realize["Totalâ‚¬"]);
                oFormData.NetCost = oFormData.Realize["Totalâ‚¬"];

                oFormData.SalesOrder = oSelData.SalesOrder;
                oFormData.Customer = oSelData.Customer;
                oFormData.WBSElement = oSelData.WBSElement;
                oFormData.Zone = this._getZoneText(oSelData.Zone);
                oFormData.TarifType = this._getTarifTypeText(oSelData.TarifType);
                oFormData.Law = this._getLawText(oSelData.Law);

                //Calcul de la TVA
                sMwSt = oSelData.VATPercent;
                oFormData.VATValue = (sMwSt / 100) * sNetCost;
                oFormData.VATPercent = sMwSt;

                //Calcul des frais bruts
                oFormData.BrutCost = sNetCost + oFormData.VATValue;

                //this.getView().getModel("FormData").setProperty("/HOAI_2021", oFormData);
                this.oView.getModel("FormData").setProperty("/HOAI_2021", oFormData);

                this.onAddHOAIItems();
            },

            onCreateSO: function () {
                var oEntry = this._buildSOEntry();
                if (oEntry.Vbeln) {
                    this._updateSo(oEntry);
                } else {
                    this._createSo(oEntry);
                }
            },

            onDisplaySO: function () {
                var sVbeln = this.getModel("salesOrder").getProperty("/Vbeln");
                if (!sVbeln) {
                    return;
                }
                sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oService) {
                    oService.hrefForExternalAsync({
                        target: {
                            semanticObject: "SalesOrder",
                            action: "displayFactSheet"
                        },
                        params: {
                            "SalesOrder": sVbeln
                        }
                    }).then(function (sHref) {
                        // Place sHref somewhere in the DOM
                        window.open(sHref, "__blank");
                    });
                });
            },

            onCloseDialog: function () {
                this._closeDialog();
            },


            getTarifReference: function (aTarifByCost, zoneTarifaire, coutEligible, article) {
                //I, 27000, 35, tarifBase
                var oTarifBase = 0;
                var oTarifBaseMin = 0;
                var oTarifBaseMax = 0;
                var oTarifSup = 0;
                var oTarifSupMin = 0;
                var oTarifSupMax = 0;
                var cost = parseFloat(coutEligible);
                //recherche de tableau: rÃ©cupÃ©rer tarif liÃ© Ã  l'article

                var oTarif = aTarifByCost.find(function (line) {
                    return line.Article == article;
                });
                //recherche de tableau dans le json zoneTarifaire
                var aTarifByZone = oTarif.Tarifs.filter(function (line) {
                    return line.Zone == zoneTarifaire;
                });
                // 
                for (var i in aTarifByZone) {
                    var costLow = parseFloat(aTarifByZone[i].CostLow);
                    var costHigh = parseFloat(aTarifByZone[i].CostHigh);

                    if (cost <= costHigh && cost > costLow) {
                        oTarifBase = aTarifByZone[i].CostLow;
                        oTarifBaseMin = aTarifByZone[i].TarifLow1;
                        oTarifBaseMax = aTarifByZone[i].TarifHigh1;
                        oTarifSup = aTarifByZone[i].CostHigh;
                        oTarifSupMin = aTarifByZone[i].TarifLow2;
                        oTarifSupMax = aTarifByZone[i].TarifHigh2;

                        break;
                    }
                }
                return {
                    "tarifBase": parseFloat(oTarifBase),
                    "tarifBaseMin": parseFloat(oTarifBaseMin),
                    "tarifBaseMax": parseFloat(oTarifBaseMax),
                    "tarifSup": parseFloat(oTarifSup),
                    "tarifSupMin": parseFloat(oTarifSupMin),
                    "tarifSupMax": parseFloat(oTarifSupMax)
                };
            },

            _setDefaultRate: function (oRates) {
                var oRealize = {};
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p1");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p2");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p3");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p4");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p5");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p6");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p7");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p8");
                oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p9");

                return oRealize;
            },

            _setDefaultPhaseRate: function (oRealize, oRates, sPhase) {

                if (oRates[sPhase]) {
                    oRealize[sPhase + "Visible"] = true;
                    oRealize[sPhase + "Flag"] = true;
                    oRealize[sPhase + "%"] = oRates[sPhase];
                } else {
                    oRealize[sPhase + "Visible"] = false;
                    oRealize[sPhase + "Flag"] = false;
                    oRealize[sPhase + "%"] = 0;
                }

                return oRealize;
            },

            _getZoneText: function (sId) {
                //var oZoneModel = this.getModel("zone").getProperty("/results");
                var oZoneModel = this.oView.getModel("zone").getProperty("/results");

                var oZone = oZoneModel.find(function (e) {
                    return e.ID === sId;
                });

                return oZone.Text;
            },

            _getTarifTypeText: function (sId) {
                //var oModel = this.getModel("tarif").getProperty("/results");
                var oModel = this.oView.getModel("tarif").getProperty("/results");


                var oVal = oModel.find(function (e) {
                    return e.ID === sId;
                });

                return oVal.Text;
            },

            _getLawText: function (sId) {
                //var oModel = this.getModel("law").getProperty("/results");
                var oModel = this.oView.getModel("law").getProperty("/results");

                var oVal = oModel.find(function (e) {
                    return e.ID === sId;
                });

                return oVal.Text;
            },

            _buildSOEntry: function () {
                return {
                    "Vbeln": this.getModel("FormData").getProperty("/HOAI_2021/SalesOrder"),
                    "Netwr": this.getModel("FormData").getProperty("/HOAI_2021/Realize/Totalâ‚¬"),
                    "Waers": "EUR",
                    "Pspnr": this.getModel("FormData").getProperty("/HOAI_2021/WBSElement")
                };
            },

            _createSo: function (oEntry) {
                var _this = this;
                sap.ui.core.BusyIndicator.show(10);
                this.getModel().create("/SalesOrderSet", oEntry, {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        _this.getModel("salesOrder").setData(oData);
                        if (oData.Vbeln) {
                            _this._showSuccessDialog();
                        } else {
                            var sText = _this.getResourceBundle().getText("msg.so.create.ko");
                            sap.m.MessageBox.error(sText);

                        }
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();

                        var sText = _this.getModel("i18n").getResourceBundle().getText("msg.so.create.ko");
                        sap.m.MessageBox.error(sText);

                    }
                });
            },

            _updateSo: function (oEntry) {
                var _this = this;
                sap.ui.core.BusyIndicator.show(10);
                this.getModel().update("/SalesOrderSet('" + oEntry.Vbeln + "')", oEntry, {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        _this.getModel("salesOrder").setData(oEntry);
                        if (oEntry.Vbeln) {
                            _this._showSuccessDialog();
                        } else {
                            var sText = _this.getResourceBundle().getText("msg.so.create.ko");
                            sap.m.MessageBox.error(sText);

                        }
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();

                        var sText = _this.getModel("i18n").getResourceBundle().getText("msg.so.create.ko");
                        sap.m.MessageBox.error(sText);

                    }
                });
            },

            _showSuccessDialog: function () {
                if (!this.oSuccessDialog) {
                    this.loadFragment({ type: "XML", name: "com.arg.avv.hoai.view.fragment.dialog.SuccessDialog" }).then(function (oDialog) {
                        this.oSuccessDialog = oDialog;
                        oDialog.open();
                    }.bind(this));
                } else {
                    this.oSuccessDialog.open();
                }
            },

            _closeDialog: function () {
                if (this.oSuccessDialog) {
                    this.oSuccessDialog.close();
                }
            },

            /*getModel: function(sModel) {
                return this.getOwnerComponent().getModel(sModel);
            },
    
            getResourceBundle: function() {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },*/

            computSeuilDansTableauReference: function (zoneTarifaire, coutEligible, article, tauxHonoraire, tarifByCost) {
            },

            computTarifBaseInterpolation: function (b, coutEligible, a, bb, aa) {
                var TarifBaseInterpolation = b + [(coutEligible - a) * (bb - b)] / (aa - a);

                return TarifBaseInterpolation;

            },

            computTarifTauxSuperieurDesFrais: function (c, coutEligible, a, cc, aa) {

                var TarifTauxSuperieurDesFrais = c + [(coutEligible - a) * (cc - c)] / (aa - a);

                return TarifTauxSuperieurDesFrais;

            },

            computRealizePhase: function (oFormData, oSelData, iNetFee, sPhase) {
                var oFormDataRes = oFormData;

                var sRealizePhasePercent = oSelData[sPhase + "%"];
                oFormDataRes[sPhase + "%"] = sRealizePhasePercent;
                oFormDataRes[sPhase + "â‚¬"] = (iNetFee * (sRealizePhasePercent / 100)).toFixed(2);
                oFormDataRes[sPhase + "Flag"] = oSelData[sPhase + "Flag"];
                oFormDataRes[sPhase + "Visible"] = oSelData[sPhase + "Visible"];
                oFormDataRes["Total%"] += (oSelData[sPhase + "Flag"]) ? parseFloat(oFormDataRes[sPhase + "%"]) : 0;
                oFormDataRes["Totalâ‚¬"] += (oSelData[sPhase + "Flag"]) ? parseFloat(oFormDataRes[sPhase + "â‚¬"]) : 0;

                return oFormDataRes;
            },

            onAddHOAIItems: function () {

                var oTree = this.oView.byId("detailsTab--budgetTree");

                var oBinding = oTree.getBinding("rows");  // Changed from "items" to "rows"
                var aData = this.oView.getModel("budget").getProperty("/results");

                // Find the "Order 4000007" node
                var oCommandeNode = this._findNodeByText(aData, "Order 4000007");

                var oFormData = this.oView.getModel("FormData").getProperty("/HOAI_2021/Realize");

                if (oCommandeNode) {
                    // Find the existing "Grouping Hoai" node
                    var oHoaiGroup = this._findNodeByText(oCommandeNode.children, "Grouping Hoai");

                    if (oHoaiGroup) {
                        // If "Grouping Hoai" exists, add items to it
                        if (!oHoaiGroup.children) {
                            oHoaiGroup.children = [];
                        }

                        // Add new items only if they don't already exist
                        var aNewItems = [
                            { Mission: "1. Preliminary Investigation" },
                            { Mission: "2. Preliminary Planning" },
                            { Mission: "3. Design Planning" },
                            { Mission: "4. Approval Planning" },
                            { Mission: "5. Execution Planning" },
                            { Mission: "6. Preparation of Tender" },
                            { Mission: "7. Participation in Tender" },
                            { Mission: "8. Construction Supervision and Documentation" },
                            { Mission: "9. Project Management" }
                        ];

                        // Check for existing items to avoid duplicates
                        aNewItems.forEach(function (oNewItem) {
                            if (!oHoaiGroup.children.some(function (oExisting) {
                                return oExisting.Mission === oNewItem.Mission;
                            })) {
                                oHoaiGroup.children.push(oNewItem);
                            }
                        });
                    } else {
                        // If "Grouping Hoai" doesn't exist, create it with items
                        if (!oCommandeNode.children) {
                            oCommandeNode.children = [];
                        }
                        oCommandeNode.children = oCommandeNode.children.concat(this._createHOAIItems());
                    }

                    // Update the model
                    this.oView.getModel("budget").setProperty("/results", aData);

                    // Refresh the tree binding
                    //oBinding.refresh(true);  // Added force refresh
                }
            },

            _findNodeByText: function (aNodes, sText) {
                if (!aNodes) return null;
                for (var i = 0; i < aNodes.length; i++) {
                    if (aNodes[i].Mission === sText) {
                        return aNodes[i];
                    }
                    if (aNodes[i].children) {  // Changed from nodes to children
                        var oFound = this._findNodeByText(aNodes[i].children, sText);
                        if (oFound) return oFound;
                    }
                }
                return null;
            },

            _createHOAIItems: function () {
                return [
                    {
                        Mission: "Grouping Hoai",
                        children: [  // Changed from nodes to children
                            { Mission: "1. Preliminary Investigation" },
                            { Mission: "2. Preliminary Planning" },
                            { Mission: "3. Design Planning" },
                            { Mission: "4. Approval Planning" },
                            { Mission: "5. Execution Planning" },
                            { Mission: "6. Preparation of Tender" },
                            { Mission: "7. Participation in Tender" },
                            { Mission: "8. Construction Supervision and Documentation" },
                            { Mission: "9. Project Management" }
                        ]
                    }
                ];
            },



            onTabSelect: function (oEvent) {

                /*this.oView.byId("detailsTab--detailPage").setVisible(false);

                var iSelectedIndex = oEvent.getParameter("selectedKey"); // Returns tab index (0-based)

                if (iSelectedIndex.includes("detailsTabFilter")) { // Assuming DetailsTab is the 2nd tab (index 1)
                    this.onDetailsTabPress();
                }*/
            },

            onDetailsTabPress: function () {
                var oBindingContext = this.oView.getBindingContext();
                if (oBindingContext) {
                    var sBusinessNo = oBindingContext.getProperty("BusinessNo");

                    var sPath = sap.ui.require.toUrl("com/avv/ingerop/ingeropfga/model/mock/");

                    var oBudgetModel = new JSONModel();
                    if (sBusinessNo === "CC526901") { //Hoai
                        oBudgetModel.loadData(sPath + "budgetHoai.json", null, false);
                        this.onAddHOAIItems();
                    } else {
                        oBudgetModel.loadData(sPath + "budget.json", null, false);
                    }

                    this.oView.setModel(oBudgetModel, "budget");

                    var sId = "budgetTree";
                    var oNode = oBindingContext.getObject();

                    var oTreeItem = this.oView.byId("budgetTree");
                    if (oTreeItem === 'undefined ') {
                        oTreeItem = new sap.m.StandardTreeItem(sId, {
                            title: oNode.Mission,
                            type: "Active"
                        });
                    }

                    if (oNode.children && oNode.children.length > 0) {
                        oTreeItem.bindItems({
                            path: "children",
                            template: new sap.m.StandardTreeItem({
                                title: "{budget>Mission}"
                            })
                        });
                    }

                    console.log("BusinessNo (onDetailsTabPress):", sBusinessNo);
                }
            },


            formatPercentage: function (value, row_type) {
                if (value == null) return "";

                // Check if this should be a percentage value
                if (row_type === "RBAPCT" || row_type === "AVANCE") {
                    const formattedValue = parseFloat(value).toFixed(2);
                    return `${formattedValue}%`;
                }

                return value.toString();
            },

            onPressMonthLink: function (oEvent) {
                var oLink = oEvent.getSource();

                // Get all custom data items from the link
                var aCustomData = oLink.getCustomData();
                var oCustomValues = {};

                // Convert custom data array to key-value pairs
                aCustomData.forEach(function (oCustomData) {
                    oCustomValues[oCustomData.getKey()] = oCustomData.getValue();
                });

                var sMonthField = oCustomValues.monthField;
                var sYearField = oCustomValues.yearField;

                /*var oRowContext = oLink.getBindingContext("synthesis");
                var oRowData = oRowContext.getObject();
                var fMonthValue = oRowData[sMonthField];*/

                // Display to ckeck
                console.log("Clicked month field:", sMonthField);

                // Call for navigation
                this.monthLinkNavigation(oEvent, sMonthField, sYearField);


            },

            monthLinkNavigation: async function (oEvent, sMonthValue, sYearValue) {

                try {
                    const oLink = oEvent.getSource();
                    const oRowContext = oLink.getBindingContext("synthesis");
                    const oRowData = oRowContext.getObject();

                    // 2. Get GL Accounts
                    const oContext = oLink.getBindingContext("synthesis");
                    const oData = oContext.getObject();
                    const rawGLAccounts = oData.GLAccounts;
                    const glAccounts = rawGLAccounts
                        ? rawGLAccounts.split(";").map(a => a.trim()).filter(a => a.length > 0)
                        : [];

                    if (glAccounts.length === 0) {
                        sap.m.MessageToast.show("GLAccount non disponible.");
                        return;
                    }

                    // 3. Get Date range
                    const year = sYearValue;
                    const month = sMonthValue;

                    // Calculate first and last day of the month
                    const firstDay = `${year}${month}01`;
                    const lastDay = this.getLastDayOfMonth(year, month);
                    const formattedFirstDay = `${firstDay.substring(0, 4)}-${firstDay.substring(4, 6)}-${firstDay.substring(6, 8)}`;

                    console.log(`Navigating for month ${month}/${year} (${firstDay} to ${lastDay})`);

                    // 4. Get missions
                    const utilitiesModel = this.oView.getModel("utilities");
                    let missions = [];
                    try {
                        missions = await utilitiesModel.getBEMissions();

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
                    const oComponent = sap.ui.core.Component.getOwnerComponentFor(this.oView);
                    const oAppStateService = sap.ushell.Container.getService("AppState");
                    const oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();

                    const oAppState = await oAppStateService.createEmptyAppState(oComponent);
                    oAppState.setData(oSelectionVariant.toJSONString());
                    await oAppState.save();

                    const sAppStateKey = oAppState.getKey();
                    const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

                    /*const sUrl = oCrossAppNavigator.toExternal({
                        target: {
                            semanticObject: "GLAccount",
                            action: "displayGLLineItemReportingView"
                        },
                        params: {
                            PostingDate: `GE${firstDay}&LE${lastDay}`,
                            GLAccount: ["0041000001"],
                            WBSElementExternalID: ["PROJET CAS TEST1"],
                            P_DisplayCurrency: "EUR",
                            P_ExchangeRateType: "M",
                            P_ExchangeRateDate: "2019-01-01"
                        }
                    });
                    // Ouverture dans une nouvelle fenêtre
                    window.open(sUrl, "_blank");
                    */

                    // Construct the URL parameters
                    var params

                    if (sMonthValue === 'N1' || sMonthValue === 'N0') {
                        params = {
                            FiscalYear: `${sYearValue}`,
                            //FiscalPeriod: `${sYearValue}0${month}`,
                            GLAccount: glAccounts,
                            WBSElementExternalID: wbsElements //[oData.business_no],
                        };
                    } else {
                        params = {
                            FiscalYearPeriod: `${sYearValue}0${month}`,
                            //FiscalPeriod: `${sYearValue}0${month}`,
                            GLAccount: glAccounts,
                            WBSElementExternalID: wbsElements
                        };
                    }


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
                    window.open(sUrl, "_blank", "noopener,noreferrer");

                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },

            // Helper function to get last day of month
            getLastDayOfMonth: function (year, month) {
                // Note: month is 1-12 (not 0-11 like in JS Date)
                const lastDay = new Date(year, month, 0).getDate();
                return `${year}${month.padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`;
            },


        });
    });
