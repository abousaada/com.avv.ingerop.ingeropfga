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
        "charts": [],
        "chartsAdditionalData": [],
        "pxAutres": [],
        "pxSousTraitance":[],
        "pxRecetteExt":[],
        "PxAutreHierarchyWithTotals": [],
        "pxRecetteExtHierarchy": [],
        "pxSubContractingHierarchy": [],
        "pxSubContractingHeader": [
          /*{
            subContractorId       : "SubContractor",
            subContractorName     : "SubContractorName",
            subContractorPartner  : "SubContractorPartner",
          }*/
        ],
        "pxMainOeuvre": [],
        "pxMainOeuvreHierarchy": [],
        "pxMainOeuvreHeader": [
          /*{
            subContractorId       : "SubContractor",
            subContractorName     : "SubContractorName",
            subContractorPartner  : "SubContractorPartner",
          }*/
        ],
        "Notes": '',
        "sfgp": [],
        "missionTypes": [
            { code: "GEN", description: "GEN" },
            { code: "AVP", description: "AVP" },
            { code: "PRO", description: "PRO" },
            { code: "ACT", description: "ACT" },
            { code: "DCE", description: "DCE" },
            { code: "EXE", description: "EXE" }
        ],
        "missionStatus": [
          { code: "A", description: "Acquis" },
          { code: "N", description: "Non Acquis" },
          { code: "R", description: "Réclamé" }
        ]
      };
  });