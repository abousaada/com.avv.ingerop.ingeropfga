sap.ui.define([
  "../../util/helper"
], function (Helper) {
  "use strict";
  return {
    // Generate mission number (001, 002, etc.)
    getMissionsNumber: function (missionArraySize) {
      return String(missionArraySize || 1).padStart(3, '0');
    },
    formatBudgetSubContracting: Helper.buildObjectKeysMapper({
      businessNo: "BusinessNo",
      endDate: "EndDate",
      libelle: (({ MissionCode, Statut }) => { return `${MissionCode} ${Statut}` }),
      code: "MissionCode",
      name: "MissionId",
      regroupement: "Regroupement",
      startDate: "StartDate",
      status: "Statut",
      budgetPxSubContrators: ({ to_BudgetPxSubContractor }) => { 
        return (to_BudgetPxSubContractor?.results || []).map(
          Helper.buildObjectKeysMapper({
            subContractorBudget   : ({ Budget }) => Budget ? parseFloat(Budget) : Budget,
            subContractorId       : "SubContractor",
            subContractorName     : "SubContractorName",
            subContractorPartner  : ({ SubContractorPartner }) => SubContractorPartner ? parseFloat(SubContractorPartner) : SubContractorPartner
          }));
      }
    })

  };
});