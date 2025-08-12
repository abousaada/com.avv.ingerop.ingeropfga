
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../../../util/helper",
    "../../../util/formatter"
], function (Controller, Helper, Formatter) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.ExtendOPUiManage", {
        
        _setFieldByType(type){
            this._setMandatoryFieldByType(type);
            this._setVisibleFieldByType(type);
            // this._setVisibleFieldByType("Z0");
        },

        _setOPView(context) {
            this._setTabsVisible();
            // this._setFieldVisible();
            this._attachChangeEventOnFields();
            this._setFieldEnabled();
            this._setFieldDefaultValue(context);
        },

        _setFieldDefaultValue(context){
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            const model = this.oView.getModel();
            const path = context.getPath();
            Helper.getFieldDefaultValueByMode(isCreateMode).map(
                ({ identifier, field, defaultValue }) => {
                    const propertyPath = "/" + field
                    const fieldValue = context.getProperty(propertyPath);
                    if(!fieldValue && defaultValue) {
                        model.setProperty(path + propertyPath , defaultValue);
                    }
                });
        },

        _setTabsVisible() {
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            Helper.getTabVisibilityByMode(isCreateMode).map(({ key, visible }) => {
                this.oView.byId(key)?.setVisible(visible)
            });
        },

        _setProjectFieldVisible(){
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            if(!isCreateMode){
                Helper.getProjectHeaderFieldList().map(
                    ({ identifier, field, visible }) => {
                        this._getField(identifier, field)?.setVisible(visible);
                    }
                );
            }
        },

        _setFieldVisible() {
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            Helper.getFieldVisibilityByMode(isCreateMode).map(
                ({ identifier, field, visible }) => {
                    this._getField(identifier, field)?.setVisible(visible);
                }
            );
        },

        _setFieldEnabled() {
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            Helper.getFieldEnabledByMode(isCreateMode).map(({ identifier, field, enabled }) => {
                this._getField(identifier, field)?.setEditable(enabled);
            });

            this._getField("Facturation", "VAT")?.setUomEditable(false);
            this._getField("Travaux", "Ingtrvx")?.setUomEditable(false);
        },

        _getField(identifiant, champ) {
            return this.oView.byId(Helper.headerFieldIdBySectionAndFieldName(identifiant, champ));
        },

        _attachChangeEventOnFields() {
            Helper.getFieldActionList().map(({ identifier, field, action }) => {
                this.oView.byId(Helper.headerFieldIdBySectionAndFieldName(identifier, field)).attachChange(this[action].bind(this));
            });
        },

        _setInputState() {
            Helper.getHeaderFieldList().map(({ identifier, field }) => {
                const champ = this._getField(identifier, field);
                champ?.bindProperty("valueState", { path: field, formatter: Formatter.validMandatoryField(champ) });
            });
        },

        onActivityChange(oEvent) {
            this._getField("Identification", "Soufam").setValue(null);
        },

        onDateChange(oEvent) {
            const { StartDate, EndDate } = this.oView.getBindingContext().getObject();
            let diffFromNow = null, diff = null;

            if (EndDate) { diffFromNow = Helper.diffEnMois(new Date(), EndDate); }
            this._getField("Duree", "RemainingMonth").setValue(diffFromNow);

            if (StartDate && EndDate) { diff = Helper.diffEnMois(StartDate, EndDate); }
            this._getField("Duree", "NbOfMonth").setValue(diff);
        },

        onCalcTauxTravaux(oEvent) {
            //need refactoring
            const { Mttrvx, Mtctr } = this.oView.getBindingContext().getObject();
            if (Mttrvx == undefined || Mtctr == undefined
                || Mttrvx == null || Mtctr == null
                || Mttrvx == 0 || Mtctr == 0) {
                this._getField("Travaux", "Ingtrvx").setValue("0");
                return;
            }
            const ing = parseFloat(Mtctr);
            const trav = parseFloat(Mttrvx);
            const diff = Math.round(ing / trav * 100);
            this._getField("Travaux", "Ingtrvx").setValue(diff.toString());
        },

        _resetDefaultValueByType(type) {
            Helper.getDefaultNAValueByType(type).map(
                ({identifier, field, value}) => this._getField(identifier, field).setValue(value)
            );
        },

        onTypeChange(event) {
            const newValue = event.getParameter("newValue");
            this._setMandatoryFieldByType(newValue);
            this._resetDefaultValueByType(newValue);
        },

        async onBpChange(oEvent) {
            const newValue = oEvent.getParameter("newValue");
            if (newValue) {
                const utilities = this.oView.getModel("utilities");
                const { Name1, Siret, Country, Secteur } = await utilities.getBEClientById(newValue);
                this._getField("Client", "CustomerName").setValue(Name1);
                this._getField("Client", "Siret").setValue(Siret);
                this._getField("Client", "Country").setValue(Country);
                this._getField("Client", "Scclt").setValue(Secteur);
            } else {
                this._getField("Client", "CustomerName").setValue(null);
                this._getField("Client", "Siret").setValue(null);
                this._getField("Client", "Country").setValue(null);
                this._getField("Client", "Scclt").setValue(Country);
            }
        },

        async onCDGChange(oEvent) {
            const newValue = oEvent.getParameter("newValue");
            if (newValue) {
                const utilities = this.oView.getModel("utilities");
                const { CompanyCode, CompanyName } = await utilities.getBECompanyByProfitCenter(newValue);
                this._getField("Identification", "CompanyCode").setValue(CompanyCode);
            } else {
                this._getField("Identification", "CompanyCode").setValue(null);
            }
        },

        _setMandatoryFieldByType(type) {
            const types = Helper.getBusinessTypes();
            if (!type || !types.includes(type)) {
                Helper.getDefaultFieldMandatory().map(({ identifier, field, mandatory }) => {
                    this._getField(identifier, field)?.setMandatory(mandatory);
                });
                return;
            }
            Helper.getFieldMandatoryByType(type).map(({ identifier, field, mandatory }) => {
                this._getField(identifier, field)?.setMandatory(mandatory);
            });
        },

        _setVisibleFieldByType(type){
            if(type === "Z0" || type === "Z1"){
                this._setProjectFieldVisible();
            }else{
                this._setFieldVisible();
            }
        }

    });
});

