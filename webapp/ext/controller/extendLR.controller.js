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
        "sap/m/MenuItem"
    ],
    function (ControllerExtension, Dialog, mLibrary, Text, Button, MessageToast, MessageType,
        Menu, MenuItem) {
        "use strict";

        return {

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
                MessageToast.show("Action 2 executed");
                // Add logic
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