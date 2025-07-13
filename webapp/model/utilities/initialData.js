sap.ui.define([], function() {
    "use strict";
      return {
        "year": null,
        "businessNo": null,
        "period": null,
        "missions": [],
        "recaps": [],
        "previsions": [],
        "opport": [],
        "pxAutres": [],
        "missionTypes": [
            { code: "AVP", description: "AVP" },
            { code: "PRO", description: "PRO" },
            { code: "ACT", description: "ACT" },
            { code: "DCE", description: "DCE" },
            { code: "EXE", description: "EXE" }
            // Add other mission types as needed
        ]
      };
  });