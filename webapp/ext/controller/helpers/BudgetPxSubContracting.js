
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.BudgetPxSubContracting", {

        _CONSTANT_DYNAMIC_PREFIX: "SC_",
        _CONSTANT_COLUMN_ID: "columnId",
        _CONSTANT_EXT_CONTRACTOR_TABLE_ID: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSubContractingTreeTableId",
        _CONSTANT_SUBCONTRACTOR_ID: "subContractorId",
        _CONSTANT_SUBCONTRACTOR_PARTNER: "subContractorPartner",

        getUtilitiesModel() {
            return this.oView.getModel("utilities");
        },

        preparePxSubContractingTreeData() {
            this.getUtilitiesModel().buildPxSubContractingTreeData();
            this.buildPxSubContractingTree();
        },

        buildPxSubContractingTree() {
            this.refreshTableColumns();
        },

        refreshTableColumns() {
            this.removeDynamicColumns();
            this.addDynamicColumns();
        },

        removeDynamicColumns() {
            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            var aColumns = SubContractingTree.getColumns();
            for (var i = aColumns.length - 1; i >= 0; i--) {
                if (aColumns[i].data(this._CONSTANT_COLUMN_ID)?.includes(this._CONSTANT_DYNAMIC_PREFIX)) {
                    SubContractingTree.removeColumn(aColumns[i]);
                }
            }
        },

        onContractorBudgetChange(oEvent) {
            try {
                const { columnId } = oEvent.getSource().data();
                this.reCalcColumnTotalById(columnId);
            } catch (error) {
                console.log(error);
            }
        },

        reCalcRowTotal(source) {
            const binding = source.getBindingContext("utilities");
            const bindingObject = binding.getObject();
            const newRow = this.calcNewTotalFinAffaire(bindingObject);
            const sPath = binding.getPath();
            const utilitiesModel = this.getUtilitiesModel();
            utilitiesModel.setProperty(sPath, { ...newRow });
        },

        reCalcColumnTotalById(columnId) {
            // const columnId = this._CONSTANT_DYNAMIC_PREFIX + subContractorId;
            const [root]  = this.getUtilitiesModel().getPxSubContractingHierarchy();
            const groupement = root.children.slice(0, -4);
            const globalTotal = root.children.at(-4);
            const cumulTotal = root.children.at(-3);
            const percentTotal = root.children.at(-2);
            const radTotal = root.children.at(-1);

            globalTotal[columnId] = 0;
            globalTotal["budgetHorsFrais"] = 0;
            globalTotal["budgetYCFrais"] = 0;
            
            // 1. Recalculer chaque total de groupement
            for (const group of groupement) {
                if (!group.isGroupe || !Array.isArray(group.children)) continue;

                const oldBudgets = group.children.slice(0, -1);
                const newBudgets = oldBudgets.map(budget => this.calcNewTotalFinAffaire(budget));
                const totalLine = group.children.at(-1);
                if (!totalLine) continue;

                // Réinitialisation ciblée
                totalLine[columnId] = 0;
                totalLine["budgetHorsFrais"] = 0;
                totalLine["budgetYCFrais"] = 0;

                for (const child of newBudgets) {
                    totalLine[columnId] += child[columnId] || 0;
                    totalLine["budgetHorsFrais"] += child["budgetHorsFrais"] || 0;
                    totalLine["budgetYCFrais"] += child["budgetYCFrais"] || 0;

                    globalTotal[columnId] += child[columnId] || 0;
                    globalTotal["budgetHorsFrais"] += child["budgetHorsFrais"] || 0;
                    globalTotal["budgetYCFrais"] += child["budgetYCFrais"] || 0;
                }
                group.children = [...newBudgets, totalLine];
            }

            // cumulTotal[columnId]            = globalTotal[columnId] * 0.1;
            // cumulTotal["budgetHorsFrais"]   = globalTotal["budgetHorsFrais"] * 0.1;
            // cumulTotal["budgetYCFrais"]     = globalTotal["budgetYCFrais"] * 0.1;
            cumulTotal = this.calcNewTotalFinAffaire(cumulTotal);

            percentTotal[columnId]          = globalTotal[columnId] > 0 ? ( cumulTotal[columnId] / globalTotal[columnId] ) : 0 ;
            percentTotal["budgetHorsFrais"] = globalTotal["budgetHorsFrais"] > 0 ? ( cumulTotal["budgetHorsFrais"] / globalTotal["budgetHorsFrais"] ) : 0;
            percentTotal["budgetYCFrais"]   = globalTotal["budgetYCFrais"] > 0 ? ( cumulTotal["budgetYCFrais"] / globalTotal["budgetYCFrais"] ) : 0;

            radTotal[columnId]          = globalTotal[columnId] - cumulTotal[columnId];
            radTotal["budgetHorsFrais"] = globalTotal["budgetHorsFrais"] - cumulTotal["budgetHorsFrais"];
            radTotal["budgetYCFrais"]   = globalTotal["budgetYCFrais"] - cumulTotal["budgetYCFrais"];

            root.children = [...groupement, globalTotal, cumulTotal, percentTotal, radTotal];

            this.getUtilitiesModel().setPxSubContractingHierarchy([root]);
        },

        calcNewTotalFinAffaire(rowData) {
            const columnHeaders = this.getUtilitiesModel().getPxSubContractingHeader();

            const coefByColumnId = columnHeaders.reduce((map, header) => {
                map[header.columnId] = header.subContractorCoef;
                return map;
            }, {});

            const { budgetYCFrais, budgetHorsFrais } = Object.entries(rowData).reduce(
                (som, [key, value]) => {
                    if (!key.startsWith(this._CONSTANT_DYNAMIC_PREFIX)) { return som; }
                    const coef = coefByColumnId[key] ?? 1;

                    return {
                        budgetHorsFrais: som.budgetHorsFrais + value,
                        budgetYCFrais: som.budgetYCFrais + value * coef
                    };
                },
                { budgetHorsFrais: 0, budgetYCFrais: 0 }
            );

            return { ...rowData, budgetHorsFrais, budgetYCFrais }
        },

        addDynamicColumns() {
            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            const aDynamicColumns = this.getUtilitiesModel().getPxSubContractingHeader();

            aDynamicColumns.forEach((oColData, idx) => {
                var oColumn = this._createColumn(oColData.columnId, oColData);
                SubContractingTree.insertColumn(oColumn, 6 + idx);
            });
        },

        isFiliale(subContractorPartner) {
            return subContractorPartner ? "Filiale" : "Externe";
        },

        getCoef(subContractorPartner) {
            return subContractorPartner ? subContractorPartner : 1;
        },

        isFloat(input){
            const normalized = input.trim().replace(',', '.');
            // Regex : entier ou float avec max 2 décimales
            const regex = /^-?\d+(\.\d{1,2})?$/;
            return regex.test(normalized);
        },

        onCoefChange(oEvent){
            const newValue = oEvent.getParameter("newValue");
            if(this.isFloat(newValue)){
                const subContractorCoef = Number.parseFloat(newValue);
                const columnHeader = this.getUtilitiesModel().getPxSubContractingHeader();
                const { columnId } = oEvent.getSource().data();
                const newHeader = columnHeader.map(h => {
                    if(h.columnId === columnId){ return {...h, subContractorCoef }; }
                    return h;
                });
                this.getUtilitiesModel().setPxSubContractingHeader(newHeader);
                this.reCalcColumnTotalById(columnId);
            }
        },

        async onChangeSubContractor(oEvent){
            try {
                const { columnId } = oEvent.getSource().data()
                const newContractor = await this.getNewContractorId();
                const newSupplierData = await this.getUtilitiesModel().getBESupplierById(newContractor);
                this.changeColumnContractorBydId(newSupplierData, columnId);
                // this.addNewContractorById(newSupplierData);
                return;
            } catch (error) {
                console.log(error);
            }
        },

        _createColumn: function (sColumnId, { subContractorName, subContractorId, subContractorCoef, subContractorPartner, columnId }) {
            return new sap.ui.table.Column({
                multiLabels: [
                    new sap.m.Label({ text: subContractorName }),
                    new sap.m.HBox({
                        items: [
                            new sap.m.Text({
                                text: subContractorId,
                                visible: "{= !${ui>/editable} }",
                            }),
                            new sap.m.Input({ 
                                value: subContractorId, 
                                showValueHelp: true,
                                valueHelpOnly: true,
                                visible: "{ui>/editable}",
                                valueHelpRequest: this.onChangeSubContractor.bind(this)
                            })
                        ]
                    }),
                    new sap.m.Label({ text: this.isFiliale(subContractorPartner) }),
                    new sap.m.HBox({
                        items: [
                            new sap.m.Text({
                                text: subContractorCoef,
                                visible: "{= !${ui>/editable} }",
                            }),
                            new sap.m.Input({
                                value: subContractorCoef, 
                                visible: "{ui>/editable}" ,
                                change: this.onCoefChange.bind(this)
                            }).data(this._CONSTANT_COLUMN_ID, sColumnId)
                        ]
                    }),
                    new sap.m.Label({ text: "{i18n>budget.ext.budget}" })
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                parts: [
                                    { path: "utilities>" + columnId },
                                    { path: "utilities>isPercent" }
                                ],
                                formatter: function(total, percent) {
                                    return percent ? total + "%": total;
                                }
                            },
                            visible: "{= !!${utilities>isTotal} }"
                        }),
                        new sap.m.Input({
                            value: {
                                path: "utilities>" + columnId,
                                type: new sap.ui.model.type.Float({ minFractionDigits: 2 })
                            },
                            editable: "{= ${ui>/editable} && ${utilities>isBudget} }",
                            visible: "{= !!${utilities>isBudget} }",
                            change: this.onContractorBudgetChange.bind(this)
                        }).data(this._CONSTANT_COLUMN_ID, sColumnId)
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, sColumnId);
        },

        async getNewContractorId() {
            return new Promise((resolve, reject) => {
                // ValueHelpDialog
                var oVHD = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    supportMultiselect: false,
                    key: "Supplier",
                    descriptionKey: "SupplierName",
                    title: "Select a Supplier",
                    ok: function (oEvt) {
                        var aTokens = oEvt.getParameter("tokens");
                        if (aTokens.length) { resolve(aTokens[0].getKey()); }
                        oVHD.close();
                    }.bind(this),
                    cancel: function () {
                        reject();
                        oVHD.close();
                    }
                });

                // Table interne
                const tableBinding = [
                    { label: "ID", template: "Supplier" },
                    { label: "Name", template: "SupplierName" }
                ];

                tableBinding.map(({ label, template }) =>
                    oVHD.getTable().addColumn(new sap.ui.table.Column({
                        label: new sap.m.Label({ text: label }),
                        template: new sap.m.Text({ text: `{${template}}` })
                    }))
                );
                // Binding sur I_SUPPLIER_VH (la ValueHelp CDS)
                oVHD.getTable().setModel(this.oView.getModel());
                oVHD.getTable().bindRows("/I_Supplier_VH");
                oVHD.open();
            });
        },

        _addNewSupplierToHeader(newSupplier) {
            const { columnId } = newSupplier;
            const oldPxSubContractingHeader = this.getUtilitiesModel().getPxSubContractingHeader();
            const filterSubContractingHeader = oldPxSubContractingHeader.filter(contractor => contractor.columnId != columnId);
            this.getUtilitiesModel().setPxSubContractingHeader([...filterSubContractingHeader, newSupplier]);
        },

        addNewContractorById(supplierData) {
            const { subContractorId } = supplierData;

            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            const aColumns = SubContractingTree.getColumns();

            const columnId = `${this._CONSTANT_DYNAMIC_PREFIX}${subContractorId}`;
            const newSupplierData = { ...supplierData, columnId };

            this._addNewSupplierToHeader(newSupplierData);
            const oColumn = this._createColumn(columnId, newSupplierData);
            SubContractingTree.insertColumn(oColumn, aColumns.length - 2);
        },

        changeColumnContractorBydId(supplierData, columnId){
            const oldPxSubContractingHeader = this.getUtilitiesModel().getPxSubContractingHeader();
            const filterSubContractingHeader = oldPxSubContractingHeader.filter(contractor => contractor.columnId != columnId);
            this.getUtilitiesModel().setPxSubContractingHeader([...filterSubContractingHeader, supplierData]);
            
            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            const [selectedColumn] = SubContractingTree.getColumns().filter(column => column.data.columnId === columnId );
            if(selectedColumn){
                selectedColumn.data("columnId", supplierData.columnId);
            }
            this.reCalcColumnTotalById(columnId);
        },

        async addNewContractor() {
            try {
                const newContractor = await this.getNewContractorId();
                const newSupplierData = await this.getUtilitiesModel().getBESupplierById(newContractor);
                this.addNewContractorById(newSupplierData);
                return;
            } catch (error) {
                console.log(error);
            }
        }
    });
});

