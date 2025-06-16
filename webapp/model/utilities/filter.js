sap.ui.define([], function() {
    "use strict";
      return {
        validateMissions: missions => {
          var bIsValid = true;
          var aErrors = [];

          missions.forEach(function (oMission, iIndex) {
            if (!oMission.missionType) {
                aErrors.push("Mission " + (iIndex + 1) + ": Type de mission requis");
            }
            if (!oMission.startDate) {
                aErrors.push("Mission " + (iIndex + 1) + ": Date de début requise");
            }
            if (!oMission.endDate) {
                aErrors.push("Mission " + (iIndex + 1) + ": Date de fin requise");
            }
            // Add other validations as needed
        });

        if (aErrors.length > 0) {
            MessageToast.show(aErrors.join("\n"));
            bIsValid = false;
        }

        return bIsValid;
        },
      };
  });