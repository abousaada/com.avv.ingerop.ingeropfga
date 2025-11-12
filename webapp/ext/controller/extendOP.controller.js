sap.ui.define(
    [
        "sap/ui/core/mvc/ControllerExtension",
        "./BaseController",
        "../../model/models",
        "../../util/helper",
        "../../util/formatter",
        "./helpers/Missions",
        "./helpers/ExtendOPUiManage",
        "./helpers/BudgetPxAutre",
        "./helpers/BudgetPxSubContracting",
        "./helpers/BudgetPxRecetteExt",
        "./helpers/BudgetPxMainOeuvre",
        "./helpers/BudgetPxSTI",
        "./helpers/BudgetPrevisionel",
        "./helpers/Synthese",
    ],
    function (
        ControllerExtension,
        BaseController,
        models,
        Helper,
        Formatter,
        Missions,
        ExtendOPUiManage,
        BudgetPxAutre,
        BudgetPxSubContracting,
        BudgetPxRecetteExt,
        BudgetPxMainOeuvre,
        BudgetPxSTI,
        BudgetPrevisionel,
        Synthese
    ) {
        "use strict";
        var PROJET_TYPE = null;
        return ControllerExtension.extend("com.avv.ingerop.ingeropfga.ext.controller.extendOP", {
            Formatter: Formatter,
            // Override or add custom methods here

            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {

                onAfterRendering: function () {
                    const oTreeTable = this.getView().byId("PrevisionnelTreeTable");
                    if (oTreeTable) {
                        oTreeTable.setFixedColumnCount(99);
                    }
                },

                /**
                * Called when a controller is instantiated and its View controls (if available) are already created.
                * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time       initialization.
                * @memberOf sap.fe.cap.customer.ext.controller.PassengerOPExtend
                */

                onInit: async function () {

                    this._getOwnerComponent().getModel("utilities").setView(this.getView());

                    this._getExtensionAPI().attachPageDataLoaded(this._onObjectExtMatched.bind(this));

                    this._getExtensionAPI().getTransactionController().attachAfterCancel(this._resetViewSetUp.bind(this));

                    const oRouter = this._getOwnerComponent().getRouter();
                    oRouter.attachRoutePatternMatched(this._onRoutePatternMatched.bind(this));


                    // ABO to rework
                    const isForecastMode = sessionStorage.getItem("isForecastMode") === "true";
                    const selectedBusinessNos = sessionStorage.getItem("selectedBusinessNos");

                    if (isForecastMode) {
                        console.log("Object Page opened in forecast mode - recreating navigation context");

                        const oView = this.getView();
                        const oModel = this._getOwnerComponent().getModel();
                        const oUtilitiesModel = this._getOwnerComponent().getModel("utilities");
                        const oNavController = this._getExtensionAPI().getNavigationController();

                        // Get period from control or use default (same logic as onPrevPress)
                        const oPeriodControl = oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ListReport.view.ListReport::ZC_FGASet--listReportFilter-filterItemControlA_-_Parameter.p_period");

                        let period;
                        if (oPeriodControl) {
                            period = oPeriodControl.getValue();
                            oUtilitiesModel.setProperty("/period", period);
                        }

                        // Create the same entry context as in onPrevPress
                        const oContext = oModel.createEntry("/ZC_FGASet", {
                            properties: {
                                BusinessNo: "DUMMY",
                                p_period: period || (() => {
                                    const now = new Date();
                                    const month = String(now.getMonth() + 1).padStart(2, "0");
                                    const year = String(now.getFullYear());
                                    return `${month}${year}`;
                                })()
                            }
                        });

                        oUtilitiesModel.setProperty("/isForecastMode", true);

                        // Clean previous tree data
                        oUtilitiesModel.setProperty("/previsionelHierarchyWithTotals", []);
                        const oTable = this.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--PrevisionnelTreeTable");
                        if (oTable && oTable.getBinding("rows")) {
                            oTable.getBinding("rows").refresh(true);
                        }

                        let oNavigationContext;

                        if (selectedBusinessNos) {
                            try {
                                const aSelectedBusinessNos = JSON.parse(selectedBusinessNos);
                                console.log("Navigating to selected BusinessNos:", aSelectedBusinessNos);

                                if (aSelectedBusinessNos.length === 1) {
                                    // For single selection, try to get the existing context
                                    // or create a navigation context with the first BusinessNo
                                    oNavigationContext = oModel.createEntry("/ZC_FGASet", {
                                        properties: {
                                            BusinessNo: aSelectedBusinessNos[0],
                                            p_period: period || (() => {
                                                const now = new Date();
                                                const month = String(now.getMonth() + 1).padStart(2, "0");
                                                const year = String(now.getFullYear());
                                                return `${month}${year}`;
                                            })()
                                        }
                                    });
                                } else {
                                    // For multiple selection, use the dummy context
                                    oNavigationContext = oContext;
                                }
                            } catch (error) {
                                console.error("Error parsing selectedBusinessNos:", error);
                                oNavigationContext = oContext;
                            }
                        } else {
                            console.log("No items selected — navigating to forecast (all data)");
                            oNavigationContext = oContext;
                        }

                        // Perform the navigation
                        try {
                            await oNavController.navigateInternal(oNavigationContext, {
                                navigationMode: "inplace"
                            });
                            console.log("Forecast navigation completed successfully");
                        } catch (error) {
                            console.error("Error navigating in forecast mode:", error);
                        }

                        // sessionStorage.removeItem("isForecastMode");
                        // sessionStorage.removeItem("selectedBusinessNos");
                    }
                    // ABO end to rework


                    // Initializes the Create Missions tab
                    this._missionsTab = new Missions();
                    this._missionsTab.oView = this.getView();

                    // Initializes the Synthese tab
                    this._SyntheseTab = new Synthese();
                    this._SyntheseTab.oView = this.getView();
                    //this.onPressMonthLink = this.onPressMonthLink.bind(this);

                    // Initializes the Budget Px Tab
                    this._budgetPxAutre = new BudgetPxAutre();
                    this._budgetPxAutre.oView = this.getView();

                    this._budgetPxSubContracting = new BudgetPxSubContracting();
                    this._budgetPxSubContracting.oView = this.getView();

                    this._budgetPxRecetteExt = new BudgetPxRecetteExt();
                    this._budgetPxRecetteExt.oView = this.getView();

                    this._budgetMainOeuvre = new BudgetPxMainOeuvre();
                    this._budgetMainOeuvre.oView = this.getView();


                    this._extendOPUiManage = new ExtendOPUiManage();
                    this._extendOPUiManage.oView = this.getView();

                    this._budgetPxSTI = new BudgetPxSTI();
                    this._budgetPxSTI.oView = this.getView();

                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.getView();
                    this._budgetPrevisionel.oController = this;

                    window.addEventListener("popstate", this._cleanModification.bind(this));
                    window.addEventListener("onbeforeunload", this._cleanModification.bind(this));

                    /*window.addEventListener("beforeunload", () => {
                        this._cleanModification();
                        this._cleanPrevisionel(); 
                    });*/


                    this._resetRecapMerge = this._resetRecapMerge.bind(this);
                    this._styleMergedRecapRow = this._styleMergedRecapRow.bind(this);

                    const oTable = this.getView().byId("idRecapTable");
                    if (oTable) {
                        oTable.addEventDelegate({
                            onAfterRendering: () => {
                                this._resetRecapMerge();
                                this._styleMergedRecapRow();
                            }
                        }, this);

                    }
                },

                // onCancel:function(oEvent){
                //     console.log("onCancel called", oEvent);
                // },

                // Called before the table is rebound (can be used to adjust binding parameters)
                onBeforeRebindTableExtension: function (oEvent) {
                    console.log("onBeforeRebindTableExtension called", oEvent);
                },

                // Called when the list navigation is triggered
                onListNavigationExtension: function (oEvent) {
                    console.log("onListNavigationExtension called", oEvent);
                },

                beforeSaveExtension() { //ABO work in progress. Don't remove
                    const self = this;
                    try {
                        const utilitiesModel = this.getModel("utilities");
                        const oView = this.base.getView();
                        const oContext = oView.getBindingContext();

                        if (!oContext) {
                            sap.m.MessageBox.error("Aucun contexte lié à la vue !");
                            throw new Error("Impossible d'accéder au contexte.");
                        }

                        const isForecastMode = utilitiesModel.getProperty("/isForecastMode");

                        if (!isForecastMode) {
                            if (!this.getModel("utilities").validDataBeforeSave(oView)) {
                                sap.m.MessageBox.error("Veuillez Vérifier tous les champs");
                                return new Promise((resolve, reject) => {
                                    reject();
                                });
                            }

                            if (!this.getModel("utilities").validRecetteExtBeforeSave(oView)) {
                                sap.m.MessageBox.error("Veuillez Répartir correctement les budgets");
                                return new Promise((resolve, reject) => {
                                    reject();
                                });
                            }
                        }

                        this._setBusy(true);

                        // Check for manual changes in Previsionel
                        //const oModel = this.getModel();
                        //const hasManualChanges = this._budgetPrevisionel._hasManualChangesPrevisionel(utilitiesModel, oModel);
                        const dataMode = utilitiesModel.getProperty("/DataMode");

                        if (isForecastMode && dataMode === 'M') {
                            return new Promise((resolve, reject) => {
                                sap.m.MessageBox.confirm(
                                    "Passage en mode manuel requis\n\n✓ Écrasement des valeurs automatiques\n✓ Action irréversible\n\nConfirmez-vous cette modification ?",
                                    {
                                        title: "Confirmation requise",
                                        onClose: (sAction) => {
                                            if (sAction === sap.m.MessageBox.Action.OK) {
                                                // User confirmed - proceed with save
                                                self._executeSave(utilitiesModel, oView, oContext, resolve, reject);
                                            } else {
                                                // User cancelled
                                                this._setBusy(false);
                                                reject("Save cancelled by user");
                                            }
                                        }
                                    }
                                );
                            });
                        } else {
                            // No manual changes - proceed directly with save
                            //return self._executeSave(utilitiesModel, oView, oContext, resolve, reject);
                            return new Promise((resolve, reject) => {
                                self._executeSave(utilitiesModel, oView, oContext, resolve, reject);
                            });
                        }
                    } catch (error) {
                        this._setBusy(false);
                        Helper.errorMessage("FGA updated fail");
                        console.log(error);
                        return Promise.reject(error);
                    }
                },


                /*beforeSaveExtension1() {
                    try {
                        const utilitiesModel = this.getModel("utilities");

                        // Accès au contexte via la vue
                        const oView = this.base.getView();
                        const oContext = oView.getBindingContext();

                        if (!oContext) {
                            sap.m.MessageBox.error("Aucun contexte lié à la vue !");
                            throw new Error("Impossible d'accéder au contexte.");
                        }

                        if (!this.getModel("utilities").validDataBeforeSave(oView)) {
                            sap.m.MessageBox.error("Veuillez Vérifier tous les champs");
                            return new Promise((resolve, reject) => {
                                reject();
                            });
                        }

                        if (!this.getModel("utilities").validRecetteExtBeforeSave(oView)) {
                            sap.m.MessageBox.error("Veuillez Répartir correctement les budgets");
                            return new Promise((resolve, reject) => {
                                reject();
                            });
                        }

                        this._setBusy(true);
                        return new Promise(async (resolve, reject) => {
                            const formattedMissions = utilitiesModel.getFormattedMissions();
                            const formattedPxAutre = utilitiesModel.getFormattedPxAutre();
                            const formattedPxSubContractingExt = utilitiesModel.formattedPxSubContractingExt();
                            const formattedPxRecetteExt = utilitiesModel.formattedPxRecetteExt();
                            const formattedMainOeuvre = utilitiesModel.formattedPxMainOeuvre();
                            const oPayload = Helper.extractPlainData({
                                ...oContext.getObject(),
                                "to_Missions": formattedMissions,
                                "to_BudgetPxAutre": formattedPxAutre,
                                "to_BudgetPxSubContracting": formattedPxSubContractingExt,
                                "to_BudgetPxRecetteExt": formattedPxRecetteExt,
                                "to_BudgetPxSTI": [],
                                "to_Previsionel": [],
                                "to_BudgetPxMainOeuvre": formattedMainOeuvre
                            });

                            delete oPayload.to_BudgetPxSTI;
                            delete oPayload.to_Previsionel;


                            try {
                                oPayload.VAT = oPayload.VAT ? oPayload.VAT.toString() : oPayload.VAT;
                                const updatedFGA = await utilitiesModel.deepUpsertFGA(oPayload);
                                this._setBusy(false);
                                if (updatedFGA) {
                                    Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView(), this.onAfterSaveAction.bind(this));
                                }

                            } catch (error) {
                                this._setBusy(false);
                                Helper.errorMessage("FGA updated fail");
                                console.log(error);
                                //reject();
                                return Promise.reject("No data returned");
                            }

                            //reject();
                            return Promise.reject();
                        });
                    } catch (error) {
                        this._setBusy(false);
                        Helper.errorMessage("FGA updated fail");
                        console.log(error);
                        return Promise.reject(error);
                    }
                },*/

            },

            // The Actual saving logic
            _executeSave: function (utilitiesModel, oView, oContext, resolve, reject) {
                return new Promise(async (innerResolve, innerReject) => {
                    // Use the provided resolve/reject or create new ones for the inner promise
                    const finalResolve = resolve || innerResolve;
                    const finalReject = reject || innerReject;

                    try {
                        let oPayload;
                        const isForecastMode = utilitiesModel.getProperty("/isForecastMode");
                        const dataMode = utilitiesModel.getProperty("/DataMode");

                        if (!isForecastMode) {

                            const formattedMissions = utilitiesModel.getFormattedMissions();
                            const formattedPxAutre = utilitiesModel.getFormattedPxAutre();
                            const formattedPxSubContractingExt = utilitiesModel.formattedPxSubContractingExt();
                            const formattedPxRecetteExt = utilitiesModel.formattedPxRecetteExt();
                            const formattedMainOeuvre = utilitiesModel.formattedPxMainOeuvre();
                            oPayload = Helper.extractPlainData({
                                ...oContext.getObject(),
                                "to_Missions": formattedMissions,
                                "to_BudgetPxAutre": formattedPxAutre,
                                "to_BudgetPxSubContracting": formattedPxSubContractingExt,
                                "to_BudgetPxRecetteExt": formattedPxRecetteExt,
                                "to_BudgetPxSTI": [],
                                "to_Previsionel": [],
                                "to_BudgetPxMainOeuvre": formattedMainOeuvre
                            });

                            delete oPayload.to_BudgetPxSTI;
                            delete oPayload.to_Previsionel;
                            oPayload.VAT = oPayload.VAT ? oPayload.VAT.toString() : oPayload.VAT;

                        }
                        else if (isForecastMode && dataMode === 'M') {
                            oPayload = Helper.extractPlainData({
                                ...oContext.getObject(),
                                "to_Missions": {
                                    results: []
                                },
                                "to_BudgetPxAutre": {
                                    results: []
                                },
                                "to_BudgetPxSubContracting": {
                                    results: []
                                },
                                "to_BudgetPxRecetteExt": {
                                    results: []
                                },
                                "to_BudgetPxSTI": {
                                    results: []
                                },
                                "to_Previsionel": {
                                    results: []
                                },
                                "to_BudgetPxMainOeuvre": {
                                    results: []
                                }
                            });

                            const previsionel = utilitiesModel.getProperty("/previsionel") || [];
                            let filtredPrevisionel = previsionel.filter(item => item.DataMode === "M");

                            // Fix numeric field types and remove "is" properties from filteredPrevisionel
                            filtredPrevisionel.forEach(item => {
                                this._fixNumericFieldTypes(item);
                                this._cleanupPrevisionelItem(item);
                            });

                            oPayload.to_Previsionel = filtredPrevisionel;

                            // Handle DUMMY BusinessNo - use first BusinessNo from filtredPrevisionel if available
                            if (oPayload.BusinessNo === "DUMMY" && filtredPrevisionel.length > 0) {
                                const firstBusinessNo = filtredPrevisionel[0].BusinessNo;
                                if (firstBusinessNo) {
                                    oPayload.BusinessNo = firstBusinessNo;
                                }
                            }

                        } else {
                            finalReject("Aucune modification n’a été effectuée sur cette vue");
                            return;
                        }

                        const updatedFGA = await utilitiesModel.deepUpsertFGA(oPayload);
                        this._setBusy(false);

                        if (isForecastMode && dataMode === 'M') {
                            const message = isForecastMode && dataMode === 'M'
                                ? "Prévisionnel FGA mis à jour"
                                : "FGA updated: " + updatedFGA.BusinessNo;

                            setTimeout(() => {
                                sap.m.MessageBox.success(message, {
                                    actions: [sap.m.MessageBox.Action.CLOSE],
                                    dependentOn: this.getView()
                                });
                            }, 100);

                            return updatedFGA;

                        } else if (updatedFGA) {
                            Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView(), this.onAfterSaveAction.bind(this));
                            finalResolve(updatedFGA);
                        } else {
                            this._setBusy(false);
                            Helper.errorMessage("FGA updated fail");
                            finalReject("No data returned");
                        }

                    } catch (error) {
                        this._setBusy(false);
                        Helper.errorMessage("FGA updated fail");
                        console.log(error);
                        finalReject(error);
                    }

                    return Promise.reject();
                });
            },

            _fixNumericFieldTypes: function (previsionelItem) {
                if (!previsionelItem) return;

                const numericFields = [
                    'JanvN', 'FevrN', 'MarsN', 'AvrN', 'MaiN', 'JuinN', 'JuilN', 'AoutN',
                    'SeptN', 'OctN', 'NovN', 'DecN', 'JanvN1', 'FevrN1', 'MarsN1', 'AvrN1',
                    'MaiN1', 'JuinN1', 'JuilN1', 'AoutN1', 'SeptN1', 'OctN1', 'NovN1', 'DecN1',
                    'TotalN', 'TotalN1', 'Audela', 'ResteAFacturer', 'ResteADepenser'
                ];

                numericFields.forEach(field => {
                    if (previsionelItem.hasOwnProperty(field)) {
                        const value = previsionelItem[field];

                        if (value === null || value === undefined || value === '') {
                            previsionelItem[field] = "0.00";
                        } else if (typeof value === 'number') {
                            // Convert number to string with 2 decimal places
                            previsionelItem[field] = value.toFixed(2);
                        } else if (typeof value === 'string') {
                            // Ensure string has proper decimal format
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                previsionelItem[field] = numValue.toFixed(2);
                            } else {
                                previsionelItem[field] = "0.00";
                            }
                        }
                    }
                });
            },

            // Clean up previsionel item by removing unwanted properties
            _cleanupPrevisionelItem: function (previsionelItem) {
                if (!previsionelItem) return;

                // Remove all properties that start with "is"
                const isProperties = Object.keys(previsionelItem).filter(key => key.startsWith('is'));
                isProperties.forEach(prop => {
                    delete previsionelItem[prop];
                });

                // Remove FinAffaire property
                if (previsionelItem.hasOwnProperty('FinAffaire')) {
                    delete previsionelItem.FinAffaire;
                    delete previsionelItem.name;
                }
            },

            _onRoutePatternMatched: function (oEvent) {
                const sRouteName = oEvent.getParameter("name");
                if (sRouteName === "rootquery") {
                    this._cleanPrevisionel();
                }
            },

            _cleanPrevisionel: function () {
                // This is triggered when user navigates back to the List Report
                const oUtilitiesModel = this.getView().getModel("utilities");
                if (oUtilitiesModel) {
                    oUtilitiesModel.setProperty("/isForecastMode", false);
                }
                sessionStorage.removeItem("isForecastMode");
                sessionStorage.removeItem("selectedBusinessNos");
            },

            _cleanModification() {
                const oModel = this.getInterface().getView().getModel();
                const mPendingChanges = oModel.getPendingChanges();
                // Parcours des entités modifiées
                Object.keys(mPendingChanges).forEach(function (sPath) {
                    oModel.resetChanges([`/${sPath}`]);
                });
                // oModel.refresh(true);
            },

            _resetViewSetUp() {
                const context = this.base.getView().getBindingContext();
                this._extendOPUiManage._setOPView(context);
                const Percent = context.getProperty("Percent");
                if (Percent === "P1" || Percent === "PI" || !Percent) {
                    const oModel = this.base.getView().getModel();
                    oModel.setProperty(context.getPath() + "/Percent", "%");
                }
            },

            routing: {

            },

            _getExtensionAPI: function () {
                return this._getController().extensionAPI;
            },

            _getController() {
                return this.getInterface().getView().getController();
            },

            _getOwnerComponent() {
                return this._getController().getOwnerComponent();
            },

            onNavBack() {
                const oHistory = sap.ui.core.routing.History.getInstance();
                const sPreviousHash = oHistory.getPreviousHash();

                this._cleanModification();

                if (sPreviousHash !== undefined) { window.history.go(-1); }
                else { window.location.hash = ""; }
            },

            onAfterSaveAction() {
                this._cleanModification();
                const oUIModel = this.base.templateBaseExtension.getView().getModel("ui");
                if (oUIModel) {
                    // Forcer le retour en display mode
                    oUIModel.setProperty("/editable", false);
                }

                // Optionnel : si tu veux rafraîchir l'entité depuis le backend
                setTimeout(function () {
                    this.base.templateBaseExtension.getExtensionAPI().refresh();
                }.bind(this), 100); //
                // this.base.templateBaseExtension.getExtensionAPI().refresh();
            },

            async _getTabsData(type, aSelectedBusinessNos = []) {
                try {
                    const data = await this.getInterface().getModel("utilities").getBEDatas(type, aSelectedBusinessNos);
                    return data;
                } catch (error) {
                    console.log(error);
                }
            },

            _setBusy(busy) {
                this.getInterface().getView().setBusy(busy);
            },

            _onObjectExtMatched: async function (e) {

                //this._setBusy(true);

                try {

                    const oUtilitiesModel = this.getInterface().getModel("utilities");
                    const oContext = e.context;

                    // Read the flag from the model + manage refresh
                    let aSelectedBusinessNos = [];
                    let isForecastMode = this.getInterface().getModel("utilities").getProperty("/isForecastMode");
                    if (isForecastMode === undefined || isForecastMode === null) {

                        let type = null;
                        const storedValue = sessionStorage.getItem("isForecastMode");
                        if (storedValue !== null) {
                            isForecastMode = JSON.parse(storedValue);
                            oUtilitiesModel.setProperty("/isForecastMode", isForecastMode);
                        } else {
                            isForecastMode = false;
                        }

                    } else if (isForecastMode === true) {


                        const storedSelection = sessionStorage.getItem("selectedBusinessNos");
                        if (storedSelection) {
                            aSelectedBusinessNos = JSON.parse(storedSelection);
                            console.log("Loaded selected BusinessNos:", storedSelection);
                        }
                    }

                    const utilitiesModel = this.getInterface().getModel("utilities");
                    const bCreateMode = this.getView().getModel("ui").getProperty("/createMode");

                    this._extendOPUiManage._setOPView(e.context);

                    const Percent = e.context.getProperty("Percent");
                    if (Percent === "P1" || Percent === "PI" || !Percent) {
                        const oModel = this.getInterface().getModel();
                        oModel.setProperty(e.context.getPath() + "/Percent", "%");
                    }

                    PROJET_TYPE = e.context ? e.context.getProperty("Type") : null;

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

                            if (isForecastMode) {
                                console.log("Mode PREVISION détecté !");
                                var type = 'previsionel';
                            }

                            const tabData = await this._getTabsData(type, aSelectedBusinessNos);

                            await this._loadFragment("Missions");

                            //this._setBusy(false);

                            /*
                            //2. Display Different Fragments Based on Company Code Country
                            const sCountry = e.context.getProperty("CompanyCountry");
    
                            if (sCountry === "FR") {
                                this._loadFragment("Missions");
                            } else {
                                this._loadFragment("hoai");
                            }*/

                        } catch (error) {
                            console.logs(error);
                        }
                    }

                } catch (error) {
                    console.log(error);
                }
            },

            _loadFragment: async function (sFragmentName) {
                var sViewId = this.getView().getId();
                var oContainer = sap.ui.getCore().byId(
                    sViewId + "--budgets--detailsDynamicContainer");

                if (!oContainer) {
                    console.error("Dynamic container not found");
                    return Promise.resolve();
                    //return;
                }

                const isForecastMode = this.getInterface().getModel("utilities").getProperty("/isForecastMode");

                return new Promise(async (resolve, reject) => {

                    oContainer.destroyItems();

                    if (sFragmentName === "Missions" && !isForecastMode) {
                        try {
                            const oFragment = await sap.ui.core.Fragment.load({
                                name: "com.avv.ingerop.ingeropfga.ext.view.tab.detail." + sFragmentName,
                                id: sViewId,
                                controller: this
                            });

                            oContainer.addItem(oFragment);
                        } catch (oError) {
                            sap.m.MessageBox.error("Failed to load fragment: " + oError.message);
                            reject(oError);
                        }

                        this.prepareMissionsTreeData();
                        this.preparePxAutreTreeData();
                        this.preparePxSubContractingTreeData();
                        this.preparePxRecetteExtTreeData();
                        this.preparePxMainOeuvreTreeData();
                        this.preparePxSTITreeData();
                        this.preparePrevisionelTreeData();
                    }

                    if (isForecastMode) {
                        this.preparePrevisionelTreeData();
                    }

                    resolve();


                    /*else {

                        try {
                            const oFragment = await sap.ui.core.Fragment.load({
                                name: "com.avv.ingerop.ingeropfga.ext.view.tab.DetailsTab", //change to Hoai tab
                                id: sViewId,
                                controller: this
                            });

                            oContainer.addItem(oFragment);

                            resolve();

                        } catch (oError) {
                            sap.m.MessageBox.error("Failed to load fragment: " + oError.message);
                        }

                    }*/
                });
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

            onRefreshTree: function (oEvent) {
                this._missionsTab.onRefreshTree(oEvent);
            },

            onMissionCodeChange: function (oEvent) {
                this._missionsTab.onMissionCodeChange(oEvent);
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

            onCumuleClick: function (oEvent) {
                if (!this._budgetPxAutre) {
                    this._budgetPxAutre = new BudgetPxAutre();
                    this._budgetPxAutre.oView = this.oView;
                }
                this._budgetPxAutre.onCumuleClick(oEvent);
            },

            // ===========================================================
            // Handle Budget Px TAB - Budget Px Sub Contracting Section
            // Handles preparation and submition budget items 
            // in the mission  process
            // ===========================================================

            preparePxSubContractingTreeData: function () {
                this._budgetPxSubContracting.preparePxSubContractingTreeData();
            },

            onBtnAddSubContractorPress: function (oEvent) {
                if (!this._budgetPxSubContracting) {
                    this._budgetPxSubContracting = new BudgetPxSubContracting();
                    this._budgetPxSubContracting.oView = this.oView;
                }

                this._budgetPxSubContracting.addNewContractor();
            },

            // ===========================================================
            // Handle Budget Px TAB - Budget Px Recette Externe Section
            // Handles preparation and submition budget items 
            // in the mission  process
            // ===========================================================
            onChangeRecetteExtMontant(oEvent) {
                if (!this._budgetPxRecetteExt) {
                    this._budgetPxRecetteExt = new BudgetPxRecetteExt();
                    this._budgetPxRecetteExt.oView = this.oView;
                }

                this._budgetPxRecetteExt.reCalcRecetteTable();
            },

            preparePxRecetteExtTreeData: function () {
                this._budgetPxRecetteExt.preparePxRecetteExtTreeData();
            },

            // ===========================================================
            // Handle Budget Px TAB - Budget Px Main d'oeuvre Section
            // Handles preparation and submition budget items 
            // in the mission  process
            // ===========================================================
            onChangeMainOeuvreMontant(oEvent) {
                if (!this._budgetMainOeuvre) {
                    this._budgetMainOeuvre = new BudgetPxMainOeuvre();
                    this._budgetMainOeuvre.oView = this.oView;
                }

                this._budgetMainOeuvre.reCalcMainOeuvreTable();
            },

            onBtnAddMOProfilPress: function (oEvent) {
                if (!this._budgetMainOeuvre) {
                    this._budgetMainOeuvre = new BudgetPxMainOeuvre();
                    this._budgetMainOeuvre.oView = this.oView;
                }

                this._budgetMainOeuvre.addNewMOProfil();
            },

            preparePxMainOeuvreTreeData: function () {
                this._budgetMainOeuvre.preparePxMainOeuvreTreeData();
            },

            // ==============================================
            // Handle Budget Px TAB - Budget Px STI Section
            // Handles preparation and submition budget items 
            // in the mission  process
            // ==============================================

            // Delegates submit logic to specialized handler : Budget Px Autres
            preparePxSTITreeData: function () {
                this._budgetPxSTI.preparePxSTITreeData();
            },

            onPxSTISubmit: function (oEvent) {
                if (!this._budgetPxSTI) {
                    this._budgetPxSTI = new BudgetPxSTI();
                    this._budgetPxSTI.oView = this.oView;
                }
                this._budgetPxSTI.onSubmit(oEvent);
            },

            onCumuleClick: function (oEvent) {
                if (!this._budgetPxSTI) {
                    this._budgetPxSTI = new BudgetPxSTI();
                    this._budgetPxSTI.oView = this.oView;
                }
                this._budgetPxSTI.onCumuleClick(oEvent);
            },

            // ==============================================
            // Handle Budget Prévisionel TAB 
            // Handles preparation and submition budget  
            // in the mission  process
            // ==============================================

            // Delegates submit logic to specialized handler : Budget Prévisionel
            preparePrevisionelTreeData: function () {
                this._budgetPrevisionel.preparePrevisionelTreeData();
            },

            onPrevisionelSubmit: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onSubmit(oEvent);
            },

            onSearchPrevisionel: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onSearch(oEvent);
            },

            onCompanyValueHelp: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onCompanyValueHelp(oEvent);
            },

            onProfitCenterValueHelp: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onProfitCenterValueHelp(oEvent);
            },

            onUFOValueHelp: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onUFOValueHelp(oEvent);
            },

            onBusinessNoValueHelp: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onBusinessNoValueHelp(oEvent);
            },

            onExpandCollapseAll: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                this._budgetPrevisionel.onExpandCollapseAll(oEvent);
            },

            calculateTotalFacturer: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return  this._budgetPrevisionel.calculateTotalFacturer(oEvent);
            },

            calculateTotalDepenser: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return  this._budgetPrevisionel.calculateTotalDepenser(oEvent);
            },

            calculateRatio: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return  this._budgetPrevisionel.calculateRatio(oEvent);
            },
            
            formatRatioColorFromData: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return  this._budgetPrevisionel.formatRatioColorFromData(oEvent);
            },

            formatRatioIndicatorFromData: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return  this._budgetPrevisionel.formatRatioIndicatorFromData(oEvent);
            },

            calculateRatioValue: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return  this._budgetPrevisionel.calculateRatioValue(oEvent);
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
                    // const formattedValue = parseFloat(value).toFixed(2);
                    // return `${formattedValue}%`;
                    return `${parseFloat(String(value).replace(',', '.')).toFixed(2).replace('.', ',')}%`;
                }

                if (row_type === "RBA") {

                }

                // return value.toString();
                var intVal = Math.round(value);
                // Formater avec séparateur "espace"
                return intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
            // ==============================================
            // Notes Section !!!!
            // ==============================================
            onLiveChangeNotes: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oSource = oEvent.getSource();
                var oContext = oSource.getBindingContext();
                oContext.getModel().setProperty(oContext.getPath() + "/Notes", sValue);
            },
            // ==============================================
            // Table Design Budgets Section !!!!
            // ==============================================
            onRowsUpdatedSyntTab: function () {
                var stableName = "synthesisTab";
                this.onSynthesisUpdated(stableName);
            },
            onSynthesisUpdated: function (stableName) {
                try {
                    var sViewId = this.oView.sId;
                    const oTable = sap.ui.getCore().byId(
                        sViewId + "--SyntheseTab--SyntheseTable--" + stableName);
                    if (oTable) {
                        const aTotals = [
                            "recettes",
                            "main d’œuvre",
                            "main d'œuvre",
                            "autres charges",
                            "charges"
                        ];
                        const aRows = oTable.getRows();
                        aRows.forEach((oRow, i) => {
                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const sDesc = oContext.getProperty("description").toLowerCase();
                                const nCumul = oContext.getProperty("CumulN");
                                // Reset old classes
                                oRow.$().removeClass("sectionRow rbaNegative");
                                // Apply total style
                                if (aTotals.some(label => sDesc === label)) {
                                    oRow.addStyleClass("totalRow");
                                }
                                // Apply RBA style
                                if (sDesc.includes("rba")) {
                                    oRow.addStyleClass("totalRow");
                                    if (parseFloat(nCumul) < 0) {
                                        oRow.addStyleClass("rbaNegative");
                                    }
                                }
                            }
                        });
                    } else {
                        console.warn("Table not found:", stableName);
                        return;
                    }
                } catch (err) {
                    console.error("onSynthesisUpdated failed:", err);
                }
            },
            // ==============================================
            // Table Design Recap  Section !!!!
            // ==============================================
            onRowsUpdatedRecapTab: function () {
                var stableName = "idRecapTable";
                // const oTbl = this.oView.byId("idRecapTable");
                // if (!oTbl) return;

                // oTbl.setBusy(true);

                // // Laisse le busy se peindre, puis fais le travail
                // requestAnimationFrame(() => {
                //     try {
                //         this.onRecapUpdated("idRecapTable");
                //         this._resetRecapMerge();
                //         this._styleMergedRecapRow();
                //     } finally {
                //         oTbl.setBusy(false); // toujours relâcher, même en cas d’erreur
                //     }
                // });
                this.onRecapUpdated(stableName);
                this._resetRecapMerge();
                this._styleMergedRecapRow();
            },

            onRecapUpdated: function (stableName) {
                const oTable = this.oView.byId(stableName);
                if (!oTable) {
                    console.warn("Recap table not found:", stableName);
                    return;
                }

                try {
                    const oDomRef = oTable.getDomRef();
                    if (!oDomRef) {
                        console.warn("DOM ref not ready for table:", stableName);
                        return;
                    }

                    // Map labels -> classes (normalize to lowercase once)
                    const acolorLabels = new Map([
                        ["budget objectif", { header: "orangeHeader", body: "orangeColumn" }],
                        ["ecart objectif", { header: "orangeHeader", body: "orangeColumn" }],
                        ["budget actif n", { header: "pinkHeader", body: "pinkColumn" }],
                        ["budget actif m-1 n", { header: "pinkHeader", body: "pinkColumn" }],
                        ["ecart m", { header: "pinkHeader", body: "pinkColumn" }],
                        ["budget n-1", { header: "pinkHeader", body: "pinkColumn" }],
                    ]);
                    const norm = s => (s || "").trim().toLowerCase();
                    // columns where negatives must be bold + red
                    const anegativeCols = new Set([
                        "année en cours",
                        "reste à venir"
                    ]);

                    oTable.getColumns().forEach((oCol) => {
                        const sLabel = norm(oCol.getLabel()?.getText?.());
                        const cfg = acolorLabels.get(sLabel);
                        const sColId = oCol.getId();

                        // Header cell (color whole header cell, not just the label)
                        const oHeaderCell = oDomRef.querySelector(`td[data-sap-ui-colid="${sColId}"]`);
                        if (cfg && oHeaderCell) oHeaderCell.classList.add(cfg.header);
                        // body cells for this column
                        const aBodyCells = oDomRef.querySelectorAll(
                            `.sapUiTableTr:not(.sapUiTableHeaderRow) td[data-sap-ui-colid="${sColId}"]`
                        );
                        // Body cells for this column 
                        if (cfg) {
                            aBodyCells.forEach(cell => cell.classList.add(cfg.body));
                        }
                        // negative formatting for specific columns
                        // if (anegativeCols.has(sLabel)) {
                        //     aBodyCells.forEach(cell => {
                        //         const val = this.parseCellNumber(cell.textContent);
                        //         const oTextElem = cell.querySelector(".sapMText, .sapMLnk");
                        //         if (!isNaN(val) && val < 0) {
                        //             //cell.classList.add("negativeValue");
                        //             oTextElem.classList.add("negativeValue");
                        //         } else {
                        //             //cell.classList.remove("negativeValue");
                        //             oTextElem.classList.remove("negativeValue");
                        //         }
                        //     });
                        // }
                    });

                    // === (B) Lignes RBA : rouge+gras si négatif ; sinon gras+noir ===
                    oTable.getRows().forEach(oRow => {
                        const oCtx = oRow.getBindingContext("utilities");
                        if (!oCtx) return;
                        if (oCtx.getProperty("row_type") !== "CA") return;

                        const $cells = oRow.$().find('td[data-sap-ui-colid]');
                        $cells.each((i, td) => {
                            if (i === 0) return; // ignore la colonne de description
                            const el = td.querySelector(".sapMText, .sapMLnk, .sapMObjectNumberText, .sapMObjStatusText");
                            if (!el) return;

                            el.classList.add("alwaysBold");
                            // Parse numérique (gère espaces, virgules, %)
                            // const num = this.parseCellNumber(el.textContent || td.textContent);

                            // if (!isNaN(num) && num < 0) {
                            // // Négatif → rouge + gras
                            // el.classList.add("negativeValue");
                            // } else {
                            // // Non négatif (y compris NaN) → gras + noir
                            // el.classList.add("rbaBold");
                            // }
                        });
                    });

                    // === (B) Lignes RBA : rouge+gras si négatif ; sinon gras+noir ===
                    oTable.getRows().forEach(oRow => {
                        const oCtx = oRow.getBindingContext("utilities");
                        if (!oCtx) return;
                        if (oCtx.getProperty("row_type") !== "RBA") return;

                        const $cells = oRow.$().find('td[data-sap-ui-colid]');
                        $cells.each((i, td) => {
                            if (i === 0) return; // ignore la colonne de description
                            const el = td.querySelector(".sapMText, .sapMLnk, .sapMObjectNumberText, .sapMObjStatusText");
                            if (!el) return;

                            // Nettoie d'abord les styles précédents
                            el.classList.remove("negativeValue", "rbaBold");

                            // Parse numérique (gère espaces, virgules, %)
                            const num = this.parseCellNumber(el.textContent || td.textContent);

                            if (!isNaN(num) && num < 0) {
                                // Négatif → rouge + gras
                                el.classList.add("negativeValue");
                            } else {
                                // Non négatif (y compris NaN) → gras + noir
                                el.classList.add("rbaBold");
                            }
                        });
                    });


                } catch (err) {
                    console.error("onRecapUpdated failed:", err);
                }

            },

            // remet la ligne "propre" (annule toute fusion précédente)
            _resetRecapMerge: function () {
                const oTable = this.oView.byId("idRecapTable");
                const dom = oTable && oTable.getDomRef();
                if (!dom) return;

                jQuery(dom).find('.sapUiTableTr:not(.sapUiTableHeaderRow)').each(function () {
                    const $tr = jQuery(this);
                    const $cells = $tr.find('td[data-sap-ui-colid]');
                    $cells.each((_, td) => {
                        td.style.background = "";
                        td.style.position = "";
                        td.style.overflow = "";
                        const inner = td.querySelector(".sapMText, .sapMLnk");
                        if (inner) {
                            inner.style.visibility = "";
                            inner.style.color = "";
                            inner.style.fontWeight = "";
                            inner.style.textAlign = "";
                        }
                    });
                });

                // ➜ enlève nos overlays
                jQuery(dom).find('.sfgpOverlay, .sfgpOverlayRight').remove();
            },

            _styleMergedRecapRow: function () {
                if (PROJET_TYPE === "Z0" || PROJET_TYPE === "Z1") {

                    const oTable = this.oView.byId("idRecapTable");
                    const oBinding = oTable && oTable.getBinding("rows");
                    if (!oBinding) return;

                    const aRowsWithCtx = oTable.getRows().filter(r => !!r.getBindingContext("utilities"));
                    if (aRowsWithCtx.length < 2) {
                        setTimeout(() => this._styleMergedRecapRow(), 50);
                        return;
                    }

                    const norm = s => (s || "").trim().toLowerCase();

                    // Indices colonnes clés
                    let idxCumulN1 = -1;        // "Cumul N-1"
                    let idxCumulJour = -1;      // "Cumul à ce jour"
                    let idxAnnee = -1;          // "Année en cours"

                    oTable.getColumns().forEach((c, i) => {
                        const t = c.getLabel && c.getLabel().getText && c.getLabel().getText();
                        const tl = norm(t);
                        if (tl === "cumul n-1") idxCumulN1 = i;
                        if (tl === "cumul à ce jour") idxCumulJour = i;
                        if (tl === "année en cours") idxAnnee = i;
                    });

                    // Fallbacks prudents si libellés changent
                    if (idxCumulN1 < 0) idxCumulN1 = 3;
                    if (idxCumulJour < 0) idxCumulJour = idxCumulN1 + 1;
                    if (idxAnnee < 0) idxAnnee = idxCumulJour + 1;

                    const lastColIdx = oTable.getColumns().length - 1;

                    // Textes existants pour l’overlay bleu de gauche
                    const txtBefore = (PROJET_TYPE === "Z0") ? "Impact super projet ajustement"
                        : (PROJET_TYPE === "Z1") ? "Impact projet ajustement"
                            : "Impact projet ajustement";
                    const txtLast = (PROJET_TYPE === "Z0") ? "Impact super projet PAT"
                        : (PROJET_TYPE === "Z1") ? "Impact projet PAT"
                            : "Impact projet PAT";

                    // Helper générique
                    const paintBlock = (oRow, fromIdx, toIdx, opts) => {
                        if (toIdx < fromIdx) return; // rien à peindre
                        const $row = oRow.$();
                        if (!$row.length) return;
                        const $cells = $row.find('td[data-sap-ui-colid]');
                        if (!$cells.length) { setTimeout(() => this._styleMergedRecapRow(), 50); return; }

                        for (let i = fromIdx; i <= toIdx && i < $cells.length; i++) {
                            const td = $cells.get(i);
                            td.style.background = opts.bg;
                            const inner = td.querySelector(".sapMText, .sapMLnk");
                            if (inner) inner.style.visibility = (opts.showFirst && i === fromIdx) ? "" : "hidden";
                        }

                        let totalW = 0;
                        for (let i = fromIdx; i <= toIdx && i < $cells.length; i++) {
                            const w = $cells.get(i).getBoundingClientRect().width;
                            totalW += (isFinite(w) ? w : 0);
                        }
                        if (totalW <= 0) { setTimeout(() => this._styleMergedRecapRow(), 50); return; }

                        const tdStart = $cells.get(fromIdx);
                        tdStart.style.position = "relative";
                        tdStart.style.overflow = "visible";

                        const overlay = document.createElement("div");
                        overlay.className = opts.className;
                        overlay.textContent = opts.text || "";
                        Object.assign(overlay.style, {
                            position: "absolute",
                            left: "0",
                            top: "0",
                            width: totalW + "px",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: opts.text ? "#fff" : "transparent",
                            fontWeight: opts.text ? "600" : "normal",
                            fontSize: "0.8rem",
                            backgroundColor: opts.bg,
                            pointerEvents: "none",
                            zIndex: 2
                        });

                        tdStart.appendChild(overlay);
                    };

                    const rBefore = aRowsWithCtx[aRowsWithCtx.length - 2];
                    const rLast = aRowsWithCtx[aRowsWithCtx.length - 1];

                    // === FUSION GAUCHE BLEU ===
                    // Désormais on s'arrête AVANT "Cumul N-1" → 3 premières colonnes (Desc + 2 budgets)
                    const leftEnd = Math.max(0, idxCumulN1 - 1);
                    paintBlock(rBefore, 0, leftEnd, { bg: "#333399", className: "sfgpOverlay", text: txtBefore, showFirst: true });
                    paintBlock(rLast, 0, leftEnd, { bg: "#333399", className: "sfgpOverlay", text: txtLast, showFirst: true });

                    // === COLONNES VISIBLES AU CENTRE ===
                    // On laisse visibles : "Cumul N-1" (idxCumulN1), "Cumul à ce jour" (idxCumulJour), "Année en cours" (idxAnnee)
                    // → rien à faire ici, on ne masque pas ces trois colonnes.

                    // === FUSION DROITE BLANCHE ===
                    // Elle démarre maintenant APRÈS "Année en cours"
                    const rightStart = idxAnnee + 1;
                    if (rightStart <= lastColIdx) {
                        paintBlock(rBefore, rightStart, lastColIdx, { bg: "#ffffff", className: "sfgpOverlayRight", showFirst: false });
                        paintBlock(rLast, rightStart, lastColIdx, { bg: "#ffffff", className: "sfgpOverlayRight", showFirst: false });
                    }
                }
            },

            parseCellNumber: function (svalue) {
                return parseFloat(
                    String(svalue)
                        .replace(/\u00A0/g, "") // espace insécable
                        .replace(/\s/g, "")     // espaces normaux
                        .replace(/%/g, "")      // symbole pourcentage
                        .replace(/,/g, ".")     // virgule décimale → point
                );
            },
            // ================================================
            // Table Design  BudgetPXAutre Budgets Section !!!!
            // ================================================
            onRowsUpdatedBudgetPXTab: function () {
                var stableName = "BudgetPxAutreTreeTable";
                this.onBudgetPXUpdated(stableName);
            },
            onBudgetPXUpdated: function (stableName) {
                try {
                    var sViewId = this.oView.sId;
                    const oTable = sap.ui.getCore().byId(
                        sViewId + "--" + stableName);
                    if (oTable) {
                        const oDomRef = oTable.getDomRef();
                        if (!oDomRef) {
                            console.warn("DOM ref not ready for table:", stableName);
                            return;
                        }
                        const aRows = oTable.getRows();
                        const aExclure = new Set(["cumule", "cumulé", "pourcentage", "rad"]);

                        aRows.forEach(oRow => {

                            // Header cell (color whole header cell, not just the label)
                            oDomRef.querySelectorAll(".sapUiTableColHdrTr.pxHeader")
                                .forEach(tr => tr.classList.remove("pxHeader"));
                            const aHeaderRows = oDomRef.querySelectorAll(".sapUiTableColHdrTr");
                            const oLast = aHeaderRows[aHeaderRows.length - 1];
                            const oFirst = aHeaderRows[aHeaderRows.length / 2 - 1];
                            if (oLast && oFirst) {
                                oFirst.classList.add("pxHeader");
                                oLast.classList.add("pxHeader");

                            }
                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const bIsTotal = !!oContext.getProperty("isTotalRow");
                                const bIsNode = !!oContext.getProperty("isNode");
                                const sName = String(oContext.getProperty("name") || "").trim().toLowerCase();
                                const $row = oRow.$();
                                // Enlever les anciens styles
                                $row.removeClass("pxTotalRow pxSubTotalRow");
                                if (aExclure.has(sName)) {
                                    return;
                                }
                                // total/sub-total rules
                                if (bIsTotal) {
                                    // main total (dark blue + white text)
                                    if (sName === "total acquis") {
                                        oRow.addStyleClass("pxTotalRow");
                                    } else {
                                        if (sName.startsWith("total")) {
                                            // Sous-total (violet clair + texte noir)
                                            oRow.addStyleClass("pxSubTotalRow");
                                        }
                                    }
                                }
                            }
                        });
                    }

                } catch (err) {
                    console.error("onBudgetPXUpdated failed:", err);
                }

            },
            // ===================================================
            // Table Design  BudgetPXSub Contr Budgets Section !!!
            // ===================================================
            onRowsUpdatedBudgetPXSubCTab: function () {
                var stableName = "BudgetPxSubContractingTreeTableId";
                this.onBudgetPXSubCUpdated(stableName);
            },
            onBudgetPXSubCUpdated: function (stableName) {
                try {
                    var sViewId = this.oView.sId;
                    const oTable = sap.ui.getCore().byId(
                        sViewId + "--" + stableName);
                    if (oTable) {
                        const oDomRef = oTable.getDomRef();
                        if (!oDomRef) {
                            console.warn("DOM ref not ready for table:", stableName);
                            return;
                        }
                        // Header cell (color whole header cell, not just the label)
                        oDomRef.querySelectorAll(".sapUiTableColHdrTr.pxHeader")
                            .forEach(tr => tr.classList.remove("pxHeader"));
                        const aHeaderRows = oDomRef.querySelectorAll(".sapUiTableColHdrTr");
                        const oLast = aHeaderRows[aHeaderRows.length - 1];
                        const oFirst = aHeaderRows[aHeaderRows.length / 2 - 1];
                        if (oLast && oFirst) {
                            oFirst.classList.add("pxHeader");
                            oLast.classList.add("pxHeader");

                        }
                        // if (oHeaderRow && oHeaderRow.textContent !== '') oHeaderRow.classList.add("pxHeader");
                        const aRows = oTable.getRows();
                        aRows.forEach(oRow => {
                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const sName = String(oContext.getProperty("name") || "").trim().toLowerCase();
                                const $row = oRow.$();
                                // Enlever les anciens styles
                                $row.removeClass("pxTotalRow pxSubTotalRow");
                                // main total (dark blue + white text)
                                if (sName === "total global") {
                                    oRow.addStyleClass("pxTotalRow");
                                } else {
                                    if (sName.startsWith("total")) {
                                        // Sous-total (violet clair + texte noir)
                                        oRow.addStyleClass("pxSubTotalRow");
                                    }
                                }

                            }
                        });
                    }

                } catch (err) {
                    console.error("onBudgetPXUpdated failed:", err);
                }

            },

            // ================================================
            // Table Design  BudgetPXSTI Budgets Section !!!!
            // ================================================
            onRowsUpdatedBudgetPXSTITab: function () {
                var stableName = "BudgetPxSTITreeTable";
                this.onBudgetPXSTIUpdated(stableName);
            },
            onBudgetPXSTIUpdated: function (stableName) {
                try {
                    var sViewId = this.oView.sId;
                    const oTable = sap.ui.getCore().byId(
                        sViewId + "--" + stableName);
                    if (oTable) {
                        const oDomRef = oTable.getDomRef();
                        if (!oDomRef) {
                            console.warn("DOM ref not ready for table:", stableName);
                            return;
                        }
                        const aRows = oTable.getRows();
                        const aExclure = new Set(["cumule", "cumulé", "pourcentage", "rad"]);

                        aRows.forEach(oRow => {

                            // Header cell (color whole header cell, not just the label)
                            oDomRef.querySelectorAll(".sapUiTableColHdrTr.pxHeader")
                                .forEach(tr => tr.classList.remove("pxHeader"));
                            const aHeaderRows = oDomRef.querySelectorAll(".sapUiTableColHdrTr");
                            const oLast = aHeaderRows[aHeaderRows.length - 1];
                            const oFirst = aHeaderRows[aHeaderRows.length / 2 - 1];
                            if (oLast && oFirst) {
                                oFirst.classList.add("pxHeader");
                                oLast.classList.add("pxHeader");

                            }
                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const bIsTotal = !!oContext.getProperty("isTotalRow");
                                const bIsNode = !!oContext.getProperty("isNode");
                                const sName = String(oContext.getProperty("name") || "").trim().toLowerCase();
                                const $row = oRow.$();
                                // Enlever les anciens styles
                                $row.removeClass("pxTotalRow pxSubTotalRow");
                                if (aExclure.has(sName)) {
                                    return;
                                }
                                // total/sub-total rules
                                if (bIsTotal) {
                                    // main total (dark blue + white text)
                                    if (sName === "Budget STI") {
                                        oRow.addStyleClass("pxTotalRow");
                                    } else {
                                        if (sName.startsWith("total")) {
                                            // Sous-total (violet clair + texte noir)
                                            oRow.addStyleClass("pxSubTotalRow");
                                        }
                                    }
                                }
                            }
                        });
                    }

                } catch (err) {
                    console.error("onBudgetPXSTIUpdated failed:", err);
                }

            },

            onRowsUpdatedBudgetPXMainOeuvreTab() {
                var stableName = "BudgetPxMainOeuvreTreeTableId";
                this.onBudgetPXSubCUpdated(stableName);
            },

            onRowsUpdatedBudgetPXRecetteTab() {
                var stableName = "BudgetPxRecettesTreeTableId";
                this.onBudgetPXSubCUpdated(stableName);
            },

            formatSTIEditable: function (bEditable, sIsSTI) {
                return bEditable && sIsSTI !== "X";
            },

            // ================================================
            // Table Design Budgets Prévisionel Section !!!!
            // ================================================
            onRowsUpdatedBudgetPrevisionelTab: function () {
                var stableName = "PrevisionnelTreeTable";
                this.onBudgetPrevisionelUpdated(stableName);
            },
            onBudgetPrevisionelUpdated: function (stableName) {
                try {
                    var sViewId = this.oView.sId;
                    const oTable = sap.ui.getCore().byId(
                        sViewId + "--" + stableName);
                    if (oTable) {
                        const oDomRef = oTable.getDomRef();
                        if (!oDomRef) {
                            console.warn("DOM ref not ready for table:", stableName);
                            return;
                        }
                        const aRows = oTable.getRows();
                        const aExclure = new Set(["cumule", "cumulé", "pourcentage", "rad"]);

                        jQuery(oDomRef).find("tr").removeClass("pxNodeRow pxSubTotalRow pxTotalRow");

                        aRows.forEach(oRow => {

                            // Header cell (color whole header cell, not just the label)
                            oDomRef.querySelectorAll(".sapUiTableColHdrTr.pxHeader")
                                .forEach(tr => tr.classList.remove("pxHeader"));
                            const aHeaderRows = oDomRef.querySelectorAll(".sapUiTableColHdrTr");
                            const oLast = aHeaderRows[aHeaderRows.length - 1];
                            const oFirst = aHeaderRows[aHeaderRows.length / 2 - 1];
                            if (oLast && oFirst) {
                                oFirst.classList.add("pxHeader");
                                oLast.classList.add("pxHeader");

                            }
                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const bIsTotal = !!oContext.getProperty("isTotalRow");
                                const bIsNode = !!oContext.getProperty("isNode");
                                const sName = String(oContext.getProperty("name") || "").trim().toLowerCase();
                                const $row = oRow.$();
                                // Enlever les anciens styles
                                $row.removeClass("pxTotalRow pxSubTotalRow pxNodeRow");

                                if (aExclure.has(sName)) {
                                    return;
                                }

                                // Forcer les lignes "node" à rester blanches
                                if (bIsNode && !bIsTotal) {
                                    $row.addClass("pxNodeRow");
                                    return; // ne pas appliquer les autres styles
                                }

                                if (sName === "total dépense" || sName === "total facturation") {
                                    // Sous-total (violet clair + texte noir)
                                    oRow.addStyleClass("pxSubTotalRow");
                                }


                            }
                        });
                    }

                } catch (err) {
                    console.error("onBudgetPXUpdated failed:", err);
                }

            },


        });

    });
