sap.ui.define([
  "../../util/helper"
], function (Helper) {
  "use strict";
  return {
    // Generate mission number (001, 002, etc.)
    getMissionsNumber: function (missionArraySize) {
      return String(missionArraySize || 1).padStart(2, '0');
    },

    //Formatter In

    formatSupplier: Helper.buildObjectKeysMapper({
      subContractorPartner: "CompanyPartner",
      subContractorName: "Name",
      subContractorId: "SupplierNo",
      subContractorCoef : ({ SubContractorCoef }) => Number.parseFloat(SubContractorCoef) ? SubContractorCoef : 1,
      subContractorPartner: "SubContractorPartner"
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

    formatBudgetRecetteExt: Helper.buildObjectKeysMapper({
      businessNo: "BusinessNo",
      regroupement: "Regroupement",
      name: "MissionId",
      libelle: "Libelle",
      code: "MissionCode",
      status: "Statut",
      startDate: "StartDate",
      endDate: "EndDate",
      montant: ({Montant}) => parseFloat(Montant),
      groupe: ({Groupe}) => parseFloat(Groupe),
      interUfo: ({InterUFO}) => parseFloat(InterUFO),
      intraUfo: ({IntraUFO}) => parseFloat(IntraUFO),
      cumuleEur: ({CumuleEUR}) => parseFloat(CumuleEUR),
    }),

    formatBudgetPxMainOeuvre: Helper.buildObjectKeysMapper({
      businessNo: "BusinessNo",
      regroupement: "Regroupement",
      name: "MissionId",
      libelle: "Libelle",
      code: "MissionCode",
      status: "Statut",
      startDate: "StartDate",
      endDate: "EndDate",
      nbJoursConso: "NbJoursConso",
      nbJoursRest: "NbJoursRest",
      physique: "Physique",
      tjm: "Tjm",
      profil: "Profil",
      profilDescription: "ProfilDescription",
      cumul : "Cumul"
    }),
    
    //Formatter Out

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

    reverseFormatBudgetRecetteExt: Helper.buildObjectKeysMapper({
      BusinessNo: "businessNo",
      EndDate: "endDate",
      MissionCode: "code",
      MissionId: "name",
      Regroupement: "regroupement",
      StartDate: "startDate",
      Statut: "status",
      Montant :   ({ montant })   => parseFloat(montant || 0).toString(),
      Groupe :    ({ groupe })    => parseFloat(groupe || 0).toString(),
      InterUFO :  ({ interUfo })  => parseFloat(interUfo || 0).toString(),
      IntraUFO :  ({ intraUfo })  => parseFloat(intraUfo || 0).toString(),
      CumuleEUR : ({ cumuleEur }) => parseFloat(cumuleEur || 0).toString(),
    }),

    reverseFormatBudgetMainOeuvre: Helper.buildObjectKeysMapper({
      BusinessNo: "businessNo",
      EndDate: "endDate",
      MissionCode: "code",
      MissionId: "name",
      Regroupement: "regroupement",
      StartDate: "startDate",
      Statut: "status",
      NbJoursConso : "nbJoursConso",
      NbJoursRest : "nbJoursRest",
      Physique : "physique",
      Tjm : "tjm",
      Profil: "profil",
      ProfilDescription: "profilDescription",
      Cumul : "cumul"
    }),
  };
});