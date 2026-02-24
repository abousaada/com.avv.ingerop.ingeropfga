
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.BudgetPxSubContracting", {

        _CONSTANT_DYNAMIC_PREFIX: "SC_",
        _CONSTANT_COLUMN_ID: "columnId",
        _CONSTANT_EXT_CONTRACTOR_TABLE_ID: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSubContractingTreeTableId",
        _CONSTANT_STF_TABLE_ID: "com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--budgets--BudgetPxSTFilialeGroupeTableId",
        _CONSTANT_SUBCONTRACTOR_ID: "subContractorId",
        _CONSTANT_SUBCONTRACTOR_PARTNER: "subContractorPartner",

        getUtilitiesModel() {
            return this.oView.getModel("utilities");
        },

        preparePxSubContractingTreeData() {
            this.getUtilitiesModel().buildPxSubContractingTreeData();
            this.buildPxSTExtTree();
        },

        // preparePxSTGTreeData(){
        //     this.getUtilitiesModel().buildPxSubContractingTreeData();
        //     this.buildPxSTGTree();
        // },

        buildPxSTExtTree() {
            this.refreshExternalTableColumns();
        },

        // buildPxSTGTree(){
        //     this.removeFilialeDynamicColumns();
        //     this.addFilialeDynamicColumns();
        // },

        refreshExternalTableColumns() {
            this.removeExternalDynamicColumns();
            this.addExternalDynamicColumns();
        },

        removeExternalDynamicColumns() {
            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            var aColumns = SubContractingTree.getColumns();
            for (var i = aColumns.length - 1; i >= 0; i--) {
                if (aColumns[i].data(this._CONSTANT_COLUMN_ID)?.includes(this._CONSTANT_DYNAMIC_PREFIX)) {
                    SubContractingTree.removeColumn(aColumns[i]);
                    aColumns[i].destroy();
                }
            }
        },

        onExternalBudgetChange(oEvent) {
            try {
                const { columnId } = oEvent.getSource().data();
                this.reCalcExternalColumnTotalById(columnId);
            } catch (error) {
                console.log(error);
            }
        },

        // onFilialeBudgetChange(oEvent) {
        //     try {
        //         const { columnId } = oEvent.getSource().data();
        //         this.reCalcFilialeColumnTotalById(columnId);
        //     } catch (error) {
        //         console.log(error);
        //     }
        // },

        // reCalcRowTotal(source) {
        //     const binding = source.getBindingContext("utilities");
        //     const bindingObject = binding.getObject();
        //     const newRow = this.calcNewTotalFinAffaire(bindingObject);
        //     const sPath = binding.getPath();
        //     const utilitiesModel = this.getUtilitiesModel();
        //     utilitiesModel.setProperty(sPath, { ...newRow });
        // },

        reCalcExternalColumnTotalById(columnId) {

            const [root] = this.getUtilitiesModel().getPxSubContractingHierarchy();
            const groupement = root.children.slice(0, -4);
            const globalTotal = root.children.at(-4);
            let cumulTotal = root.children.at(-3);
            const percentTotal = root.children.at(-2);
            const radTotal = root.children.at(-1);

            const props = [columnId, "budgetHorsFrais", "budgetYCFrais"];

            props.forEach(prop => { globalTotal[prop] = 0 });

            // 1. Recalculer chaque total de groupement
            for (const group of groupement) {
                if (!group.isGroupe || !Array.isArray(group.children)) continue;

                const oldBudgets = group.children.slice(0, -1);
                const newBudgets = oldBudgets.map(budget => this.calcNewExternalTotalFinAffaire(budget));
                const totalLine = group.children.at(-1);
                if (!totalLine) continue;

                // Réinitialisation ciblée
                props.forEach(prop => { totalLine[prop] = 0 });

                for (const child of newBudgets) {

                    props.forEach(prop => {
                        totalLine[prop] += child[prop] || 0;
                        globalTotal[prop] += child[prop] || 0;
                    });

                }
                group.children = [...newBudgets, totalLine];
            }

            cumulTotal = this.calcNewExternalTotalFinAffaire(cumulTotal);

            props.forEach(prop => {
                percentTotal[prop] = (globalTotal[prop] ?? 0) > 0 ? ((cumulTotal[prop] ?? 0) / globalTotal[prop]) : 0;
                radTotal[prop] = (globalTotal[prop] ?? 0) - (cumulTotal[prop] ?? 0);
            });

            root.children = [...groupement, globalTotal, cumulTotal, percentTotal, radTotal];

            this.getUtilitiesModel().setPxSubContractingHierarchy([root]);
        },

        calcNewExternalTotalFinAffaire(rowData) {
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

        isFiliale(subContractorPartner) {
            return subContractorPartner ? "Filiale" : "Externe";
        },

        getCoef(subContractorPartner) {
            return subContractorPartner ? subContractorPartner : 1;
        },

        navToGLAccount(oEvent) {
            var oItem = oEvent.getSource().getBindingContext("utilities").getObject();

            var sColumnId = oEvent.getSource().data("columnId"); // from BudgetPx view

            // Determine which GLAccount to show based on the clicked column
            var sGLAccount = "0068000010";

            var period = this.oView.getModel("utilities").getPeriod();

            try {

                const oLink = oEvent.getSource();

                // 2. Get GL Accounts
                const oContext = oLink.getBindingContext("utilities");
                const oData = oContext.getObject();

                const glAccounts = sGLAccount
                    ? sGLAccount.split(";").map(a => a.trim()).filter(a => a.length > 0)
                    : [];

                if (glAccounts.length === 0) {
                    sap.m.MessageToast.show("GLAccount non disponible.");
                    return;
                }

                // 3. Get Date range
                const month = period.substring(0, 2);
                const year = period.substring(2);

                // 4. Get missions
                let missions = [];
                try {
                    missions = oLink.getModel('utilities').getMissions();

                } catch (error) {
                    console.error("Failed to fetch missions:", error);
                    throw error;
                }

                const wbsElements = [oData.business_no];
                if (missions && missions.length > 0) {
                    // Add missions to the WBS elements array
                    wbsElements.push(...missions.map(mission => mission.MissionId));
                }

                // 5. Create navigation
                /*const oComponent = sap.ui.core.Component.getOwnerComponentFor(this.oView);
                const oAppStateService = sap.ushell.Container.getService("AppState");
                const oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();

                const oAppState = await oAppStateService.createEmptyAppState(oComponent);
                oAppState.setData(oSelectionVariant.toJSONString());
                await oAppState.save();

                const sAppStateKey = oAppState.getKey();*/
                const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

                // Construct the URL parameters
                /*var params = {
                    FiscalYearPeriod: `${year}0${month}`,
                    GLAccount: glAccounts,
                    WBSElementExternalID: wbsElements
                };*/

                const fiscalPeriods = [];
                for (let m = 1; m <= month; m++) {
                    fiscalPeriods.push(`${year}0${m.toString().padStart(2, "0")}`);

                }

                var params = {
                    //FiscalYearPeriod: `${year}0${month}`,
                    FiscalYearPeriod: fiscalPeriods,
                    GLAccount: glAccounts,
                    WBSElementExternalID: wbsElements
                };

                // Get the base URL for the target app
                const sHash = oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "GLAccount",
                        action: "displayGLLineItemReportingView"
                    },
                    params: Object.fromEntries(
                        Object.entries(params).map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return [key, value.map(v => encodeURIComponent(v))];
                            }
                            return [key, encodeURIComponent(value)];
                        })
                    )
                });

                // Open in new window
                window.open(sHash, "_blank", "noopener,noreferrer");

                /*
                        // Convert params to URL string
                        const sParams = Object.entries(params)
                            .map(([key, value]) => {
                                if (Array.isArray(value)) {
                                    return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
                                }
                                return `${key}=${encodeURIComponent(value)}`;
                            })
                            .join('&');
        
                        // Get the base URL for the target app
                        const sHash = oCrossAppNavigator.hrefForExternal({
                            target: {
                                semanticObject: "GLAccount",
                                action: "displayGLLineItemReportingView"
                            }
                        });
        
                        // Get the FLP base URL
                        const sBaseUrl = window.location.origin + window.location.pathname;
        
                        // Construct the full URL
                        const sUrl = `${sBaseUrl}#${sHash}&${sParams}`;
        
                        // Open in new window
                        window.open(sUrl, "_blank", "noopener,noreferrer");*/

            } catch (err) {
                console.error("Error during navigation:", err);
            }
        },

        isFloat(input) {
            const normalized = input.trim().replace(',', '.');
            // Regex : entier ou float avec max 2 décimales
            const regex = /^-?\d+(\.\d{1,2})?$/;
            return regex.test(normalized);
        },

        async onChangeSubContractor(oEvent) {
            try {
                const { columnId } = oEvent.getSource().data()
                const newContractor = await this.getExternalId();
                const newSupplierData = await this.getUtilitiesModel()
                    .getBESupplierById({ SupplierNo: newContractor, isFiliale: false });
                this.changeColumnContractorBydId(newSupplierData, columnId);
                // this.addNewContractorById(newSupplierData);
                return;
            } catch (error) {
                console.log(error);
            }
        },

        changeColumnContractorBydId(supplierData, columnId) {
            const oldPxSubContractingHeader = this.getUtilitiesModel().getPxSubContractingHeader();
            const filterSubContractingHeader = oldPxSubContractingHeader.filter(contractor => contractor.columnId != columnId);
            this.getUtilitiesModel().setPxSubContractingHeader([...filterSubContractingHeader, supplierData]);

            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            const [selectedColumn] = SubContractingTree.getColumns().filter(column => column.data.columnId === columnId);
            if (selectedColumn) {
                selectedColumn.data("columnId", supplierData.columnId);
            }
            this.reCalcExternalColumnTotalById(columnId);
        },

        //External Supplier

        //call from Object Page
        async addNewExternal() {
            try {
                const newContractor = await this.getExternalId();
                const newSupplierData = await this.getUtilitiesModel()
                    .getBESupplierById({ SupplierNo: newContractor, isFiliale: false });
                this.addNewExternalById(newSupplierData);
                return;
            } catch (error) {
                console.log(error);
            }
        },

        onExternalCoefChange(oEvent) {
            const newValue = oEvent.getParameter("newValue");
            const oSource = oEvent.getSource();
            if (this.isFloat(newValue)) {
                const subContractorCoef = Number.parseFloat(newValue);

                // interdit inférieure à 1
                if (subContractorCoef < 1) {
                    oSource.setValueState("Error");
                    oSource.setValueStateText("Valeur inférieure à 1 interdite");
                    oSource.setValue("1");
                    return;
                }

                const columnHeader = this.getUtilitiesModel().getPxSubContractingHeader();
                const { columnId } = oEvent.getSource().data();
                const newHeader = columnHeader.map(h => {
                    if (h.columnId === columnId) { return { ...h, subContractorCoef }; }
                    return h;
                });
                this.getUtilitiesModel().setPxSubContractingHeader(newHeader);
                this.reCalcExternalColumnTotalById(columnId);
            }
        },

        // get External Id from Value help
        async getExternalId() {
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
                oVHD.getTable().bindRows("/ZI_External_Supplier_VH");
                oVHD.open();
            });
        },

        // insert external supplier into external supplier header
        _addNewExternalToHeader(newSupplier) {
            const { columnId } = newSupplier;
            const oldPxSubContractingHeader = this.getUtilitiesModel().getPxSubContractingHeader();
            const filterSubContractingHeader = oldPxSubContractingHeader.filter(contractor => contractor.columnId != columnId);
            this.getUtilitiesModel().setPxSubContractingHeader([...filterSubContractingHeader, newSupplier]);
        },

        // add new external id into external headers & build new column
        addNewExternalById(supplierData) {
            const { subContractorId } = supplierData;

            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            const aColumns = SubContractingTree.getColumns();

            const columnId = `${this._CONSTANT_DYNAMIC_PREFIX}${subContractorId}`;
            const newSupplierData = { ...supplierData, columnId };

            this._addNewExternalToHeader(newSupplierData);
            const oColumn = this._createExternalColumn(columnId, newSupplierData);
            SubContractingTree.insertColumn(oColumn, aColumns.length - 2);
        },

        _createExternalColumn: function (sColumnId, { subContractorName, subContractorId, subContractorCoef, hasBudget, columnId }) {
            return new sap.ui.table.Column({
                multiLabels: [
                    new sap.m.Label({ text: subContractorName }),
                    new sap.m.HBox({
                        items: [
                            new sap.m.Text({
                                text: subContractorId,
                                visible: hasBudget ? hasBudget : "{= !${ui>/editable} }",
                            }),
                            new sap.m.Input({
                                value: subContractorId,
                                showValueHelp: true,
                                valueHelpOnly: true,
                                visible: hasBudget ? !hasBudget : "{ui>/editable}",

                                valueHelpRequest: this.onChangeSubContractor.bind(this)
                            })
                        ]
                    }),
                    // new sap.m.Label({ text: "{i18n>budget.ext.external}" }),
                    // new sap.m.Label({ text: "" }),
                    new sap.m.HBox({
                        items: [
                            new sap.m.Text({
                                text: subContractorCoef,
                                visible: "{= !${ui>/editable} }",
                            }),
                            new sap.m.Input({
                                value: subContractorCoef,
                                visible: "{ui>/editable}",
                                change: this.onExternalCoefChange.bind(this)
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
                                formatter: function (total = 0, percent) {

                                    const formatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
                                        groupingEnabled: true,
                                        minFractionDigits: 2,
                                        maxFractionDigits: 2,
                                    });

                                    const formattedTotal = formatInstance.format(total);

                                    return percent ? formattedTotal + "%" : formattedTotal;
                                }
                            },
                            visible: "{= !!${utilities>isTotal} && !${utilities>isCumul} }"
                        }),
                        new sap.m.Input({
                            value: {
                                path: "utilities>" + columnId,
                                type: new sap.ui.model.type.Float({ minFractionDigits: 2 })
                            },
                            editable: "{= ${ui>/editable} && ${utilities>isBudget} }",
                            visible: "{= !!${utilities>isBudget} }",
                            change: this.onExternalBudgetChange.bind(this)
                        }).data(this._CONSTANT_COLUMN_ID, sColumnId),
                        new sap.m.Link({
                            visible: "{= !!${utilities>isTotal} && !!${utilities>isCumul} }",
                            press: this.navToGLAccount.bind(this),
                            text: {
                                path: "utilities>" + columnId,
                                type: new sap.ui.model.type.Float({ minFractionDigits: 2 })
                            }
                        }).data(this._CONSTANT_COLUMN_ID, subContractorId)
                    ]
                }),
                width: "8rem"
            }).data(this._CONSTANT_COLUMN_ID, sColumnId);
        },

        addExternalDynamicColumns() {
            const SubContractingTree = this.oView.byId(this._CONSTANT_EXT_CONTRACTOR_TABLE_ID);
            const aDynamicColumns = this.getUtilitiesModel().getPxSubContractingHeader();

            aDynamicColumns.forEach((oColData, idx) => {
                var oColumn = this._createExternalColumn(oColData.columnId, oColData);
                SubContractingTree.insertColumn(oColumn, 6 + idx);
            });
        },

        //Filiale Functions

        //call from Object Page
        // async addNewFiliale() {
        //     try {
        //         const newContractor = await this.getFilialeId();
        //         const newSupplierData = await this.getUtilitiesModel()
        //                                           .getBESupplierById({ SupplierNo : newContractor, isFiliale: true }); 
        //         this.addNewFilialeById(newSupplierData);
        //         return;
        //     } catch (error) {
        //         console.log(error);
        //     }
        // },

        //get Filiale with Value Help
        // async getFilialeId() {
        //     return new Promise((resolve, reject) => {
        //         // ValueHelpDialog
        //         var oVHD = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
        //             supportMultiselect: false,
        //             key: "Supplier",
        //             descriptionKey: "SupplierName",
        //             title: "Select a Supplier",
        //             ok: function (oEvt) {
        //                 var aTokens = oEvt.getParameter("tokens");
        //                 if (aTokens.length) { resolve(aTokens[0].getKey()); }
        //                 oVHD.close();
        //             }.bind(this),
        //             cancel: function () {
        //                 reject();
        //                 oVHD.close();
        //             }
        //         });

        //         // Table interne
        //         const tableBinding = [
        //             { label: "ID", template: "Supplier" },
        //             { label: "Name", template: "SupplierName" }
        //         ];

        //         tableBinding.map(({ label, template }) =>
        //             oVHD.getTable().addColumn(new sap.ui.table.Column({
        //                 label: new sap.m.Label({ text: label }),
        //                 template: new sap.m.Text({ text: `{${template}}` })
        //             }))
        //         );
        //         // Binding sur I_SUPPLIER_VH (la ValueHelp CDS)
        //         oVHD.getTable().setModel(this.oView.getModel());
        //         oVHD.getTable().bindRows("/ZI_Filiale_Supplier_VH");
        //         oVHD.open();
        //     });
        // },

        // insert new filiale into the array of filiale & build the new filiale column
        // addNewFilialeById(supplierData) {
        //     const { subContractorId } = supplierData;

        //     const SubContractingTree = this.oView.byId(this._CONSTANT_STF_TABLE_ID);
        //     const aColumns = SubContractingTree.getColumns();

        //     const columnId = `${this._CONSTANT_DYNAMIC_PREFIX}${subContractorId}`;
        //     const newSupplierData = { ...supplierData, columnId };

        //     this._addNewFilialeToHeader(newSupplierData);
        //     const oColumn = this._createFilialeColumn(columnId, newSupplierData);
        //     SubContractingTree.insertColumn(oColumn, aColumns.length - 2);
        // },

        // insert filiale in array of filiale
        // _addNewFilialeToHeader(newSupplier) {
        //     const { columnId } = newSupplier;
        //     const oldPxSubContractingHeader = this.getUtilitiesModel().getPxSTFHeader();
        //     const filterSubContractingHeader = oldPxSubContractingHeader.filter(contractor => contractor.columnId != columnId);
        //     this.getUtilitiesModel().setPxSTFHeader([...filterSubContractingHeader, newSupplier]);
        // },

        // onFilialeCoefChange(oEvent) {
        //     const newValue = oEvent.getParameter("newValue");
        //     if (this.isFloat(newValue)) {
        //         const subContractorCoef = Number.parseFloat(newValue);
        //         const columnHeader = this.getUtilitiesModel().getPxSTFHeader();
        //         const { columnId } = oEvent.getSource().data();
        //         const newHeader = columnHeader.map(h => {
        //             if (h.columnId === columnId) { return { ...h, subContractorCoef }; }
        //             return h;
        //         });
        //         this.getUtilitiesModel().setPxSTFHeader(newHeader);
        //         this.reCalcColumnTotalById(columnId);
        //     }
        // },

        // _createFilialeColumn: function (sColumnId, { subContractorName, subContractorId, subContractorCoef, subContractorPartner, columnId }) {
        //     return new sap.ui.table.Column({
        //         multiLabels: [
        //             new sap.m.Label({ text: subContractorName }),
        //             new sap.m.HBox({
        //                 items: [
        //                     new sap.m.Text({
        //                         text: subContractorId,
        //                         visible: "{= !${ui>/editable} }",
        //                     }),
        //                     new sap.m.Input({
        //                         value: subContractorId,
        //                         showValueHelp: true,
        //                         valueHelpOnly: true,
        //                         visible: "{ui>/editable}",
        //                         valueHelpRequest: this.onChangeSubContractor.bind(this)
        //                     })
        //                 ]
        //             }),
        //             new sap.m.Label({ text: this.isFiliale(subContractorPartner) }),
        //             new sap.m.HBox({
        //                 items: [
        //                     new sap.m.Text({
        //                         text: subContractorCoef,
        //                         visible: "{= !${ui>/editable} }",
        //                     }),
        //                     new sap.m.Input({
        //                         value: subContractorCoef,
        //                         visible: "{ui>/editable}",
        //                         change: this.onFilialeCoefChange.bind(this)
        //                     }).data(this._CONSTANT_COLUMN_ID, sColumnId)
        //                 ]
        //             }),
        //             new sap.m.Label({ text: "{i18n>budget.ext.budget}" })
        //         ],
        //         template: new sap.m.HBox({
        //             items: [
        //                 new sap.m.Text({
        //                     text: {
        //                         parts: [
        //                             { path: "utilities>" + columnId },
        //                             { path: "utilities>isPercent" }
        //                         ],
        //                         formatter: function (total=0, percent) {
        //                             const formatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
        //                                 groupingEnabled: true,
        //                                 minFractionDigits: 2,
        //                                 maxFractionDigits: 2,
        //                             });

        //                             const formattedTotal = formatInstance.format(total);
        //                             return percent ? formattedTotal + "%" : formattedTotal;
        //                         }
        //                     },
        //                     visible: "{= !!${utilities>isTotal} && !${utilities>isCumul} }"
        //                 }),
        //                 new sap.m.Input({
        //                     value: {
        //                         path: "utilities>" + columnId,
        //                         type: new sap.ui.model.type.Float({ minFractionDigits: 2 })
        //                     },
        //                     editable: "{= ${ui>/editable} && ${utilities>isBudget} }",
        //                     visible: "{= !!${utilities>isBudget} }",
        //                     change: this.onFilialeBudgetChange.bind(this)
        //                 }).data(this._CONSTANT_COLUMN_ID, sColumnId),
        //                 new sap.m.Link({
        //                     visible: "{= !!${utilities>isTotal} && !!${utilities>isCumul} }",
        //                     press: this.navToGLAccount.bind(this),
        //                     text: {
        //                         path: "utilities>" + columnId,
        //                         type: new sap.ui.model.type.Float({ minFractionDigits: 2 })
        //                     }
        //                 }).data(this._CONSTANT_COLUMN_ID, subContractorId)
        //             ]
        //         }),
        //         width: "8rem"
        //     }).data(this._CONSTANT_COLUMN_ID, sColumnId);
        // },

        // addFilialeDynamicColumns() {
        //     const SubContractingTree = this.oView.byId(this._CONSTANT_STF_TABLE_ID);
        //     const aDynamicColumns = this.getUtilitiesModel().getPxSTFHeader();

        //     aDynamicColumns.forEach((oColData, idx) => {
        //         var oColumn = this._createFilialeColumn(oColData.columnId, oColData);
        //         SubContractingTree.insertColumn(oColumn, 6 + idx);
        //     });
        // },
    });
});

