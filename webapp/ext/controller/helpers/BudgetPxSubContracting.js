
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.BudgetPxSubContracting", {
        preparePxSubContractingTreeData(){
            this.oView.getModel("utilities").buildPxSubContractingTreeData();
            this.buildPxSubContractingTree();
        },

        buildPxSubContractingTree(){
            this.refreshTableColumns();
        },
        refreshTableColumns(){
            this.removeDynamicColumns();
            this.addDynamicColumns();
        },

        removeDynamicColumns(){
            const SubContractingTree = this.oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSubContractingTreeTableId");
            var aColumns = SubContractingTree.getColumns();
            for (var i = aColumns.length - 1; i >= 0; i--) {
                if (aColumns[i].data("columnId")?.includes("dynamic_")) {
                    SubContractingTree.removeColumn(aColumns[i]);
                }
            }
        },

        addDynamicColumns(){
            const SubContractingTree = this.oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSubContractingTreeTableId");
            const aDynamicColumns = this.oView.getModel("utilities").getPxSubContractingHeader();
            
            aDynamicColumns.forEach((oColData, idx) => {
                var oColumn = this._createColumn("dynamic_" + oColData.columnId, oColData);
                SubContractingTree.insertColumn(oColumn, 6 + idx);
            });
        },

        isFiliale(subContractorPartner){
            return subContractorPartner ? "Filiale" : "Externe";
        },

        getCoef(subContractorPartner){
            return subContractorPartner ? subContractorPartner : 1;
        },

        _createColumn: function(sColumnId, { subContractorName, subContractorId, subContractorPartner, columnId }) {
            return new sap.ui.table.Column({
                multiLabels: [
                    new sap.m.Label({ text: subContractorName }),
                    new sap.m.Input({ value: subContractorId, editable:"{ui>/editable}" }),
                    new sap.m.Label({ text: this.isFiliale(subContractorPartner) }),
                    new sap.m.Input({ value: this.getCoef(subContractorPartner), editable:"{ui>/editable}" }),
                    new sap.m.Label({ text: "{i18n>budget.ext.budget}" })
                ],
                template: new sap.m.Input({ 
                    value: `{utilities>${columnId}}`, 
                    editable:"{= ${ui>/editable} && ${utilities>isBudget} }", 
                    visible:"{= ${utilities>isBudget} || ${utilities>isTotal} }" }),
                // sortProperty: columnId,
                // filterProperty: columnId,
                width: "6rem"
            }).data("columnId", sColumnId);
        },

        addNewContractor(){
            const SubContractingTree = this.oView.byId("com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSubContractingTreeTableId");
            const aColumns = SubContractingTree.getColumns();
            const oColumn = new sap.ui.table.Column({
                multiLabels: [
                    new sap.m.Label(),
                    new sap.m.Input({ editable:"{ui>/editable}" }),
                    new sap.m.Label(),
                    new sap.m.Input({ editable:"{ui>/editable}" }),
                    new sap.m.Label({ text: "{i18n>budget.ext.budget}" })
                ],
                template: new sap.m.Input({
                    editable:"{= ${ui>/editable} && ${utilities>isBudget} }", 
                    visible:"{= ${utilities>isBudget} || ${utilities>isTotal} }" }),
                width: "6rem"
            }).data("columnId", "dynamic_tmp");
            SubContractingTree.insertColumn(oColumn, aColumns.length - 2);
        }

    });
});

