sap.ui.define(
    [
        "sap/ui/core/mvc/ControllerExtension",
        "sap/m/Dialog",
        "sap/m/library",
        "sap/m/Text",
        "sap/m/Button",
        "sap/m/MessageToast",
        "sap/ui/core/message/MessageType",
        "sap/m/Menu",
        "sap/m/MenuItem",
        "sap/m/MessageBox",
        "sap/ui/core/Icon",
    ],
    function (ControllerExtension, Dialog, mLibrary, Text, Button, MessageToast, MessageType,
        Menu, MenuItem, MessageBox, Icon) {
        "use strict";
        return {
            override: {

            },

            _loadUserContext: function () {
                const oView = this.getView();
                const oModel = this.getOwnerComponent().getModel();

                if (!oModel) {
                    return;
                }

                oModel.callFunction("/GetUserContext", {
                    method: "GET",
                    success: (oData) => {
                        const bIsAdmin = oData?.GetUserContext.IsAdmin === true;
                        console.log("GetUserContextoData", oData);
                        let oLocal = oView.getModel("local");
                        if (!oLocal) {
                            oLocal = new sap.ui.model.json.JSONModel({
                                isAdmin: false
                            });
                            oView.setModel(oLocal, "local");
                        }

                        oLocal.setProperty("/isAdmin", bIsAdmin);

                        this._applyAdminButtonsVisibility();
                    },
                    error: () => {
                        let oLocal = oView.getModel("local");
                        if (!oLocal) {
                            oLocal = new sap.ui.model.json.JSONModel({
                                isAdmin: false
                            });
                            oView.setModel(oLocal, "local");
                        }

                        oLocal.setProperty("/isAdmin", false);

                        this._applyAdminButtonsVisibility();
                    }
                });
            },

            _applyAdminButtonsVisibility: function () {
                const oLocal = this.getView().getModel("local");
                const bIsAdmin = !!oLocal?.getProperty("/isAdmin");

                const oView = this.getView();

                const aButtons = oView.findAggregatedObjects(true, (oCtrl) =>
                    oCtrl.isA("sap.m.Button") &&
                    (
                        oCtrl.getId().includes("lockMassBtn") ||
                        oCtrl.getId().includes("unLockMassBtn")
                    )
                );

                aButtons.forEach((oBtn) => {
                    oBtn.setVisible(bIsAdmin);
                });

           },

            onBeforeRebindTableExtension: function (oEvent) {
                const oSmartTable = oEvent.getSource();
                const oTable = oSmartTable.getTable();
                if (!oTable) return;

                const aCols = oTable.getColumns();
                const oLockCol = aCols.find(c => {
                    const p13n = c.data && c.data("p13nData");
                    return p13n && p13n.columnKey === "Verrouillage";
                });

                if (oLockCol && !oLockCol.data("__tplDone")) {
                    oLockCol.setWidth("3rem");
                    oLockCol.setTemplate(new sap.ui.core.Icon({
                        src: "{Verrouillage}",
                        tooltip: "{= ${IsLocked} === 'X' ? 'Verrouillée' : 'Déverrouillée' }"
                    }));
                    oLockCol.data("__tplDone", true);
                }
            },

            onInit: function () {
                let oLocal = this.getView().getModel("local");
                if (!oLocal) {
                    oLocal = new sap.ui.model.json.JSONModel({
                        isAdmin: false
                    });
                    this.getView().setModel(oLocal, "local");
                }
                this._loadUserContext();


                const oSmartTable = this.byId("listReport");
                if (!oSmartTable) return;

                oSmartTable.attachInitialise(() => {
                    const oTable = oSmartTable.getTable();
                    if (!oTable) return;

                    // --- sap.m.Table ---
                    if (oTable.setMode && !oTable.__lockMultiPatched) {
                        const fnOrigSetMode = oTable.setMode.bind(oTable);

                        oTable.setMode = function (sMode) {
                            // on force MultiSelect, ignore tout le reste
                            return fnOrigSetMode("MultiSelect");
                        };

                        // applique immédiatement
                        fnOrigSetMode("MultiSelect");

                        oTable.__lockMultiPatched = true;
                    }

                    // --- sap.ui.table.Table / AnalyticalTable ---
                    if (oTable.setSelectionMode && !oTable.__lockMultiPatched) {
                        const fnOrigSetSelectionMode = oTable.setSelectionMode.bind(oTable);
                        const fnOrigSetSelectionBehavior = oTable.setSelectionBehavior
                            ? oTable.setSelectionBehavior.bind(oTable)
                            : null;

                        oTable.setSelectionMode = function () {
                            // on force MultiToggle, ignore tout le reste
                            return fnOrigSetSelectionMode("MultiToggle");
                        };

                        if (fnOrigSetSelectionBehavior) {
                            oTable.setSelectionBehavior = function () {
                                return fnOrigSetSelectionBehavior("RowSelector");
                            };
                        }

                        // applique immédiatement
                        fnOrigSetSelectionMode("MultiToggle");
                        if (fnOrigSetSelectionBehavior) fnOrigSetSelectionBehavior("RowSelector");

                        oTable.__lockMultiPatched = true;
                    }
                });
            },

            onLockMassPress: function () {
                console.log("LockMassPress");
                this._runLockForSelection(true);
            },
            onUnLockMassPress: function () {
                console.log("unLockMassPress");
                this._runLockForSelection(false);
            },
            _runLockForSelection: function (bLock) {
                const oExtApi = this.extensionAPI;
                if (!oExtApi) {
                    MessageBox.error("extensionAPI indisponible.");
                    return;
                }
                const aContexts = oExtApi.getSelectedContexts();
                if (!aContexts || aContexts.length === 0) {
                    MessageToast.show("Sélectionne au moins une ligne.");
                    return;
                }
                const oModel = aContexts[0].getModel();
                const sQ = bLock ? "Verrouiller les FGAs sélectionnées ?" : "Déverrouiller les FGAs sélectionnées ?";
                MessageBox.confirm(sQ, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: (sAction) => {
                        if (sAction !== MessageBox.Action.YES) {
                            return;
                        }
                        oExtApi.securedExecution(async () => {
                            let iOk = 0;
                            let iKo = 0;
                            let sKoExample = "";
                            for (const oCtx of aContexts) {
                                const oObj = oCtx.getObject();
                                const sBusinessNo = oObj && oObj.BusinessNo;
                                if (!sBusinessNo) {
                                    iKo++;
                                    sKoExample = sKoExample || "BusinessNo manquant";
                                    continue;
                                }
                                // ✅ 1 appel à la fois
                                const r = await this._callLockFGA(oModel, sBusinessNo, bLock);
                                if (r.ok) {
                                    iOk++;
                                } else {
                                    iKo++;
                                    sKoExample = sKoExample || r.message;
                                }
                            }
                            if (iKo === 0) {
                                MessageToast.show(`${iOk} FGA ${bLock ? "verrouillée(s)" : "déverrouillée(s)"}`);
                            } else {
                                MessageBox.warning(`${iOk} OK, ${iKo} KO.\nEx: ${sKoExample}`);
                            }
                            oExtApi.refreshTable();
                        }, { busy: { set: true, check: false } });
                    }
                });

            },
            _callLockFGA: function (oModel, sBusinessNo, bLock) {
                var that = this;
                return new Promise((resolve) => {
                    oModel.callFunction("/LockFGA", {
                        method: "POST",
                        urlParameters: {
                            BusinessNo: sBusinessNo,
                            IsLocked: bLock
                        },
                        success: function (oData) {
                            const r = oData && (oData.LockFGA || oData.d?.LockFGA || oData.d || oData);
                            const ok = !!(r && r.Success);
                            resolve({ ok, businessNo: sBusinessNo, message: (r && r.Message) || (ok ? "OK" : "KO") });
                            console.log("Retour lock:", oData);
                        },
                        error: function (oErr) {
                            resolve({ ok: false, businessNo: sBusinessNo, message: (oErr && (oErr.message || oErr.statusText)) || "Erreur OData" });
                        }
                    });
                });

            },



            _getSelectedContexts1: function (oTable) {
                // sap.m.Table
                if (oTable.getSelectedContexts) {
                    return oTable.getSelectedContexts();
                }
                // sap.ui.table.Table
                if (oTable.getSelectedIndices && oTable.getContextByIndex) {
                    const aIdx = oTable.getSelectedIndices();
                    return aIdx
                        .map(i => oTable.getContextByIndex(i))
                        .filter(Boolean);
                }
                return [];
            },

            _getSelectedContexts: function (oTable) {
                // cas sap.ui.table.Table avec plugin
                const aPlugins = oTable.getPlugins ? oTable.getPlugins() : [];
                const oSelPlugin = aPlugins && aPlugins.find(p => p && p.getSelectedIndices); // SelectionPlugin

                if (oSelPlugin) {
                    const aIdx = oSelPlugin.getSelectedIndices();
                    return aIdx
                        .map(i => oTable.getContextByIndex(i))
                        .filter(Boolean);
                }

                // fallback si pas de plugin (rare)
                if (oTable.getSelectedIndices) {
                    return oTable.getSelectedIndices()
                        .map(i => oTable.getContextByIndex(i))
                        .filter(Boolean);
                }

                // sap.m.Table
                if (oTable.getSelectedItems) {
                    return oTable.getSelectedItems()
                        .map(item => item.getBindingContext())
                        .filter(Boolean);
                }

                return [];
            },


            _clearSelection: function (oTable) {
                if (oTable.removeSelections) {
                    oTable.removeSelections(true);
                } else if (oTable.clearSelection) {
                    oTable.clearSelection();
                }
            },

            onSTIPress: function (oEvent) {
                try {
                    var aFAGs = this.getSelectedBusinessNumbers();
                    const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    const sHash = oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "ZSTI",
                            action: "manage"
                        },
                        params: {
                            business_no_e: aFAGs
                            //id_formulaire: "0000000006"
                        }
                    });
                    // Open the app in a new tab
                    window.open(sHash, "_blank", "noopener,noreferrer");
                    MessageToast.show("onSTIPress invoked.");
                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },
            onEMXPress: function (oEvent) {
                // MessageToast.show("onEMXPress invoked.");
                if (!this._oMenu) {
                    this._oMenu = new Menu({
                        items: [
                            new MenuItem({
                                text: "Manage EMA",
                                icon: "sap-icon://pie-chart",
                                press: this._onAction1.bind(this)
                            }),
                            new MenuItem({
                                text: "Manage EMU",
                                icon: "sap-icon://pie-chart",
                                press: this._onAction2.bind(this)
                            }),
                            new MenuItem({
                                text: "Manage EMP",
                                icon: "sap-icon://pie-chart",
                                press: this._onAction3.bind(this)
                            }),
                            new MenuItem({
                                text: "Manage EMSP",
                                icon: "sap-icon://pie-chart",
                                press: this._onAction4.bind(this)
                            }),
                            new MenuItem({
                                text: "Export",
                                icon: "sap-icon://download",
                                items: [
                                    new MenuItem({
                                        text: "Excel",
                                        press: this._onExportExcel.bind(this)
                                    }),
                                    new MenuItem({
                                        text: "PDF",
                                        press: this._onExportPDF.bind(this)
                                    })
                                ]
                            })
                        ]
                    });
                    this.getView().addDependent(this._oMenu);
                }
                // Open menu
                this._oMenu.openBy(oEvent.getSource());
            },
            _onAction1: function () {
                try {
                    const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    var aFAGs = this.getSelectedBusinessNumbers();
                    const sHash = oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "ZEMA",
                            action: "display"
                        }
                        // ,params: {
                        //     FGA: aFAGs
                        // }
                    });
                    window.open(sHash, "_blank", "noopener,noreferrer");
                    // MessageToast.show("onEMXPress invoked.");
                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },
            _onAction2: function () {
                try {
                    const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    var aFAGs = this.getSelectedBusinessNumbers();
                    const sHash = oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "ZEMU",
                            action: "display"
                        }
                        // ,params: {
                        //     FGA: aFAGs
                        // }
                    });
                    window.open(sHash, "_blank", "noopener,noreferrer");
                    // MessageToast.show("onEMXPress invoked.");
                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },
            _onAction3: function () {
                try {
                    const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    var aFAGs = this.getSelectedBusinessNumbers();
                    const sHash = oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "ZEMP",
                            action: "display"
                        }
                        // ,params: {
                        //     FGA: aFAGs
                        // }
                    });
                    window.open(sHash, "_blank", "noopener,noreferrer");
                    // MessageToast.show("onEMXPress invoked.");
                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },
            _onAction4: function () {
                try {
                    const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    var aFAGs = this.getSelectedBusinessNumbers();
                    const sHash = oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "ZEMSP",
                            action: "display"
                        }
                    });
                    window.open(sHash, "_blank", "noopener,noreferrer");
                    // MessageToast.show("onEMXPress invoked.");
                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },
            _onExportExcel: function () {
                var aSelected = this.extensionAPI.getSelectedContexts();
                MessageToast.show(`Exporting ${aSelected.length} items to Excel`);
                // Add export logic
            },
            _onExportPDF: function () {
                var aSelected = this.extensionAPI.getSelectedContexts();
                MessageToast.show(`Exporting ${aSelected.length} items to PDF`);
                // Add export logic
            },

            getSelectedBusinessNumbers: function () {
                var oSmartTable = this.oView.byId("listReport");
                var oInnerTable = oSmartTable.getTable();
                var oPlugin = oInnerTable.getPlugins()[0];
                if (!oPlugin || !oPlugin.getSelectedIndices) {
                    return [];
                }
                var aIndices = oPlugin.getSelectedIndices();
                if (!aIndices.length) {
                    sap.m.MessageToast.show("Please select at least one item.");
                    return [];
                }
                var aSelectedContexts = aIndices.map(function (iIndex) {
                    return oInnerTable.getContextByIndex(iIndex);
                });
                return aSelectedContexts.map(function (oContext) {
                    return oContext.getObject().BusinessNo;
                });
            },

            onPrevPress: async function () {
                const oView = this.getView();
                const oModel = oView.getModel();
                const oUtilitiesModel = oView.getModel("utilities");
                const oNavController = this.extensionAPI.getNavigationController();
                //const period = oUtilitiesModel.getProperty("/period");
                const oPeriodControl = oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ListReport.view.ListReport::ZC_FGASet--listReportFilter-filterItemControlA_-_Parameter.p_period");
                let period;
                if (oPeriodControl) {
                    period = oPeriodControl.getValue();
                    oUtilitiesModel.setProperty("/period", period);
                }
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
                sessionStorage.setItem("isForecastMode", "true");
                // Clean previous tree data
                oUtilitiesModel.setProperty("/previsionelHierarchyWithTotals", []);
                const oTable = this.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--PrevisionnelTreeTable");
                if (oTable && oTable.getBinding("rows")) {
                    oTable.getBinding("rows").refresh(true);
                }

                const aSelectedContexts = this.extensionAPI.getSelectedContexts();
                let oNavigationContext;
                if (aSelectedContexts.length === 1) {
                    oNavigationContext = aSelectedContexts[0];
                    const aSelectedBusinessNos = aSelectedContexts.map(ctx => ctx.getProperty("BusinessNo"));
                    sessionStorage.setItem("selectedBusinessNos", JSON.stringify(aSelectedBusinessNos));
                    console.log("Navigating to selected BusinessNo:", aSelectedBusinessNos[0]);
                }
                else if (aSelectedContexts.length > 0) {
                    const aSelectedBusinessNos = aSelectedContexts.map(ctx => ctx.getProperty("BusinessNo"));
                    sessionStorage.setItem("selectedBusinessNos", JSON.stringify(aSelectedBusinessNos));
                    oNavigationContext = oContext;
                    console.log("Navigating to selected BusinessNo:", aSelectedBusinessNos[0]);
                } else {
                    console.log("No items selected — navigating to forecast (all data)");
                    oNavigationContext = oContext;
                    sessionStorage.removeItem("selectedBusinessNos");
                }
                try {
                    await oNavController.navigateInternal(oNavigationContext, { navigationMode: "inplace" });
                } catch (error) {
                    console.error("Error navigating to forecast page:", error);
                }
            }

        };
    });
