sap.ui.define([], function () {
  "use strict";
  return {
    "year": null,
    "businessNo": null,
    "period": null,
    "missions": [],
    "recaps": [],
    "previsions": [],
    "opport": [],
    "risque": [],
    "charts": [],
    "chartsAdditionalData": [],
    "pxAutres": [],
    "pxSousTraitance": [],
    "pxRecetteExt": [],
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
    "pxSTI": [],
    "pSTI": [],
    "Notes": '',
    "sfgp": [],
    "previsionel": [],
    "missionTypes": [
      { code: "ESQ", description: "ESQ" },
      { code: "AVP", description: "AVP" },
      { code: "APS", description: "APS" },
      { code: "APD", description: "APD" },
      { code: "PRO", description: "PRO" },
      { code: "ACT", description: "ACT" },
      { code: "EXE", description: "EXE" },
      { code: "DET", description: "DET" },
      { code: "OPC", description: "OPC" },
      { code: "AOR", description: "AOR" },
      { code: "DIA", description: "DIA" }
    ]
    ,
    "missionStatus": [
      { code: "A", description: "Acquis" },
      { code: "N", description: "Non Acquis" },
      { code: "R", description: "Réclamé" }
    ]
  };
});