sap.ui.define([], function () {
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

  return {
    extractPlainData: _extract
  };
});