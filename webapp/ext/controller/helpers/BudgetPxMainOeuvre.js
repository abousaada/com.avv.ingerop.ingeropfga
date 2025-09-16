
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.BudgetPxMainOeuvre", {

        _CONSTANT_DYNAMIC_PREFIX: "MO_",
        _CONSTANT_COLUMN_CONSO: "_CONSO",
        _CONSTANT_COLUMN_REST: "_REST",
        _CONSTANT_COLUMN_BUDGET: "_BUDGET",
        _CONSTANT_COLUMN_ID: "columnId",
        _CONSTANT_MAIN_OEUVRE_TABLE_ID: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxMainOeuvreTreeTableId",

        getUtilitiesModel() {
            return this.oView.getModel("utilities");
        },

        preparePxMainOeuvreTreeData() {
            this.getUtilitiesModel().buildPxMainOeuvreTreeData();
            this.buildMainOeuvreTree();
        },

        reCalcMainOeuvreTable() {
            this.getUtilitiesModel().reCalcMainOeuvreTable();
        },

        buildMainOeuvreTree() {
            this.refreshTableColumns();
        },

        refreshTableColumns() {
            this.removeDynamicColumns();
            this.addDynamicColumns();
        },

        removeDynamicColumns() {
            const mainOeuvreTree = this.oView.byId(this._CONSTANT_MAIN_OEUVRE_TABLE_ID);
            var aColumns = mainOeuvreTree.getColumns();
            for (var i = aColumns.length - 1; i >= 0; i--) {
                if (aColumns[i].data(this._CONSTANT_COLUMN_ID)?.includes(this._CONSTANT_DYNAMIC_PREFIX)) {
                    mainOeuvreTree.removeColumn(aColumns[i]);
                }
            }
        },

        addDynamicColumns() {
            const mainOeuvreTree = this.oView.byId(this._CONSTANT_MAIN_OEUVRE_TABLE_ID);
            const aDynamicColumns = this.getUtilitiesModel().getPxMainOeuvreHeader();
            let index = 8;

            //Jours consommés
            aDynamicColumns.forEach((oColData) => {
                index += 1;
                var oColumn = this._createConsoColumn(oColData[this._CONSTANT_COLUMN_ID], aDynamicColumns.length, oColData);
                mainOeuvreTree.insertColumn(oColumn, index);
            });
            //Jours restants
            aDynamicColumns.forEach((oColData) => {
                index += 1;
                var oColumn = this._createRestColumn(oColData[this._CONSTANT_COLUMN_ID], aDynamicColumns.length, oColData);
                mainOeuvreTree.insertColumn(oColumn, index);
            });

            //A venir
            index += 1;
            var avenirColumn = this._createAvenirColumn("MO_AVENIR");
            mainOeuvreTree.insertColumn(avenirColumn, index);

            //Budget
            aDynamicColumns.forEach((oColData) => {
                index += 1;
                var oColumn = this._createBudgetColumn(oColData[this._CONSTANT_COLUMN_ID], aDynamicColumns.length, oColData);
                mainOeuvreTree.insertColumn(oColumn, index);
            });
            // Fin d'affaire
            index += 1;
            var oColumn = this._createFinAffaireColumn("MO_FIN_AFFAIRE");
            mainOeuvreTree.insertColumn(oColumn, index);
            //Réel
            index += 1;
            var oColumn = this._createReelColumn("MO_REEL");
            mainOeuvreTree.insertColumn(oColumn, index);
            //Physique
            index += 1;
            var oColumn = this._createPhysiqueColumn("MO_physique");
            mainOeuvreTree.insertColumn(oColumn, index);
            //Ecart budgetaire
            index += 1;
            var oColumn = this._createEcartColumn("MO_Ecart");
            mainOeuvreTree.insertColumn(oColumn, index);
        },

        _createConsoColumn(columnId, length, { profilDescription }) {
            const sColumnId = columnId + this._CONSTANT_COLUMN_CONSO;
            return new sap.ui.table.Column({
                headerSpan: length + ",1,1",
                hAlign: "Center",
                multiLabels: [
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.jours.conso}" }),
                    new sap.m.Label({ text: profilDescription }),
                    new sap.m.Label(),
                    new sap.m.Label(),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                path: "utilities>" + sColumnId,
                                type: new sap.ui.model.type.Float({ 
                                    minFractionDigits: 0,
                                    maxFractionDigits: 0,
                                    groupingEnabled: true,
                                })
                            },
                            visible: "{= !!${utilities>isTotal} || !!${utilities>isBudget} }"
                        })
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, sColumnId);
        },

        _createRestColumn(columnId, length, { profilDescription, tjm }) {
            const sColumnId = columnId + this._CONSTANT_COLUMN_REST;
            return new sap.ui.table.Column({
                headerSpan: length + ",1,1",
                hAlign: "Center",
                multiLabels: [
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.jours.rest}" }),
                    new sap.m.Label({ text: profilDescription }),
                    new sap.m.Label({ text: tjm }),
                    new sap.m.Label(),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                path: "utilities>" + sColumnId,
                                type: new sap.ui.model.type.Float({ 
                                    minFractionDigits: 0,
                                    maxFractionDigits: 0,
                                    groupingEnabled: true,
                                })
                            },
                            visible: "{= !!${utilities>isTotal} || !${ui>/editable} }"
                        }),
                        new sap.m.Input({
                            value: {
                                path: "utilities>" + sColumnId,
                                type: new sap.ui.model.type.Float({ 
                                    minFractionDigits: 0,
                                    maxFractionDigits: 0,
                                    groupingEnabled: true,
                                })
                            },
                            visible: "{= ${ui>/editable} && ${utilities>isBudget} }",
                            change: this.onMainOeuvreJoursRestantChange.bind(this)
                        }).data(this._CONSTANT_COLUMN_ID, sColumnId)
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, sColumnId);
        },

        _createAvenirColumn(columnId) {
            const header = this.getUtilitiesModel().getPxMainOeuvreHeader();
            const parts =  [
                {path: "utilities>"},
                ...header.map(({columnId}) => {
                    return {path: "utilities>" + columnId + this._CONSTANT_COLUMN_REST};
                })
            ];

            return new sap.ui.table.Column({
                multiLabels: [
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.avenir}" }),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                parts,
                                formatter: this.formatAvenir.bind(this)
                            },
                            visible: "{= !!${utilities>isTotal} || !!${utilities>isBudget} }"
                        })
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, columnId);
        },

        _createBudgetColumn(columnId, length, { profilDescription }) {
            const sColumnId = columnId + this._CONSTANT_COLUMN_BUDGET;
            return new sap.ui.table.Column({
                headerSpan: length + ",1,1",
                hAlign: "Center",
                multiLabels: [
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.budget}" }),
                    new sap.m.Label({ text: profilDescription }),
                    new sap.m.Label(),
                    new sap.m.Label(),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                parts: [
                                    { path: "utilities>" + columnId + this._CONSTANT_COLUMN_CONSO },
                                    { path: "utilities>" + columnId + this._CONSTANT_COLUMN_REST }
                                ],
                                formatter: function (conso, rest) {
                                    const budget = parseFloat(conso || 0) + parseFloat(rest || 0);
                                    const floatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
                                        groupingEnabled: true,
                                        minFractionDigits: 0,
                                        maxFractionDigits: 0,
                                    });
                                    return floatInstance.format(budget);
                                }.bind(this)
                            },
                            visible: "{= !!${utilities>isTotal} || !!${utilities>isBudget} }"
                        })
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, sColumnId);
        },

        _createFinAffaireColumn(columnId) {
            const header = this.getUtilitiesModel().getPxMainOeuvreHeader();
            const parts =  [
                {path: "utilities>"},
                ...header.map(({columnId}) => {
                    return {path: "utilities>" + columnId + this._CONSTANT_COLUMN_REST};
                })
            ];
            return new sap.ui.table.Column({
                multiLabels: [
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.fin.affaire}" }),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                parts,
                                formatter: this.formatFinAffaire.bind(this)
                            },
                            visible: "{= !!${utilities>isTotal} || !!${utilities>isBudget} }"
                        })
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, columnId);
        },

        _createReelColumn(columnId) {
            const header = this.getUtilitiesModel().getPxMainOeuvreHeader();
            const parts =  [
                {path: "utilities>"},
                ...header.map(({columnId}) => {
                    return {path: "utilities>" + columnId + this._CONSTANT_COLUMN_REST};
                })
            ];
            return new sap.ui.table.Column({
                headerSpan: "3,1,1",
                hAlign: "Center",
                multiLabels: [
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.avancement}" }),
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.real}" }),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                parts,
                                formatter: this.formatReelDisplay.bind(this)
                            },
                            visible: "{= !!${utilities>isTotal} || !!${utilities>isBudget} }"
                        })
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, columnId);
        },

        _createPhysiqueColumn(columnId) {
            return new sap.ui.table.Column({
                headerSpan: "3,1,1",
                hAlign: "Center",
                multiLabels: [
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.avancement}" }),
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.physique}" }),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                path: "utilities>physique",
                                type: new sap.ui.model.type.Float({ 
                                    minFractionDigits: 2,
                                    maxFractionDigits: 2,
                                    groupingEnabled: true,
                                }),
                                formatter: this.formatPhysique.bind(this)
                            },
                            visible: "{= !!${utilities>isTotal} || !${ui>/editable} }"
                        }),
                        new sap.m.Input({
                            value: {
                                path: "utilities>physique",
                                type: new sap.ui.model.type.Float({ 
                                    minFractionDigits: 2,
                                    maxFractionDigits: 2,
                                    groupingEnabled: true,
                                })
                            },
                            visible: "{= ${ui>/editable} && ${utilities>isBudget} }",
                            change: this.onMainOeuvrePhysiqueChange.bind(this)
                        }).data(this._CONSTANT_COLUMN_ID, columnId)
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, columnId);
        },

        _createEcartColumn(columnId) {
            const header = this.getUtilitiesModel().getPxMainOeuvreHeader();
            const parts =  [
                {path: "utilities>"},
                {path: "utilities>physique"},
                ...header.map(({columnId}) => {
                    return {path: "utilities>" + columnId + this._CONSTANT_COLUMN_REST};
                })
            ];
            return new sap.ui.table.Column({
                headerSpan: "3,1,1",
                hAlign: "Center",
                multiLabels: [
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.avancement}" }),
                    new sap.m.Label(),
                    new sap.m.Label(),
                    new sap.m.Label({ text: "{i18n>budget.main.oeuvre.ecart}" }),
                ],
                template: new sap.m.HBox({
                    items: [
                        new sap.m.Text({
                            text: {
                                parts,
                                formatter: this.formatEcart.bind(this)
                            },
                            visible: "{= !!${utilities>isTotal} || !!${utilities>isBudget} }"
                        })
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, columnId);
        },

        onMainOeuvreJoursRestantChange(oEvent) {
            this._refreshRow(oEvent);
            this.getUtilitiesModel().reCalcMainOeuvreTable();
        },

        onMainOeuvrePhysiqueChange(oEvent) {
            this._refreshRow(oEvent);
            this.getUtilitiesModel().reCalcMainOeuvreTable();
        },

        _refreshRow(oEvent){
            const binding = oEvent.getSource().getBindingContext("utilities");
            const row = binding.getObject();
            const path = binding.getPath();
            this.getUtilitiesModel().setProperty(path, row);
        },

        formatAvenir(rowData) {
            if (!rowData) { return; }
            if (!rowData.isBudget && !rowData.isTotal) { return; }
            const header = this.getUtilitiesModel().getPxMainOeuvreHeader();

            if(rowData.isBudget){
                const budget = header.reduce((acc, cur) => {
                    const prop = cur.columnId + this._CONSTANT_COLUMN_REST;
                    return acc + parseFloat(rowData[prop] || 0) * parseFloat(cur.tjm || 0);
                }, 0);
                return this.formatExt(budget);
            }

            if(rowData.isTotal){
                const total = header.reduce((acc, cur) => {
                    const prop = cur.columnId + this._CONSTANT_COLUMN_REST;
                    return acc + parseFloat(rowData[prop] || 0);
                }, 0);
                return this.formatExt(total);
            }
        },

        formatFinAffaire(rowData) {
            if (!rowData) { return; }
            if (!rowData.isBudget && !rowData.isTotal) { return; }
            const finAffaire = parseFloat(this.formatAvenir(rowData)) + parseFloat(rowData.cumul || 0);
            
            return this.formatExt(finAffaire);
        },

        formatReel(rowData) {
            if (!rowData) { return; }
            if (!rowData.isBudget && !rowData.isTotal) { return; }
            const avenir = parseFloat(this.formatAvenir(rowData));
            const cumul = parseFloat(rowData.cumul || 0);
            if(!cumul) { return  0;}
            if(!avenir && !cumul){  return  0;}
           
            return this.formatExt(cumul / (avenir + cumul));
        },

        formatReelDisplay(rowData){
            let reel = this.formatReel(rowData);
            if (!reel) { return; }
            reel = parseFloat(reel);
            return this.formatExt( reel * 100 ) + "%"; 
        },

        formatPhysique(physique){
            if(!physique){ return }
            return this.formatExt(parseFloat(physique)); + "%";
        },

        formatEcart(rowData) {
            if (!rowData) { return; }
            if (!rowData.isBudget && !rowData.isTotal) { return; }
            const reel = parseFloat(this.formatReel(rowData));
            const finAffaire = parseFloat(this.formatFinAffaire(rowData));
            const physique = parseFloat(rowData.physique || 0) / 100;

            const ecart = Math.abs((reel - physique) * finAffaire);
            
            return this.formatExt(ecart);
        },

        formatExt(value){
            return sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 2,
                maxFractionDigits: 2,
            }).format(value);
        }
    });
});

