sap.ui.define([], function() {
    "use strict";
      return {
        // Generate mission number (001, 002, etc.)
        getMissionsNumber : function(missionArraySize) {
          return String(missionArraySize || 1).padStart(3, '0');
        }
          
      };
  });