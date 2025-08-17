sap.ui.define([
  "../../util/helper"
], function (Helper) {
  "use strict";
  return {
    // Generate mission number (001, 002, etc.)
    getMissionsNumber: function (missionArraySize) {
      return String(missionArraySize || 1).padStart(2, '0');
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
      SubContractorCoef : ({subContractorCoef}) => subContractorCoef?.toString(),
      Cumul: ({subContractorCumul}) => subContractorCumul?.toString(),
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
      subContractorCoef : ({ SubContractorCoef }) => Number.parseFloat(SubContractorCoef) ? SubContractorCoef : 1,
      subContractorPartner: "SubContractorPartner",
      subContractorCumul: ({ Cumul }) => Number.parseFloat(Cumul),
    }),

    formatSupplier: Helper.buildObjectKeysMapper({
      subContractorPartner: "CompanyPartner",
      subContractorName: "Name",
      subContractorId: "SupplierNo",
      subContractorCoef : ({ SubContractorCoef }) => Number.parseFloat(SubContractorCoef) ? SubContractorCoef : 1,
      subContractorPartner: "SubContractorPartner"
    }),
  };
});