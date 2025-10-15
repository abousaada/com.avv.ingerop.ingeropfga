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

            onAfterRendering: function () {
                // Always clear forecast mode when coming back to the list
                this.getView().getModel("utilities").setProperty("/isForecastMode", false);
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
                MessageToast.show("onEMXPress invoked.");
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
                                press: this._onAction2.bind(this)
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
                            semanticObject: "ZEMX",
                            action: "manage"
                        },
                        params: {
                            FGA: aFAGs
                        }
                    });

                    window.open(sHash, "_blank", "noopener,noreferrer");

                    MessageToast.show("onEMXPress invoked.");

                } catch (err) {
                    console.error("Error during navigation:", err);
                }
            },

            _onAction2: function () {
                MessageToast.show("Action 2 executed");
                // Add logic
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

            onPrevPress: function (oEvent) {
                const aSelectedContexts = this.extensionAPI.getSelectedContexts();

                if (aSelectedContexts.length !== 1) {
                    sap.m.MessageToast.show("Veuillez sélectionner une seule ligne pour ouvrir la prévision.");
                    return;
                }

                const oContext = aSelectedContexts[0];

                // Set the mode in the model BEFORE navigation
                this.getView().getModel("utilities").setProperty("/isForecastMode", true);

                // Navigate internally to the Object Page
                this.extensionAPI.getNavigationController().navigateInternal(oContext, {
                    navigationMode: "inplace"
                });
            }



        };
    });