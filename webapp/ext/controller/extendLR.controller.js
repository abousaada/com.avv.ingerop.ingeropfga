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
                MessageToast.show("onSTIPress invoked.");
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
                MessageToast.show("Action 1 executed");
                // Add logic
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
        };

 
    });