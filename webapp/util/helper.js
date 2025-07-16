sap.ui.define([
  "sap/m/MessageBox",
  "./constant",
  "./param"
], function (MessageBox, Constant, Params) {
  "use strict";

  function _extract(obj) {
    if (obj === null) {
      return undefined; // Exclure les nulls
    }
  
    if (obj instanceof Date) {
      return obj; // Conserver les objets Date
    }
  
    if (typeof obj !== 'object') {
      return obj; // Conserver les primitifs (string, number, etc.)
    }
  
    if (Array.isArray(obj)) {
      // Nettoyer les éléments du tableau, puis filtrer ceux qui ne sont pas undefined
      return obj
        .map(_extract)
        .filter(item => item !== undefined);
    }
  
    const cleanObj = {};
  
    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        !key.startsWith("__") &&           // Ignore SAPUI5 metadata keys
        key !== "_metadata" &&             // Ignore OData _metadata
        typeof obj[key] !== "function"     // Ignore functions
      ) {
        const cleanedValue = _extract(obj[key]);
        if (cleanedValue !== undefined) {
          cleanObj[key] = cleanedValue;
        }
      }
    }
  
    return cleanObj;
  }

  function _getConstantMode(mode){
    return mode ? "create": "modify";
  }

  return {
    extractPlainData: _extract,
    getConstantMode: _getConstantMode,

    pipe: function (...fns) {
      return (x, ...args) => fns.reduce((v, f) => f(v, ...args), x);
    },
    getTabVisibilityByMode:function(mode){
      return Object.entries(Params.headerSectionList).map(([section, sectionData]) => {
        return {key: sectionData.key, visible: sectionData.visible[_getConstantMode(mode)]};
      });
    },
    getFieldVisibilityByMode:function(mode){
      return Object.entries(Params.headerFieldsList).map(([field, {identifier, visible}]) => {
        return {identifier, field, visible: visible[_getConstantMode(mode)]};
      });
    },
    getFieldEnabledByMode:function(mode){
      return Object.entries(Params.headerFieldsList).map(([field, {identifier, enabled}]) => {
        return {identifier, field, enabled: enabled[_getConstantMode(mode)]};
      });
    },
    getFieldMandatoryByType(type){
      return Object.entries(Params.headerFieldsList).map(([field, {identifier, mandatory}]) => {
        return {identifier, field, mandatory: mandatory.type.includes(type)};
      });
    },
    getDefaultFieldMandatory(){
      return Object.entries(Params.headerFieldsList)
      .map(([field, {identifier, mandatory}]) => {
        return {identifier, field, mandatory: mandatory.default};
      });
    },
    getHeaderFieldList(){
      return Object.entries(Params.headerFieldsList).map(([field, {identifier}]) => {
        return {identifier, field};
      });
    },
    getFieldActionList(){
      return Object.entries(Params.headerFieldsList)
                    .filter(([field, {action}]) => { return action != null; })
                    .map(([field, {identifier, action}]) => { return {identifier, field, action}; });
    },
    validMessage: function(message, oView, onClose){
      return MessageBox.success(message, {
				actions: [MessageBox.Action.CLOSE],
				onClose,
				dependentOn: oView
			});
    },
    errorMessage: function(message){
      return MessageBox.error(message);
    },
    headerFieldIdBySectionAndFieldName: function(identifiant, champ){
      if(!identifiant || !champ){ return ;}
      return `com.avv.ingerop.ingeropfga::sap.suite.ui.generic.template.ObjectPage.view.Details::ZC_FGASet--com.sap.vocabularies.UI.v1.FieldGroup::${identifiant}::${champ}::Field`;
    },
    diffEnMois: function(date1, date2) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
    
      const anneeDiff = d2.getFullYear() - d1.getFullYear();
      const moisDiff = d2.getMonth() - d1.getMonth();
    
      return anneeDiff * 12 + moisDiff;
    }
  };
});