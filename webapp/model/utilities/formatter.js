sap.ui.define([
  "../../util/helper"
], function (Helper) {
  "use strict";
  return {
    // Generate mission number (001, 002, etc.)
    getMissionsNumber: function (missionArraySize) {
      return String(missionArraySize || 1).padStart(3, '0');
    },
    reverseFormatBudgetSubContracting: Helper.buildObjectKeysMapper({
      BusinessNo: "businessNo",
      EndDate: "endDate",
      MissionCode: "code",
      MissionId: "name",
      Regroupement: "regroupement",
      StartDate: "startDate",
      Statut: "status",
      Budget: ({subContractorBudget}) => subContractorBudget?.toString(),
      SubContractor: "subContractorId",
      SubContractorName: "subContractorName",
      SubContractorPartner: "subContractorPartner",
    }),
    formatBudgetSubContracting: Helper.buildObjectKeysMapper({
      businessNo: "BusinessNo",
      endDate: "EndDate",
      libelle: (({ MissionCode, Statut }) => { return `${MissionCode} ${Statut}` }),
      code: "MissionCode",
      name: "MissionId",
      regroupement: "Regroupement",
      startDate: "StartDate",
      status: "Statut",
      subContractorBudget: ({ Budget }) => Budget ? parseFloat(Budget) : Budget,
      subContractorId: "SubContractor",
      subContractorName: "SubContractorName",
      subContractorPartner: ({ SubContractorPartner }) => SubContractorPartner ? parseFloat(SubContractorPartner) : SubContractorPartner
    }),

    formatSupplier: Helper.buildObjectKeysMapper({
      subContractorPartner: "CompanyPartner",
      subContractorName: "Name",
      subContractorId: "SupplierNo",
    })

  };
});