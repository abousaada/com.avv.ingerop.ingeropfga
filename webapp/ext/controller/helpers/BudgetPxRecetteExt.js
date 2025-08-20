
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.BudgetPxRecetteExt", {

        _CONSTANT_DYNAMIC_PREFIX: "SC_",
        _CONSTANT_COLUMN_ID: "columnId",
        _CONSTANT_EXT_CONTRACTOR_TABLE_ID: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSubContractingTreeTableId",
        _CONSTANT_SUBCONTRACTOR_ID: "subContractorId",
        _CONSTANT_SUBCONTRACTOR_PARTNER: "subContractorPartner",

        getUtilitiesModel() {
            return this.oView.getModel("utilities");
        },

        preparePxRecetteExtTreeData() {
            this.getUtilitiesModel().buildPxRecetteExtTreeData();
            // this.buildRecetteExtTree();
        },

        reCalcRecetteTable(){
            this.getUtilitiesModel().reCalcRecetteTable();
        }

    });
});

