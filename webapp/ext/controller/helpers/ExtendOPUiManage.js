
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../../../util/helper",
    "../../../util/formatter"
], function (Controller, Helper, Formatter ) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.helpers.ExtendOPUiManage", {
        
        _setOPView(){
            this._setTabsVisible();
            this._setFieldVisible();
            this._attachChangeEventOnFields();
            this._setFieldEnabled();
        },

        _setTabsVisible() {
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            Helper.getTabVisibilityByMode(isCreateMode).map(({ key, visible }) => {
                this.oView.byId(key)?.setVisible(visible)
            });
        },

        _setFieldVisible() {
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            Helper.getFieldVisibilityByMode(isCreateMode).map(
                ({ idntifier, field, visible }) => {
                    this._getField(idntifier, field)?.setVisible(visible);
                }
            );
        },

        _setFieldEnabled() {
            const isCreateMode = this.oView.getModel("ui").getProperty("/createMode");
            Helper.getFieldEnabledByMode(isCreateMode).map(({ identifier, field, enabled }) => { 
                this._getField(identifier, field)?.setEditable(enabled); 
            });
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
            const diff = ing / trav;
            this._getField("Travaux", "Ingtrvx").setValue(diff.toString());
        },

        onTypeChange(event) {
            const newValue = event.getParameter("newValue");
            this._setMandatoryFieldByType(newValue);
        },

        _setMandatoryFieldByType(type) {
            if(!type){
                Helper.getDefaultFieldMandatory().map(({identifier, field, mandatory}) => {
                    this._getField(identifier, field)?.setMandatory(mandatory);
                });
                return ;
            }
            Helper.getFieldMandatoryByType(type).map(({identifier, field, mandatory}) => {
                this._getField(identifier, field)?.setMandatory(mandatory);
            });
        },

    });
});

