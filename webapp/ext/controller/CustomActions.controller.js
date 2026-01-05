sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog"
], function (MessageToast, ValueHelpDialog) {
    'use strict';

    return {
        onInit: function () {
            this._styleHeaderButtons();
        },

        onPrevPeriod: function (oEvent) {
            MessageToast.show("Previous period");
        },

        onNextPeriod: function (oEvent) {
            MessageToast.show("Next period");
        },

        onSelectFGAPress: function (oEvent) {
            const oView = this.getView();

            if (!this._oFGAVH) {
                this._oFGAVH = new ValueHelpDialog({
                    title: "Select FGA",
                    supportMultiselect: false,
                    key: "FGA",
                    descriptionKey: "Description",
                    ok: (oEvent) => {
                        const aTokens = oEvent.getParameter("tokens");
                        if (aTokens.length) {
                            const sFGA = aTokens[0].getKey();

                            // store selected FGA
                            this.getOwnerComponent()
                                .getModel("settings")
                                .setProperty("/selectedFGA", sFGA);
                        }
                        this._oFGAVH.close();
                    },
                    cancel: () => this._oFGAVH.close()
                });

                this._oFGAVH.setModel(this.getOwnerComponent().getModel());
                //this._oFGAVH.setEntitySet("ZC_FGASet");

                oView.addDependent(this._oFGAVH);
            }

            this._oFGAVH.open();
        },

        _styleHeaderButtons: function () {
            try {
                const oView = this.getView();

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

                    // Common style for all period-related buttons
                    oButton.setType("Transparent");

                    if (sId.includes("prevPeriodBtn")) {
                        // Previous period arrow - place it right before the period label
                        oButton.addStyleClass("fgaPeriodGroupStart");
                        oButton.setIcon("sap-icon://navigation-left-arrow");
                        oButton.setText(""); // Clear any text, use only icon

                    } else if (sId.includes("periodBtn")) {
                        // Period label button - middle button
                        //oButton.setEnabled(false); // Make it non-clickable
                        oButton.addStyleClass("fgaPeriodLabel");

                    } else if (sId.includes("nextPeriodBtn")) {
                        // Next period arrow - place it right after the period label
                        oButton.addStyleClass("fgaPeriodGroupEnd");
                        oButton.setIcon("sap-icon://navigation-right-arrow");
                        oButton.setText(""); // Clear any text, use only icon

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

    }
});
