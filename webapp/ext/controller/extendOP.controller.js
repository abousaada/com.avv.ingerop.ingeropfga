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
        "./helpers/BudgetPxSTG",
        "./helpers/BudgetPrevisionel",
        "./helpers/Synthese",
        "sap/m/MessageToast",
        "sap/ui/comp/valuehelpdialog/ValueHelpDialog"
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
        BudgetPxSTG,
        BudgetPrevisionel,
        Synthese,
        MessageToast,
        ValueHelpDialog
    ) {
        "use strict";
        var PROJET_TYPE = null;

        return ControllerExtension.extend("com.avv.ingerop.ingeropfga.ext.controller.extendOP", {
            Formatter: Formatter,

            _wireCustomButtons: function () {
                const oView = this.getView();

                // Method 1: Using the full ID you provided
                const oSelectFGAButton = oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--action::selectFGABtn");

                if (oSelectFGAButton) {
                    console.log("Found Select FGA button:", oSelectFGAButton);
                    oSelectFGAButton.attachPress(this.onSelectFGAPress.bind(this));
                } else {
                    console.log("Select FGA button not found with full ID");
                }

                // Find other buttons using similar pattern
                const aButtons = oView.findAggregatedObjects(true, function (oControl) {
                    return oControl.isA("sap.m.Button") &&
                        oControl.getId().includes("--action::");
                });

                console.log("All action buttons:", aButtons);

                aButtons.forEach(oButton => {
                    const sId = oButton.getId();

                    if (sId.includes("prevPeriodBtn")) {
                        oButton.attachPress(this.onPrevPeriod.bind(this));
                    } else if (sId.includes("nextPeriodBtn")) {
                        oButton.attachPress(this.onNextPeriod.bind(this));
                    } else if (sId.includes("periodBtn")) {
                        // This is your label button - make it non-clickable
                        oButton.setEnabled(false);
                    }
                });
            },
            _wireCustomButtons1: function () {
                const oView = this.getView();

                // Method 1: Using the full ID you provided
                const oSelectFGAButton = oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--action::selectFGABtn");

                if (oSelectFGAButton) {
                    console.log("Found Select FGA button:", oSelectFGAButton);
                    // Remove any existing press handler and attach yours
                    oSelectFGAButton.detachPress();
                    oSelectFGAButton.attachPress(this.onSelectFGAPress.bind(this));
                } else {
                    console.log("Select FGA button not found with full ID");
                }

                // Find other buttons using similar pattern
                const aButtons = oView.findAggregatedObjects(true, function (oControl) {
                    return oControl.isA("sap.m.Button") &&
                        oControl.getId().includes("--action::");
                });

                console.log("All action buttons:", aButtons);

                aButtons.forEach(oButton => {
                    const sId = oButton.getId();
                    if (sId.includes("prevPeriodBtn")) {
                        oButton.detachPress();
                        oButton.attachPress(this.onPrevPeriod.bind(this));
                    } else if (sId.includes("nextPeriodBtn")) {
                        oButton.detachPress();
                        oButton.attachPress(this.onNextPeriod.bind(this));
                    } else if (sId.includes("periodBtn")) {
                        // This is your label button - make it non-clickable
                        oButton.setEnabled(false);
                    }
                });
            },

            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {
                onAfterRendering: function () {

                    this._wireCustomButtons();

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

                    this.base.getView().getController().onSelectFGAPress = function () {
                        console.log("onSelectFGAPress");
                    }


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

                    this._budgetPxSTG = new BudgetPxSTG();
                    this._budgetPxSTG.oView = this.getView();

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
                            /*return new Promise((resolve, reject) => {
                                self._executeSave(utilitiesModel, oView, oContext, resolve, reject);
                            }); */

                            return self._executeSave(utilitiesModel, oView, oContext)
                                .then(result => Promise.reject())
                                .catch(err => Promise.reject(err));


                        }
                    } catch (error) {
                        this._setBusy(false);
                        Helper.errorMessage("FGA updated fail");
                        console.log(error);
                        return Promise.reject(error);
                    }
                },

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
                            const formattedPxSTG = utilitiesModel.formattedPxSTG();

                            const formattedPxRecetteExt = utilitiesModel.formattedPxRecetteExt();
                            const formattedMainOeuvre = utilitiesModel.formattedPxMainOeuvre();
                            const formattedMOProfil = utilitiesModel.formattedPxMOProfil();
                            oPayload = Helper.extractPlainData({
                                ...oContext.getObject(),
                                "to_Missions": formattedMissions,
                                "to_BudgetPxAutre": formattedPxAutre,
                                "to_BudgetPxSubContracting": formattedPxSubContractingExt,
                                "to_BudgetPxRecetteExt": formattedPxRecetteExt,
                                "to_BudgetPxSTI": [],
                                "to_BudgetPxSTG": formattedPxSTG,
                                "to_Previsionel": [],
                                "to_BudgetPxMOProfil": formattedMOProfil,
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
                                "to_BudgetPxSTG": {
                                    results: []
                                },
                                "to_Previsionel": {
                                    results: []
                                },
                                "to_BudgetPxMainOeuvre": {
                                    results: []
                                },
                                "to_BudgetPxMOProfil": {
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

                        if (updatedFGA) {
                            const hasRefresh = await this._refreshBudgetPxTab();
                        }
                        if (!isForecastMode && updatedFGA) {
                            this._resetNewMissionFlags(utilitiesModel);
                        }

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
                const bCreateMode = this.getView().getModel("ui").getProperty("/createMode");
                // Parcours des entités modifiées
                if (!bCreateMode) {
                    Object.keys(mPendingChanges).forEach(function (sPath) {
                        oModel.resetChanges([`/${sPath}`]);
                    });
                }
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

                    this._styleHeaderButtons();

                    const oUtilitiesModel = this.getInterface().getModel("utilities");
                    const oContext = e.context;

                    this._checkAffaireEmiseVisibility(oContext);

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
                        this.preparePxSTGTreeData();
                        this.preparePxRecetteExtTreeData();
                        this.preparePxMainOeuvreTreeData();
                        this.preparePxSTITreeData();
                        //this.preparePrevisionelTreeData();
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
            isDeleteVisible: function (editable, isNode, isNew) {
                return this._missionsTab.isDeleteVisible(editable, isNode, isNew);
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

            preparePxSTGTreeData: function () {
                this._budgetPxSTG.preparePxSTGTreeData();
            },

            // onBtnAddSubContractorPress: function (oEvent) {
            //     if (!this._budgetPxSubContracting) {
            //         this._budgetPxSubContracting = new BudgetPxSubContracting();
            //         this._budgetPxSubContracting.oView = this.oView;
            //     }

            //     this._budgetPxSubContracting.addNewContractor();
            // },

            onBtnAddExternalPress: function (oEvent) {
                if (!this._budgetPxSubContracting) {
                    this._budgetPxSubContracting = new BudgetPxSubContracting();
                    this._budgetPxSubContracting.oView = this.oView;
                }

                this._budgetPxSubContracting.addNewExternal();
            },

            onBtnAddFilialePress: function (oEvent) {
                if (!this._budgetPxSTG) {
                    this._budgetPxSTG = new BudgetPxSTG();
                    this._budgetPxSTG.oView = this.oView;
                }

                this._budgetPxSTG.addNewFiliale();
            },


            // ===========================================================
            // Handle Budget Px TAB - Budget Px Recette Externe Section
            // Handles preparation and submition budget items 
            // in the mission  process
            // ===========================================================
            onChangeRecetteExtMontant(oEvent) {
                const oInput = oEvent.getSource();
                let v = oInput.getValue();

                // Si vide → 0
                if (v === "" || v === null) {
                    oInput.setValue("0");
                }
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
            onAmountChange: function (oEvent) {
                const oInput = oEvent.getSource();
                let v = oInput.getValue();

                // Si vide → 0
                if (v === "" || v === null) {
                    oInput.setValue("0");
                }
            },



            onChangeMainOeuvreMontant(oEvent) {
                if (!this._budgetMainOeuvre) {
                    this._budgetMainOeuvre = new BudgetPxMainOeuvre();
                    this._budgetMainOeuvre.oView = this.oView;
                }

                this._budgetMainOeuvre.reCalcMainOeuvreTable();
            },

            onBtnManageMOProfilPress: function (oEvent) {
                if (!this._budgetMainOeuvre) {
                    this._budgetMainOeuvre = new BudgetPxMainOeuvre();
                    this._budgetMainOeuvre.oView = this.oView;
                }

                this._budgetMainOeuvre.manageNewMOProfil(oEvent);
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
                this._budgetPxSTI._onCumulativeLinkPress(oEvent);
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
                return this._budgetPrevisionel.calculateTotalFacturer(oEvent);
            },

            calculateTotalDepenser: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return this._budgetPrevisionel.calculateTotalDepenser(oEvent);
            },

            calculateRatio: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return this._budgetPrevisionel.calculateRatio(oEvent);
            },

            formatRatioColorFromData: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return this._budgetPrevisionel.formatRatioColorFromData(oEvent);
            },

            formatRatioIndicatorFromData: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return this._budgetPrevisionel.formatRatioIndicatorFromData(oEvent);
            },

            calculateRatioValue: function (oEvent) {
                if (!this._budgetPrevisionel) {
                    this._budgetPrevisionel = new BudgetPrevisionel();
                    this._budgetPrevisionel.oView = this.oView;
                }
                return this._budgetPrevisionel.calculateRatioValue(oEvent);
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
                            // reset styles à chaque rowsUpdated
                            oRow.removeStyleClass("pxNotAcquisRow pxTotalRow pxSubTotalRow");

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
                                const aMissions = oContext.oModel.oData.missions;
                                const sName2 = oRow.mAggregations.cells[0].getProperty("text");

                                let sStatus = "";

                                for (const mission of aMissions) {
                                    if (mission.MissionId === sName2) {
                                        sStatus = mission.statutmission;
                                        break;
                                    }
                                }
                                if (sStatus !== "A" && sStatus !== "") {
                                    // Ligne grisée
                                    oRow.addStyleClass("pxNotAcquisRow");
                                }



                                // Enlever les anciens styles
                                // $row.removeClass("pxTotalRow pxSubTotalRow");
                                oRow.removeStyleClass("pxTotalRow pxSubTotalRow");
                                if (aExclure.has(sName)) {
                                    return;
                                }
                                // total/sub-total rules
                                if (bIsTotal) {
                                    // main total (dark blue + white text)
                                    if (sName === "total acquis") {
                                        oRow.addStyleClass("pxTotalRow");
                                    } else {
                                        if (sName.startsWith("sous-total acquis") || sName.startsWith("total tranche")) {
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
                            // reset styles à chaque rowsUpdated
                            oRow.removeStyleClass("pxNotAcquisRow pxTotalRow pxSubTotalRow");

                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const sName = String(oContext.getProperty("name") || "").trim().toLowerCase();
                                const sStatus = String(oContext.getProperty("status") || "").trim().toLowerCase();
                                const $row = oRow.$();
                                // Enlever les anciens styles
                                // $row.removeClass("pxTotalRow pxSubTotalRow");
                                oRow.removeStyleClass("pxTotalRow pxSubTotalRow");
                                // main total (dark blue + white text)
                                if (sName === "total acquis") {
                                    oRow.addStyleClass("pxTotalRow");
                                } else {
                                    if (sName.startsWith("sous-total acquis") || sName.startsWith("total tranche")) {
                                        // Sous-total (violet clair + texte noir)
                                        oRow.addStyleClass("pxSubTotalRow");
                                    }

                                }
                                if (sStatus !== "a" && sStatus !== "") {
                                    // Ligne grisée
                                    oRow.addStyleClass("pxNotAcquisRow");
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
                    const oTable = sap.ui.getCore().byId(sViewId + "--" + stableName);
                    if (oTable) {
                        const oDomRef = oTable.getDomRef();
                        if (!oDomRef) {
                            console.warn("DOM ref not ready for table:", stableName);
                            return;
                        }
                        const aRows = oTable.getRows();
                        const aExclure = new Set(["cumule", "cumulé", "pourcentage", "rad"]);

                        // FIX 1: Add initial cleanup
                        jQuery(oDomRef).find("tr").removeClass("pxNodeRow pxSubTotalRow pxTotalRow");

                        // FIX 2: Apply header styling (same as working code)
                        oDomRef.querySelectorAll(".sapUiTableColHdrTr.pxHeader")
                            .forEach(tr => tr.classList.remove("pxHeader"));
                        const aHeaderRows = oDomRef.querySelectorAll(".sapUiTableColHdrTr");
                        const oLast = aHeaderRows[aHeaderRows.length - 1];
                        const oFirst = aHeaderRows[aHeaderRows.length / 2 - 1];
                        if (oLast && oFirst) {
                            oFirst.classList.add("pxHeader");
                            oLast.classList.add("pxHeader");
                        }

                        aRows.forEach(oRow => {
                            // reset styles à chaque rowsUpdated
                            oRow.removeStyleClass("pxNotAcquisRow pxTotalRow pxSubTotalRow");

                            const oContext = oRow.getBindingContext("utilities");
                            if (oContext) {
                                const bIsTotal = !!oContext.getProperty("isTotalRow");
                                const bIsNode = !!oContext.getProperty("isNode");
                                const sName = String(oContext.getProperty("name") || "").trim().toLowerCase();
                                const $row = oRow.$();
                                const aMissions = oContext.oModel.oData.missions;
                                const sName2 = oRow.mAggregations.cells[0].getProperty("text");

                                let sStatus = "";

                                for (const mission of aMissions) {
                                    if (mission.MissionId === sName2) {
                                        sStatus = mission.statutmission;
                                        break;
                                    }
                                }
                                if (sStatus !== "A" && sStatus !== "") {
                                    // Ligne grisée
                                    oRow.addStyleClass("pxNotAcquisRow");
                                }

                                // FIX 3: Remove all classes (including pxNodeRow)
                                $row.removeClass("pxTotalRow pxSubTotalRow pxNodeRow");

                                if (aExclure.has(sName)) {
                                    return;
                                }

                                // FIX 4: Add node handling logic
                                if (bIsNode && !bIsTotal) {
                                    $row.addClass("pxNodeRow");
                                    return;
                                }

                                // Keep your existing STI logic
                                if (bIsTotal) {
                                    if (sName === "budget sti") {
                                        oRow.addStyleClass("pxTotalRow");
                                    } else if (sName.startsWith("sous-total acquis") || sName.startsWith("total tranche")) {
                                        oRow.addStyleClass("pxSubTotalRow");
                                    }
                                }
                            }
                        });
                    }
                } catch (err) {
                    console.error("onBudgetPXSTIUpdated failed:", err);
                }
            },
            onBudgetPXSTIUpdated1: function (stableName) {
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
                            // reset styles à chaque rowsUpdated
                            oRow.removeStyleClass("pxNotAcquisRow pxTotalRow pxSubTotalRow");

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
                                        if (sName.startsWith("sous-total acquis") || sName.startsWith("total tranche")) {
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

            onRowsUpdatedBudgetPXMainOeuvreTab(oEvent) {
                //Mise à 0 si vide 
                const oTable = oEvent.getSource();
                const aRows = oTable.getRows();

                aRows.forEach((oRow) => {
                    const aCells = oRow.getCells();

                    aCells.forEach((oCell) => {
                        // Récupérer tous les Input descendants (dans VBox/HBox/etc.)
                        const aInputs = oCell.findAggregatedObjects(true, function (oCtrl) {
                            return oCtrl.isA && oCtrl.isA("sap.m.Input");
                        });

                        aInputs.forEach((oInput) => {
                            const s = (oInput.getValue() || "").trim();
                            if (s === "") {
                                oInput.setValue("0");

                                // pousser 0 dans le modèle
                                const oCtx = oInput.getBindingContext("utilities");
                                const oBind = oInput.getBinding("value");

                                if (oCtx && oBind) {
                                    const sPath = oBind.getPath(); // ex: "montant" ou "tranche1"
                                    oCtx.getModel().setProperty(oCtx.getPath() + "/" + sPath, 0);
                                }
                            }
                        });
                    });
                });

                var stableName = "BudgetPxMainOeuvreTreeTableId";
                this.onBudgetPXSubCUpdated(stableName);
            },

            onRowsUpdatedBudgetPXSTGTab() {
                var stableName = "BudgetPxSTFilialeGroupeTableId";
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

            _resetNewMissionFlags: function (utilitiesModel) {
                try {
                    // Get all missions from the model
                    const missions = utilitiesModel.getProperty("/missions") || [];

                    // Set isNew to false for all missions
                    missions.forEach(mission => {
                        mission.isNew = false;
                    });

                    // Update the model
                    utilitiesModel.setProperty("/missions", missions);

                    // Also update the missionsHierarchy to reflect the changes
                    this._missionsTab.prepareMissionsTreeData();

                    console.log("Reset isNew flags for all missions after save");
                } catch (error) {
                    console.error("Error resetting new mission flags:", error);
                }
            },


            _checkAffaireEmiseVisibility: function (oContext) {

                if (!oContext) {
                    return;
                }

                const oUtilitiesModel = this.getInterface().getModel("utilities");
                const affaireType = oContext.getProperty("AffaireType");
                //const bVisible = (affaireType === "F" || affaireType === "P");

                const bVisible = affaireType
                    ? (affaireType === "F" || affaireType === "P")
                    : false;

                const view = this.getView();

                const aSmartForms = view.findAggregatedObjects(true, function (oControl) {
                    return oControl.isA("sap.ui.comp.smartform.SmartForm");
                });

                aSmartForms.forEach(function (oSmartForm) {

                    oSmartForm.getGroups().forEach(function (oGroup) {

                        // THIS is your FieldGroup
                        if (oGroup.getId().includes("AffaireEmise")) {
                            oGroup.setVisible(bVisible);
                        }
                    });
                });
            },



            /**
              * REQUIREMENT IMPLEMENTATION:
              * 
              * 1. PERIOD NAVIGATION:
              *    - Previous/Next buttons to change period
              *    - Current period display (MM/YYYY)
              *    - Direct period input capability
              * 
              * 2. FGA SELECTION WITHOUT PERIOD CHANGE:
              *    - FGA selection button with value help (match code)
              *    - Change FGA without modifying the period
              *    - No need to return to FGA Manager
              */

            _styleHeaderButtons: function () {
                try {
                    const oView = this.getView();
                    const oUtilitiesModel = this.getInterface().getModel("utilities");

                    // Check if we're in create mode
                    const oUIModel = this.base.getView().getModel("ui");
                    const bCreateMode = oUIModel ? oUIModel.getProperty("/createMode") : false;

                    // Get current period from model or context
                    let sCurrentPeriod = oUtilitiesModel.getProperty("/period");
                    let sCurrentFGA = "";

                    // Try to get current FGA from context
                    const oContext = this.base.getView().getBindingContext();
                    if (oContext) {
                        sCurrentFGA = oContext.getProperty("BusinessNo");
                        // If period is not in utilities model, try from context
                        if (!sCurrentPeriod) {
                            sCurrentPeriod = oContext.getProperty("p_period");
                            if (sCurrentPeriod) {
                                oUtilitiesModel.setProperty("/period", sCurrentPeriod);
                            }
                        }
                    }

                    // If still no period, use default
                    if (!sCurrentPeriod) {
                        const now = new Date();
                        const month = String(now.getMonth() + 1).padStart(2, "0");
                        const year = String(now.getFullYear());
                        sCurrentPeriod = `${month}${year}`;
                        oUtilitiesModel.setProperty("/period", sCurrentPeriod);
                    }

                    // Calculate next period
                    const sNextPeriod = this._getNextPeriod(sCurrentPeriod);

                    // Find all header buttons
                    const aButtons = oView.findAggregatedObjects(true, oCtrl =>
                        oCtrl.isA("sap.m.Button") &&
                        (
                            oCtrl.getId().includes("prevPeriodBtn") ||
                            oCtrl.getId().includes("periodBtn") ||
                            oCtrl.getId().includes("nextPeriodBtn") ||
                            oCtrl.getId().includes("selectFGABtn")
                        )
                    );

                    aButtons.forEach(oButton => {
                        const sId = oButton.getId();

                        // Hide buttons in create mode
                        if (bCreateMode) {
                            oButton.setVisible(false);
                            return; // Skip further styling for create mode
                        }

                        // Show buttons in non-create mode
                        oButton.setVisible(true);

                        // Common style for all period-related buttons
                        oButton.setType("Transparent");

                        if (sId.includes("prevPeriodBtn")) {
                            // Previous period arrow 
                            oButton.addStyleClass("fgaPeriodGroupStart");
                            oButton.setIcon("sap-icon://navigation-left-arrow");
                            oButton.setText("");
                            oButton.data("period", sCurrentPeriod);
                            oButton.data("fga", sCurrentFGA);

                        } else if (sId.includes("periodBtn")) {
                            // Period label button - middle button
                            oButton.addStyleClass("fgaPeriodLabel");
                            // Display current period in MM/YYYY format
                            oButton.setText(this._formatPeriodForDisplay(sCurrentPeriod));
                            oButton.data("period", sCurrentPeriod);
                            oButton.data("fga", sCurrentFGA);

                        } else if (sId.includes("nextPeriodBtn")) {
                            // Next period arrow 
                            oButton.addStyleClass("fgaPeriodGroupEnd");
                            oButton.setIcon("sap-icon://navigation-right-arrow");
                            // Display FGA with next period if available
                            let sButtonText = "";
                            oButton.setText(sButtonText);
                            // Store next period info
                            oButton.data("period", sNextPeriod);
                            oButton.data("fga", sCurrentFGA);

                        } else if (sId.includes("selectFGABtn")) {
                            // SELECT FGA button - make it emphasized
                            oButton.setType("Default");
                            oButton.setIcon("sap-icon://value-help");
                            oButton.addStyleClass("fgaFgaAction");
                            oButton.setText("Sélection FGA");
                        }
                    });

                } catch (e) {
                    console.error("Header button styling failed", e);
                }
            },

            onNextPeriod: async function (oEvent) {
                try {
                    const oView = this.getView();
                    const oUtilitiesModel = this.getInterface().getModel("utilities");
                    const oModel = this._getOwnerComponent().getModel();
                    const oNavController = this._getExtensionAPI().getNavigationController();

                    // Get current period and FGA from context
                    const oContext = oView.getBindingContext();
                    if (!oContext) {
                        sap.m.MessageBox.error("Aucun FGA sélectionné");
                        return;
                    }

                    const sCurrentFGA = oContext.getProperty("BusinessNo");
                    let sCurrentPeriod = oContext.getProperty("p_period");

                    // Validate period
                    if (!sCurrentPeriod) {
                        sap.m.MessageBox.error("Période actuelle non définie");
                        return;
                    }

                    // Calculate next period
                    const sNextPeriod = this._getNextPeriod(sCurrentPeriod);

                    // Set busy indicator
                    this._setBusy(true);

                    // Check for unsaved changes
                    const oUIModel = this.base.templateBaseExtension.getView().getModel("ui");
                    const bEditable = oUIModel ? oUIModel.getProperty("/editable") : false;

                    if (bEditable) {
                        const bSaveConfirmed = await new Promise((resolve) => {
                            sap.m.MessageBox.confirm(
                                "Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de changer de période?",
                                {
                                    title: "Modifications non sauvegardées",
                                    actions: [
                                        sap.m.MessageBox.Action.YES,
                                        sap.m.MessageBox.Action.NO,
                                        sap.m.MessageBox.Action.CANCEL
                                    ],
                                    onClose: (sAction) => {
                                        if (sAction === sap.m.MessageBox.Action.YES) {
                                            resolve(true);
                                        } else if (sAction === sap.m.MessageBox.Action.NO) {
                                            resolve(false);
                                        } else {
                                            resolve(null);
                                        }
                                    }
                                }
                            );
                        });

                        if (bSaveConfirmed === null) {
                            this._setBusy(false);
                            return;
                        }

                        if (bSaveConfirmed) {
                            try {
                                const result = await this._executeSaveForNavigation();
                                if (!result) {
                                    this._setBusy(false);
                                    return;
                                }
                            } catch (error) {
                                console.error("Error saving before navigation:", error);
                                sap.m.MessageBox.error("Erreur lors de la sauvegarde");
                                this._setBusy(false);
                                return;
                            }
                        } else {
                            this._cleanModification();
                        }
                    }


                    // Create OData path for next period
                    const sKey = `BusinessNo='${sCurrentFGA}',p_period='${sNextPeriod}'`;
                    const sPath = `/ZC_FGASet(${sKey})`;

                    // Try to read the entity to create a proper context
                    let oBindingContext;
                    try {
                        const oResult = await new Promise((resolve, reject) => {
                            oModel.read(sPath, {
                                success: (oData) => {
                                    // Create a binding context from the read data
                                    const oBindingContext = new sap.ui.model.Context(oModel, sPath);
                                    resolve(oBindingContext);
                                },
                                error: (oError) => reject(oError)
                            });
                        });
                        oBindingContext = oResult;
                    } catch (error) {
                        console.error("Error reading FGA for next period:", error);
                        // If read fails, create a dummy context like in your List Report
                        const oNavigationContext = oModel.createEntry("/ZC_FGASet", {
                            properties: {
                                BusinessNo: sCurrentFGA,
                                p_period: sNextPeriod
                            }
                        });
                        oBindingContext = oNavigationContext;
                    }

                    // Update utilities model with new period
                    oUtilitiesModel.setProperty("/period", sNextPeriod);
                    oUtilitiesModel.setBusinessNo(sCurrentFGA);

                    // Navigate to next period
                    await oNavController.navigateInternal(oBindingContext, {
                        navigationMode: "inplace"
                    });

                    // Refresh page with next period data
                    await this._refreshNormalModeData(sNextPeriod, sCurrentFGA);

                    // Update button texts
                    this._styleHeaderButtons();

                    MessageToast.show(`Navigation vers la période: ${this._formatPeriodForDisplay(sNextPeriod)}`);

                } catch (error) {
                    console.error("Error navigating to next period:", error);
                    sap.m.MessageBox.error(`Erreur: ${error.message || "Impossible de naviguer vers la période suivante"}`);
                } finally {
                    this._setBusy(false);
                }
            },
            _getNextPeriod: function (sCurrentPeriod) {
                if (!sCurrentPeriod || sCurrentPeriod.length !== 6) {
                    // Default to current month/year if invalid
                    const now = new Date();
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const year = String(now.getFullYear());
                    return `${month}${year}`;
                }

                // Parse current period (MMYYYY format)
                const month = parseInt(sCurrentPeriod.substring(0, 2), 10);
                const year = parseInt(sCurrentPeriod.substring(2, 6), 10);

                let nextMonth, nextYear;

                if (month === 12) {
                    nextMonth = 1;
                    nextYear = year + 1;
                } else {
                    nextMonth = month + 1;
                    nextYear = year;
                }

                // Format back to MMYYYY
                return `${String(nextMonth).padStart(2, "0")}${nextYear}`;
            },

            // Add this method to format period for display (MM/YYYY)
            _formatPeriodForDisplay: function (sPeriod) {
                if (!sPeriod || sPeriod.length !== 6) return sPeriod;

                const month = sPeriod.substring(0, 2);
                const year = sPeriod.substring(2, 6);
                return `${month}/${year}`;
            },

            _navigateToPeriod: function (sPeriod, sFGA) {
                const oUtilitiesModel = this.getInterface().getModel("utilities");
                const oView = this.getView();
                const oModel = this._getOwnerComponent().getModel();
                const oNavController = this._getExtensionAPI().getNavigationController();

                // Update utilities model
                oUtilitiesModel.setProperty("/period", sPeriod);

                // Create navigation context
                const oContext = oModel.createEntry("/ZC_FGASet", {
                    properties: {
                        BusinessNo: sFGA || "DUMMY",
                        p_period: sPeriod
                    }
                });

                // Navigate
                oNavController.navigateInternal(oContext, {
                    navigationMode: "inplace"
                }).catch(error => {
                    console.error("Error navigating to period:", error);
                });
            },

            _refreshNormalModeData: async function (sPeriod, sBusinessNo) {
                const oUtilitiesModel = this.getInterface().getModel("utilities");

                // Update utilities model
                oUtilitiesModel.setProperty("/period", sPeriod);
                oUtilitiesModel.setBusinessNo(sBusinessNo);

                try {
                    // Clear existing data
                    oUtilitiesModel.reInit();

                    // Load Missions fragment
                    await this._loadFragment("Missions");

                    // Get tab data for new period
                    const tabData = await this._getTabsData(null);

                    // Prepare all tree data
                    this.prepareMissionsTreeData();
                    this.preparePxAutreTreeData();
                    this.preparePxSubContractingTreeData();
                    this.preparePxRecetteExtTreeData();
                    this.preparePxMainOeuvreTreeData();
                    this.preparePxSTITreeData();
                    this.preparePrevisionelTreeData();

                    // Force refresh of Object Page
                    this._getExtensionAPI().refresh();

                    // Trigger any necessary UI updates
                    this._extendOPUiManage._setOPView(this.base.getView().getBindingContext());

                } catch (error) {
                    console.error("Error refreshing normal mode data:", error);
                    throw error;
                }
            },

            async _refreshBudgetPxTab() {
                const oUtilitiesModel = this.getInterface().getModel("utilities");

                try {
                    // Clear existing data
                    oUtilitiesModel.resetBudgetData();

                    // Load Missions fragment
                    await this._loadFragment("Missions");

                    // Get tab data for new period
                    const tabData = await oUtilitiesModel.getBudgetPxTabData();

                    // Prepare all tree data
                    this.prepareMissionsTreeData();
                    this.preparePxAutreTreeData();
                    this.preparePxSubContractingTreeData();
                    this.preparePxRecetteExtTreeData();
                    this.preparePxMainOeuvreTreeData();
                    this.preparePxSTGTreeData();
                    this.preparePxSTITreeData();

                } catch (error) {
                    console.error("Error refreshing budget px data:", error);
                    throw error;
                }
            },

            _exSaveecuteForNavigation: async function () {
                try {
                    const oView = this.base.getView();
                    const oContext = oView.getBindingContext();
                    const oUtilitiesModel = this.getModel("utilities");

                    if (!oContext) {
                        throw new Error("Aucun contexte disponible");
                    }

                    // Validate data before save
                    if (!oUtilitiesModel.validDataBeforeSave(oView)) {
                        sap.m.MessageBox.error("Veuillez vérifier tous les champs avant de sauvegarder");
                        return false;
                    }

                    if (!oUtilitiesModel.validRecetteExtBeforeSave(oView)) {
                        sap.m.MessageBox.error("Veuillez répartir correctement les budgets");
                        return false;
                    }

                    this._setBusy(true);

                    // Prepare payload for save
                    const formattedMissions = oUtilitiesModel.getFormattedMissions();
                    const formattedPxAutre = oUtilitiesModel.getFormattedPxAutre();
                    const formattedPxSubContractingExt = oUtilitiesModel.formattedPxSubContractingExt();
                    const formattedPxRecetteExt = oUtilitiesModel.formattedPxRecetteExt();
                    const formattedMainOeuvre = oUtilitiesModel.formattedPxMainOeuvre();
                    const formattedMOProfil = oUtilitiesModel.formattedPxMOProfil();

                    const oPayload = Helper.extractPlainData({
                        ...oContext.getObject(),
                        "to_Missions": formattedMissions,
                        "to_BudgetPxAutre": formattedPxAutre,
                        "to_BudgetPxSubContracting": formattedPxSubContractingExt,
                        "to_BudgetPxRecetteExt": formattedPxRecetteExt,
                        "to_BudgetPxSTI": [],
                        "to_Previsionel": [],
                        "to_BudgetPxMOProfil": formattedMOProfil,
                        "to_BudgetPxMainOeuvre": formattedMainOeuvre
                    });

                    delete oPayload.to_BudgetPxSTI;
                    delete oPayload.to_Previsionel;
                    oPayload.VAT = oPayload.VAT ? oPayload.VAT.toString() : oPayload.VAT;

                    // Execute save
                    const updatedFGA = await oUtilitiesModel.deepUpsertFGA(oPayload);

                    if (updatedFGA) {
                        await this._refreshBudgetPxTab();
                        this._resetNewMissionFlags(oUtilitiesModel);
                        MessageToast.show("Modifications sauvegardées avec succès");
                        return true;
                    } else {
                        throw new Error("Échec de la sauvegarde");
                    }

                } catch (error) {
                    console.error("Error in executeSaveForNavigation:", error);
                    sap.m.MessageBox.error("Erreur lors de la sauvegarde: " + (error.message || "Erreur inconnue"));
                    return false;
                } finally {
                    this._setBusy(false);
                }
            },

            onPrevPeriod: async function (oEvent) {
                try {
                    const oView = this.getView();
                    const oUtilitiesModel = this.getInterface().getModel("utilities");
                    const oModel = this._getOwnerComponent().getModel();
                    const oNavController = this._getExtensionAPI().getNavigationController();

                    // Get current period and FGA from context
                    const oContext = oView.getBindingContext();
                    if (!oContext) {
                        sap.m.MessageBox.error("Aucun FGA sélectionné");
                        return;
                    }

                    const sCurrentFGA = oContext.getProperty("BusinessNo");
                    let sCurrentPeriod = oContext.getProperty("p_period");

                    // Validate period
                    if (!sCurrentPeriod) {
                        sap.m.MessageBox.error("Période actuelle non définie");
                        return;
                    }

                    // Calculate previous period
                    const sPrevPeriod = this._getPrevPeriod(sCurrentPeriod);

                    // Set busy indicator
                    this._setBusy(true);

                    // Check for unsaved changes
                    const oUIModel = this.base.templateBaseExtension.getView().getModel("ui");
                    const bEditable = oUIModel ? oUIModel.getProperty("/editable") : false;

                    if (bEditable) {
                        const bSaveConfirmed = await new Promise((resolve) => {
                            sap.m.MessageBox.confirm(
                                "Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de changer de période?",
                                {
                                    title: "Modifications non sauvegardées",
                                    actions: [
                                        sap.m.MessageBox.Action.YES,
                                        sap.m.MessageBox.Action.NO,
                                        sap.m.MessageBox.Action.CANCEL
                                    ],
                                    onClose: (sAction) => {
                                        if (sAction === sap.m.MessageBox.Action.YES) {
                                            resolve(true);
                                        } else if (sAction === sap.m.MessageBox.Action.NO) {
                                            resolve(false);
                                        } else {
                                            resolve(null);
                                        }
                                    }
                                }
                            );
                        });

                        if (bSaveConfirmed === null) {
                            this._setBusy(false);
                            return;
                        }

                        if (bSaveConfirmed) {
                            try {
                                const result = await this._executeSaveForNavigation();
                                if (!result) {
                                    this._setBusy(false);
                                    return;
                                }
                            } catch (error) {
                                console.error("Error saving before navigation:", error);
                                sap.m.MessageBox.error("Erreur lors de la sauvegarde");
                                this._setBusy(false);
                                return;
                            }
                        } else {
                            this._cleanModification();
                        }
                    }


                    // Create navigation context for previous period
                    const oNavigationContext = oModel.createEntry("/ZC_FGASet", {
                        properties: {
                            BusinessNo: sCurrentFGA,
                            p_period: sPrevPeriod
                        }
                    });

                    // Update utilities model
                    oUtilitiesModel.setProperty("/period", sPrevPeriod);
                    oUtilitiesModel.setBusinessNo(sCurrentFGA);

                    // Navigate to previous period
                    const sKey = `BusinessNo='${sCurrentFGA}',p_period='${sPrevPeriod}'`;
                    const sPath = `/ZC_FGASet(${sKey})`;
                    const oResult = await new Promise((resolve, reject) => {
                        oModel.read(sPath, {
                            success: (oData) => {
                                // Create a binding context from the read data
                                const oBindingContext = new sap.ui.model.Context(oModel, sPath);
                                resolve(oBindingContext);
                            },
                            error: (oError) => reject(oError)
                        });
                    });

                    // Update utilities model with new period
                    oUtilitiesModel.setProperty("/period", sPrevPeriod);
                    oUtilitiesModel.setBusinessNo(sCurrentFGA);

                    await oNavController.navigateInternal(oResult, {
                        navigationMode: "inplace"
                    });

                    // Refresh page with previous period data
                    await this._refreshNormalModeData(sPrevPeriod, sCurrentFGA);

                    // Update button texts
                    this._styleHeaderButtons();

                    MessageToast.show(`Navigation vers la période: ${this._formatPeriodForDisplay(sPrevPeriod)}`);

                } catch (error) {
                    console.error("Error navigating to previous period:", error);
                    sap.m.MessageBox.error(`Erreur: ${error.message || "Impossible de naviguer vers la période précédente"}`);
                } finally {
                    this._setBusy(false);
                }
            },


            _getPrevPeriod: function (sCurrentPeriod) {
                if (!sCurrentPeriod || sCurrentPeriod.length !== 6) {
                    const now = new Date();
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const year = String(now.getFullYear());
                    return `${month}${year}`;
                }

                const month = parseInt(sCurrentPeriod.substring(0, 2), 10);
                const year = parseInt(sCurrentPeriod.substring(2, 6), 10);

                let prevMonth, prevYear;

                if (month === 1) {
                    prevMonth = 12;
                    prevYear = year - 1;
                } else {
                    prevMonth = month - 1;
                    prevYear = year;
                }

                return `${String(prevMonth).padStart(2, "0")}${String(prevYear)}`;
            },


            onSelectFGAPress: function (oEvent) {
                var oView = this.getView();
                var self = this; // Store reference to controller

                // First, ensure data is loaded
                var oModel = this.getView().getModel();

                // Check if data is already loaded
                var aData = oModel.getProperty("/ZC_FGA_VH");
                if (!aData || aData.length === 0) {
                    console.log("Loading BusinessNo data...");

                    // Show busy indicator
                    var oBusyDialog = new sap.m.BusyDialog({
                        text: "Chargement des données...",
                        title: "Veuillez patienter"
                    });
                    oBusyDialog.open();

                    // Load data first
                    oModel.read("/ZC_FGA_VH", {
                        success: function (oData) {
                            console.log("Data loaded successfully:", oData.results.length, "items");
                            oBusyDialog.close();
                            self._openBusinessNoDialog(oView, oData.results, self);
                        },
                        error: function (oError) {
                            console.error("Error loading data:", oError);
                            oBusyDialog.close();
                            sap.m.MessageBox.error("Erreur lors du chargement des données");
                        }
                    });
                } else {
                    console.log("Data already loaded:", aData.length, "items");
                    this._openBusinessNoDialog(oView, aData, this);
                }
            },

            _openBusinessNoDialog: function (oView, aData, oController) {
                // Create a new dialog each time to avoid binding issues
                if (this._oBusinessNoDialog) {
                    this._oBusinessNoDialog.destroy();
                }

                this._oBusinessNoDialog = new sap.m.TableSelectDialog({
                    title: "Sélectionner N°Affaire",
                    noDataText: "Aucune affaire trouvée",
                    rememberSelections: false,
                    multiSelect: false, // Single selection only
                    contentWidth: "60%",

                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oTable = oEvent.getSource();
                        var aAllItems = oTable.getModel().getProperty("/allItems");

                        if (sValue) {
                            // Convert search value to lowercase for case-insensitive search
                            var sSearchValue = sValue.toLowerCase();

                            // Check if the search contains wildcard patterns
                            var hasWildcards = sSearchValue.includes('*') || sSearchValue.includes('?');

                            var aFilteredItems = aAllItems.filter(function (oItem) {
                                var bMatch = false;

                                // Get item values (convert to lowercase for case-insensitive comparison)
                                var sBusinessNo = oItem.BusinessNo ? oItem.BusinessNo.toLowerCase() : '';
                                var sBusinessName = oItem.BusinessName ? oItem.BusinessName.toLowerCase() : '';

                                if (hasWildcards) {
                                    // Convert wildcard pattern to regex
                                    // Escape regex special characters except * and ?
                                    var pattern = sSearchValue
                                        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
                                        .replace(/\*/g, '.*') // Convert * to .*
                                        .replace(/\?/g, '.'); // Convert ? to .

                                    var regex = new RegExp('^' + pattern + '$', 'i'); // 'i' flag for case-insensitive

                                    // Check if BusinessNo OR BusinessName matches the pattern
                                    bMatch = regex.test(sBusinessNo) || regex.test(sBusinessName);
                                } else {
                                    // Simple substring search (without wildcards)
                                    // This allows partial matching like "100" for "AAA1000111"
                                    bMatch = sBusinessNo.includes(sSearchValue) ||
                                        sBusinessName.includes(sSearchValue);
                                }

                                return bMatch;
                            });

                            oTable.getModel().setProperty("/items", aFilteredItems);
                        } else {
                            // If search is empty, show all items
                            oTable.getModel().setProperty("/items", aAllItems);
                        }
                    },

                    confirm: function (oEvent) {
                        var aSelectedItems = oEvent.getParameter("selectedItems");
                        console.log("Selected items:", aSelectedItems);

                        if (aSelectedItems && aSelectedItems.length > 0) {
                            var oSelectedItem = aSelectedItems[0]; // Only one item since multiSelect is false
                            var oCtx = oSelectedItem.getBindingContext();

                            if (oCtx) {
                                var sSelectedBusinessNo = oCtx.getProperty("BusinessNo");
                                var sSelectedBusinessName = oCtx.getProperty("BusinessName");

                                console.log("BusinessNo selected:", sSelectedBusinessNo);

                                // Store in sessionStorage if needed
                                try {
                                    sessionStorage.setItem("selectedBusinessNo", sSelectedBusinessNo);
                                } catch (error) {
                                    console.error("Error saving to sessionStorage:", error);
                                }

                                // Close the dialog by calling close() on the TableSelectDialog instance
                                var oDialog = oEvent.getSource();

                                // Navigate using the controller reference
                                oController._navigateToSelectedFGA(sSelectedBusinessNo, sSelectedBusinessName)
                                    .catch(function (error) {
                                        console.error("Error navigating to FGA:", error);
                                        sap.m.MessageBox.error("Erreur lors de la navigation vers le FGA sélectionné");
                                    })
                                    .finally(function () {
                                        // Ensure dialog is closed even if navigation fails
                                        if (oDialog && oDialog.close) {
                                            oDialog.close();
                                        }
                                    });
                            }
                        }
                    },

                    columns: [
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "N°Affaire" })
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Description" })
                        })
                    ]
                });

                // Create and set the model
                var oModel = new sap.ui.model.json.JSONModel({
                    allItems: aData,
                    items: aData
                });
                this._oBusinessNoDialog.setModel(oModel);

                this._oBusinessNoDialog.bindAggregation("items", {
                    path: "/items",
                    template: new sap.m.ColumnListItem({
                        type: "Active",
                        cells: [
                            new sap.m.Text({ text: "{BusinessNo}" }),
                            new sap.m.Text({ text: "{BusinessName}" })
                        ]
                    })
                });

                oView.addDependent(this._oBusinessNoDialog);
                this._oBusinessNoDialog.open();
            },
            _navigateToSelectedFGA: async function (sBusinessNo, sBusinessName) {
                try {
                    const oView = this.getView();
                    const oUtilitiesModel = this.getInterface().getModel("utilities");
                    const oModel = this._getOwnerComponent().getModel();
                    const oNavController = this._getExtensionAPI().getNavigationController();

                    // Get current period from utilities model or context
                    let sCurrentPeriod = oUtilitiesModel.getProperty("/period");

                    // If no period in utilities, get from current context
                    if (!sCurrentPeriod) {
                        const oContext = oView.getBindingContext();
                        if (oContext) {
                            sCurrentPeriod = oContext.getProperty("p_period");
                        }
                    }

                    if (!sCurrentPeriod) {
                        const now = new Date();
                        const month = String(now.getMonth() + 1).padStart(2, "0");
                        const year = String(now.getFullYear());
                        sCurrentPeriod = `${month}${year}`;
                    }

                    console.log("Navigating to FGA:", sBusinessNo, "with period:", sCurrentPeriod);

                    // Set busy indicator
                    this._setBusy(true);

                    const oUIModel = this.base.templateBaseExtension.getView().getModel("ui");
                    const bEditable = oUIModel ? oUIModel.getProperty("/editable") : false;

                    if (bEditable) {
                        const bSaveConfirmed = await new Promise((resolve) => {
                            sap.m.MessageBox.confirm(
                                "Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de naviguer vers un autre FGA?",
                                {
                                    title: "Modifications non sauvegardées",
                                    actions: [
                                        sap.m.MessageBox.Action.YES,
                                        sap.m.MessageBox.Action.NO,
                                        sap.m.MessageBox.Action.CANCEL
                                    ],
                                    onClose: (sAction) => {
                                        if (sAction === sap.m.MessageBox.Action.YES) {
                                            resolve(true);
                                        } else if (sAction === sap.m.MessageBox.Action.NO) {
                                            resolve(false);
                                        } else {
                                            resolve(null);
                                        }
                                    }
                                }
                            );
                        });

                        if (bSaveConfirmed === null) {
                            this._setBusy(false);
                            return;
                        }

                        if (bSaveConfirmed) {
                            try {
                                const result = await this._executeSaveForNavigation();
                                if (!result) {
                                    this._setBusy(false);
                                    return;
                                }
                            } catch (error) {
                                console.error("Error saving before navigation:", error);
                                sap.m.MessageBox.error("Erreur lors de la sauvegarde");
                                this._setBusy(false);
                                return;
                            }
                        } else {
                            this._cleanModification();
                        }
                    }

                    const oNavigationContext = oModel.createEntry("/ZC_FGASet", {
                        properties: {
                            BusinessNo: sBusinessNo,
                            p_period: sCurrentPeriod
                        }
                    });

                    // Update utilities model
                    oUtilitiesModel.setProperty("/period", sCurrentPeriod);
                    oUtilitiesModel.setBusinessNo(sBusinessNo);

                    // Navigate to selected FGA - EXACT same pattern as onPrevPeriod
                    const sKey = `BusinessNo='${sBusinessNo}',p_period='${sCurrentPeriod}'`;
                    const sPath = `/ZC_FGASet(${sKey})`;
                    const oResult = await new Promise((resolve, reject) => {
                        oModel.read(sPath, {
                            success: (oData) => {
                                // Create a binding context from the read data
                                const oBindingContext = new sap.ui.model.Context(oModel, sPath);
                                resolve(oBindingContext);
                            },
                            error: (oError) => reject(oError)
                        });
                    });

                    // Update utilities model with new period
                    oUtilitiesModel.setProperty("/period", sCurrentPeriod);
                    oUtilitiesModel.setBusinessNo(sBusinessNo);

                    await oNavController.navigateInternal(oResult, {
                        navigationMode: "inplace"
                    });

                    await this._refreshNormalModeData(sCurrentPeriod, sBusinessNo);

                    // Update button texts
                    this._styleHeaderButtons();

                    MessageToast.show(`Navigation vers: ${sBusinessNo} - ${this._formatPeriodForDisplay(sCurrentPeriod)}`);

                } catch (error) {
                    console.error("Error navigating to selected FGA:", error);
                    sap.m.MessageBox.error(`Erreur: ${error.message || "Impossible de naviguer vers le FGA sélectionné"}`);
                    throw error;
                } finally {
                    this._setBusy(false);
                }
            },

        });

    });
