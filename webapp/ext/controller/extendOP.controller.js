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
        Synthese
    ) {
        "use strict";
        var PROJET_TYPE = null;
        return ControllerExtension.extend("com.avv.ingerop.ingeropfga.ext.controller.extendOP", {
            Formatter: Formatter,
            // Override or add custom methods here

            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {
                /**
                * Called when a controller is instantiated and its View controls (if available) are already created.
                * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time       initialization.
                * @memberOf sap.fe.cap.customer.ext.controller.PassengerOPExtend
                */

                onInit: async function () {
                    this._getOwnerComponent().getModel("utilities").setView(this.getView());

                    this._getExtensionAPI().attachPageDataLoaded(this._onObjectExtMatched.bind(this));

                    this._getExtensionAPI().getTransactionController().attachAfterCancel(this._resetViewSetUp.bind(this));

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

                    window.addEventListener("popstate", this._cleanModification.bind(this));
                    window.addEventListener("onbeforeunload", this._cleanModification.bind(this));

                    
                    this._resetRecapMerge      = this._resetRecapMerge.bind(this);
                    this._styleMergedRecapRow  = this._styleMergedRecapRow.bind(this);

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

                        if (!this.getModel("utilities").validDataBeforeSave(oView)) {
                            sap.m.MessageBox.error("Veuillez Vérifier tous les champs");
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
                                "to_BudgetPxMainOeuvre": formattedMainOeuvre,
                            });

                            try {
                                oPayload.VAT = oPayload.VAT ? oPayload.VAT.toString() : oPayload.VAT;
                                const updatedFGA = await utilitiesModel.deepUpsertFGA(oPayload);
                                this._setBusy(false);
                                if (updatedFGA) {
                                    Helper.validMessage("FGA updated: " + updatedFGA.BusinessNo, this.getView(), this.onNavBack.bind(this));
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
                },
            },

            _cleanModification() {
                const oModel = this.getInterface().getView().getModel();
                const mPendingChanges = oModel.getPendingChanges();
                // Parcours des entités modifiées
                Object.keys(mPendingChanges).forEach(function (sPath) {
                    oModel.resetChanges([`/${sPath}`]);
                });
                oModel.refresh(true);
            },

            _resetViewSetUp(){
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

            async _getTabsData() {
                try {
                    const data = await this.getInterface().getModel("utilities").getBEDatas();
                    return data;
                } catch (error) {
                    console.log(error);
                }
            },

            _setBusy(busy) {
                this.getInterface().getView().setBusy(busy);
            },

            _onObjectExtMatched: async function (e) {
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
                        const tabData = await this._getTabsData();

                        //2. Display Different Fragments Based on Company Code Country
                        const sCountry = e.context.getProperty("CompanyCountry");

                        if (sCountry === "FR") {
                            this._loadFragment("Missions");
                        } else {
                            this._loadFragment("hoai");
                        }

                    } catch (error) {
                        console.logs(error);
                    }
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
                    this.preparePxSubContractingTreeData();
                    this.preparePxRecetteExtTreeData();
                    this.preparePxMainOeuvreTreeData();
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
                if (!this._budgetPxRecetteExt) {
                    this._budgetPxRecetteExt = new BudgetPxRecetteExt();
                    this._budgetPxRecetteExt.oView = this.oView;
                }

                this._budgetPxRecetteExt.reCalcMainOeuvreTable();
            },

            preparePxMainOeuvreTreeData: function () {
                this._budgetMainOeuvre.preparePxMainOeuvreTreeData();
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
                        ["ecart n", { header: "pinkHeader", body: "pinkColumn" }],
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
                        if (anegativeCols.has(sLabel)) {
                            aBodyCells.forEach(cell => {
                                const val = this.parseCellNumber(cell.textContent);
                                const oTextElem = cell.querySelector(".sapMText, .sapMLnk");
                                if (!isNaN(val) && val < 0) {
                                    //cell.classList.add("negativeValue");
                                    oTextElem.classList.add("negativeValue");
                                } else {
                                    //cell.classList.remove("negativeValue");
                                    oTextElem.classList.remove("negativeValue");
                                }
                            });
                        }
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

                // retire nos styles sur TOUTES les lignes rendues
                jQuery(dom).find('.sapUiTableTr:not(.sapUiTableHeaderRow)').each(function () {
                    const $tr = jQuery(this);
                    const $cells = $tr.find('td[data-sap-ui-colid]');
                    $cells.each((_, td) => {
                    td.style.background = "";
                    const inner = td.querySelector(".sapMText, .sapMLnk");
                    if (inner) {
                        inner.style.visibility = "";
                        inner.style.color = "";
                        inner.style.fontWeight = "";
                        inner.style.textAlign = "";
                    }
                    });
                });
            },

            _styleMergedRecapRow: function () {
                const oTable   = this.oView.byId("idRecapTable");
                const oBinding = oTable && oTable.getBinding("rows");
                if (!oBinding) return;

                // on ne garde que les lignes rendues qui ont un vrai contexte (ignore les lignes de remplissage)
                const aRowsWithCtx = oTable.getRows().filter(r => !!r.getBindingContext("utilities"));
                if (aRowsWithCtx.length < 2) {
                    setTimeout(() => this._styleMergedRecapRow(), 50);
                    return;
                }

                // repère l'index de la colonne "Cumul N-1"
                const norm = s => (s || "").trim().toLowerCase();
                let idxCumulN1 = -1;
                oTable.getColumns().forEach((c, i) => {
                    const t = c.getLabel && c.getLabel().getText && c.getLabel().getText();
                    if (norm(t) === "cumul n-1") idxCumulN1 = i;
                });
                if (idxCumulN1 < 1) idxCumulN1 = 3; // fallback raisonnable

                // textes selon type de projet
                const txtBefore = (PROJET_TYPE === "Z0") ? "[SFGP] Impact super projet ajustement"
                                : (PROJET_TYPE === "Z1") ? "[SFGP] Impact projet ajustement"
                                : "[SFGP] Impact projet ajustement";
                const txtLast   = (PROJET_TYPE === "Z0") ? "[SFGP] Impact super projet PAT"
                                : (PROJET_TYPE === "Z1") ? "[SFGP] Impact projet PAT"
                                : "[SFGP] Impact projet PAT";

                // ------------------------------------------------------------------
                // Helper : applique la fusion VISUELLE (fond bleu + overlay centré)
                // ------------------------------------------------------------------
                const paintRow = (oRow, labelText) => {
                    const $row = oRow.$();
                    if (!$row.length) return;

                    // toutes les cellules de la ligne (fixe + scroll sont renvoyées ensemble par jQuery ici)
                    const $cells = $row.find('td[data-sap-ui-colid]');
                    if (!$cells.length) { setTimeout(() => this._styleMergedRecapRow(), 50); return; }

                    // 0) reset minimal (retire un éventuel overlay précédent)
                    $row.find('.sfgpOverlay').remove();
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

                    // 1) peint en bleu toutes les cellules 0..idxCumulN1 et cache leur contenu (sauf la première)
                    $cells.each((i, td) => {
                    if (i <= idxCumulN1) {
                        td.style.background = "#333399";
                        const inner = td.querySelector(".sapMText, .sapMLnk");
                        if (inner) inner.style.visibility = (i === 0) ? "" : "hidden";
                    }
                    });

                    // 2) calcule la largeur totale du bloc fusionné (somme des largeurs des cellules 0..idxCumulN1)
                    let totalW = 0;
                    for (let i = 0; i <= idxCumulN1 && i < $cells.length; i++) {
                    const td = $cells.get(i);
                    const w  = td.getBoundingClientRect().width;
                    totalW  += (isFinite(w) ? w : 0);
                    }
                    if (totalW <= 0) { setTimeout(() => this._styleMergedRecapRow(), 50); return; }

                    // 3) pose un overlay centré qui couvre visuellement toutes ces colonnes
                    const td0 = $cells.get(0);
                    td0.style.position = "relative";
                    td0.style.overflow = "visible";

                    const overlay = document.createElement("div");
                    overlay.className = "sfgpOverlay";
                    overlay.textContent = labelText;

                    Object.assign(overlay.style, {
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: totalW + "px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    backgroundColor: "#333399",
                    pointerEvents: "none", // pour ne pas gêner les interactions éventuelles
                    zIndex: 2
                    });

                    td0.appendChild(overlay);
                };

                const rBefore = aRowsWithCtx[aRowsWithCtx.length - 2];
                const rLast   = aRowsWithCtx[aRowsWithCtx.length - 1];

                paintRow(rBefore, txtBefore);
                paintRow(rLast,   txtLast);
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
            // Table Design  BudgetPXSub Cont Budgets Section !!!!
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

            }

        });

    });
