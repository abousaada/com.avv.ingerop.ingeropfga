sap.ui.define([], function () {
  "use strict";

  function _extract(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj; // Primitif ou null
    }

    if (Array.isArray(obj)) {
      return obj.map(_extract); // Recurse on array
    }

    const cleanObj = {};

    for (const key in obj) {
      if (
        !key.startsWith("__") &&           // Ignore SAPUI5 metadata keys
        key !== "_metadata" &&             // Ignore OData _metadata
        typeof obj[key] !== "function"     // Ignore functions
      ) {
        cleanObj[key] = _extract(obj[key]); // Recurse
      }
    }
    return cleanObj;
  }

  return {
    extractPlainData: _extract
  };
});