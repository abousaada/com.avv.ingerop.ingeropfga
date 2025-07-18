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
        "com/avv/ingerop/ingeropfga/util/formatter",
        "com/avv/ingerop/ingeropfga/ext/controller/helpers/Missions",
        "com/avv/ingerop/ingeropfga/ext/controller/helpers/BudgetPxAutre",
        "com/avv/ingerop/ingeropfga/ext/controller/helpers/Synthese"
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
        Formatter,
        Missions,
        BudgetPxAutre,
        Synthese
    ) {
        "use strict";

        return ControllerExtension.extend("com.avv.ingerop.ingeropfga.ext.controller.extendOP", {
            // Override or add custom methods here


            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {
                /**
                * Called when a controller is instantiated and its View controls (if available) are already created.
                * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time       initialization.
                * @memberOf sap.fe.cap.customer.ext.controller.PassengerOPExtend
                */

                onInit: async function () {

                    this._getExtensionAPI().attachPageDataLoaded(this._onObjectExtMatched.bind(this));

                    // Initializes the Create Missions tab
                    this._missionsTab = new Missions();
                    this._missionsTab.oView = this.getView();

                    // Initializes the Synthese tab
                    this._SyntheseTab = new Synthese();
                    this._SyntheseTab.oView = this.getView();
                    //this.onPressMonthLink = this.onPressMonthLink.bind(this);


                    // Initializes the Budget Px Autre Tab
                    this._budgetPxAutre = new BudgetPxAutre();
                    this._budgetPxAutre.oView = this.getView();


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
                            sap.m.MessageBox.error("Aucun contexte lié à la vue !");
                            throw new Error("Impossible d'accéder au contexte.");
                        }

                        if (!this.getModel("utilities").validDataBeforeSave()) {
                            sap.m.MessageBox.error("Veuillez Vérifier tous les champs");
                            return new Promise((resolve, reject) => {
                                reject();
                            });
                        }

                        return new Promise(async (resolve, reject) => {
                            const formattedMissions = utilitiesModel.getFormattedMissions();
                            const formattedPxAutre = utilitiesModel.getFormattedPxAutre();
                            const oPayload = Helper.extractPlainData({ ...oContext.getObject(),
                                 "to_Missions": formattedMissions,
                                 "to_BudgetPxAutre": formattedPxAutre,
                                });

                            try {
                                const updatedFGA = await utilitiesModel.deepUpsertFGA(oPayload);
                                if (updatedFGA) {
                                    Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView(), this.onNavBack.bind(this));
                                }

                            } catch (error) {
                                Helper.errorMessage("FGA create fail");
                                console.log(error);
                                reject();
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


            _getExtensionAPI: function () {
                return this.getInterface().getView().getController().extensionAPI;
            },

            _setTabsVisible() {
                const isCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                Helper.getTabVisibilityByMode(isCreateMode).map(({ key, visible }) => {
                    this.getView().byId(key)?.setVisible(visible)
                });
            },

            _setFieldVisible() {
                const isCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                Helper.getFieldVisibilityByMode(isCreateMode).map(
                    ({ idntifier, field, visible }) => {
                        this._getField(idntifier, field)?.setVisible(visible);
                    }
                );
            },

            _setFieldEnabled() {
                const isCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                Helper.getFieldEnabledByMode(isCreateMode).map(
                    ({ identifier, field, enabled }) => {
                        this._getField(identifier, field)?.setEditable(enabled);
                    }
                );
            },

            _setDefaultMandatory() {
                this._getField("Identification", "Type").setMandatory(true);
            },

            _getField(identifiant, champ) {
                return this.getView().byId(Helper.headerFieldIdBySectionAndFieldName(identifiant, champ));
            },

            _attachChangeEventOnFields() {
                Helper.getFieldActionList().map(({ identifier, field, action }) => {
                    this.getView().byId(Helper.headerFieldIdBySectionAndFieldName(identifier, field)).attachChange(this[action].bind(this));
                });
            },

            _setInputState() {
                Helper.getHeaderFieldList().map(({ identifier, field }) => {
                    const champ = this._getField(identifier, field);
                    champ?.bindProperty("valueState", {
                        path: field,
                        formatter: Formatter.validMandatoryField(champ)
                    });
                });
            },

            onNavBack() {
                var oHistory = sap.ui.core.routing.History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    // Si une page précédente existe dans l'historique
                    window.history.go(-1);
                } else {
                    // Sinon, on navigue manuellement vers la page d’accueil ou ListReport
                    window.location.hash = "";
                    // const oNavController = this._getExtensionAPI().getNavigationController();
                    // oNavController.navigateInternal( "ZC_FGASet", {replaceInHistory: true} );
                }
            },

            onActivityChange(oEvent) {
                this._getField("Identification", "Soufam").setValue(null);
            },

            onDateChange(oEvent) {
                const { StartDate, EndDate } = this.getView().getBindingContext().getObject();
                let diffFromNow = null, diff = null;

                if (EndDate) { diffFromNow = Helper.diffEnMois(new Date(), EndDate); }
                this._getField("Duree", "RemainingMonth").setValue(diffFromNow);

                if (StartDate && EndDate) { diff = Helper.diffEnMois(StartDate, EndDate); }
                this._getField("Duree", "NbOfMonth").setValue(diff);
            },

            onCalcTauxTravaux(oEvent) {
                //need refactoring
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
                if(!type){
                    Helper.getDefaultFieldMandatory().map(({identifier, field, mandatory}) => {
                        this._getField(identifier, field)?.setMandatory(mandatory);
                    });
                    return ;
                }
                Helper.getFieldMandatoryByType(type).map(({identifier, field, mandatory}) => {
                    this._getField(identifier, field)?.setMandatory(mandatory);
                });
            },

            async _getTabsData() {
                const utilitiesModel = this.getInterface().getModel("utilities");
                const [missions, previsions, recaps, opport, pxAutres] = await Promise.all([
                    utilitiesModel.getBEMissions(),
                    utilitiesModel.getBEPrevisions(),
                    utilitiesModel.getBERecaps(),
                    utilitiesModel.getBEOpport(),

                    //Bugets PX
                    utilitiesModel.getBEPxAutres()
                ]);

                utilitiesModel.setMissions(missions || []);
                utilitiesModel.setRecaps(recaps || []);
                utilitiesModel.setPrevisions(previsions || []);
                utilitiesModel.setOpport(opport || []);

                //Bugets PX
                utilitiesModel.setPxAutres(pxAutres || []);

            },

            _onObjectExtMatched: async function (e) {
                const utilitiesModel = this.getInterface().getModel("utilities");
                const bCreateMode = this.getView().getModel("ui").getProperty("/createMode");

                this._setTabsVisible();
                this._setFieldVisible();
                this._attachChangeEventOnFields();
                this._setFieldEnabled();

                const type = e.context.getProperty("Type");
                this._setMandatoryFieldByType(type)


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
                    this.preparePxAutreTreeData();
                }
                else {

                    try {
                        const oFragment = await sap.ui.core.Fragment.load({
                            name: "com.avv.ingerop.ingeropfga.ext.view.tab.DetailsTab", //change to Hoai tab
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

            // ==============================================
            // Handle Synthese TAB 
            // Handles preparation and drilldowns 
            // ==============================================

            onPressMonthLink: function (oEvent) {

                if (!this._SyntheseTab) {
                    this._SyntheseTab = new Synthese();

                }
                this._SyntheseTab.onPressMonthLink(oEvent);
            },

            monthLinkNavigation: async function (oEvent, sMonthValue, sYearValue) {
                this._SyntheseTab.monthLinkNavigation(oEvent, sMonthValue, sYearValue);
            },

            // Helper function to get last day of month
            getLastDayOfMonth: function (year, month) {
                this._SyntheseTab.getLastDayOfMonth(year, month);
            },

            // ==============================================
            // Handle Details TAB - Missions Tree Section
            // Handles preparation and submissions of Missions 
            // Tree
            // ==============================================

            prepareMissionsTreeData: function () {
                this._missionsTab.prepareMissionsTreeData();
            },

            isGroupementAddVisible: function (editable, isNode, isL0) {
                return this._missionsTab.isGroupementAddVisible(editable, isNode, isL0);
            },
            isFGAAddVisible: function (editable, isNode, isL0) {
                return this._missionsTab.isFGAAddVisible(editable, isNode, isL0);
            },
            isDeleteVisible: function (editable, isNode) {
                return this._missionsTab.isDeleteVisible(editable, isNode);
            },

            onAddGroupement: function (oEvent) {
                this._missionsTab.onAddGroupement(oEvent);
            },

            onAddMissionToGroupement: function (oEvent) {
                this._missionsTab.onAddMissionToGroupement(oEvent);
            },

            onDeleteMission: function (oEvent) {
                this._missionsTab.onDeleteMission(oEvent);
            },

            _deleteFromHierarchy: function (aNodes, oMissionToDelete) {
                this._missionsTab._deleteFromHierarchy(aNodes, oMissionToDelete);
            },


            // ==============================================
            // Handle Budget Px TAB - Budget Px Autres Section
            // Handles preparation and submition budget items 
            // in the mission  process
            // ==============================================

            // Delegates submit logic to specialized handler : Budget Px Autres
            preparePxAutreTreeData: function () {
                this._budgetPxAutre.preparePxAutreTreeData();
            },

            onPxAutreSubmit: function (oEvent) {
                if (!this._budgetPxAutre) {
                    this._budgetPxAutre = new BudgetPxAutre();
                    this._budgetPxAutre.oView = this.oView;
                }
                this._budgetPxAutre.onSubmit(oEvent);
            },


            // ==============================================
            // Move to formatter !!!!
            // ==============================================

            formatMonthLabel: function (sMonth, sYear) {
                return sMonth + "/" + sYear;
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

            // ==============================================
            // Move to BaseControler !!!!
            // ==============================================


            getModel: function (sName) {
                return this.getView().getModel(sName);
            },
            
        });
    });
