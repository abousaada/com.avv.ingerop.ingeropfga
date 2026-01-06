sap.ui.define([], function () {
  "use strict";

  return class STG {

    _CONSTANT_STG_COLUMN_PREFIXE = "STG_";
    _CONSTANT_STF_COLUMN_PREFIXE = "STF_";

    constructor(model) {
      this.oModel = model;
    }

    buildFilialeTreeData() {
      const pxSousTraitance = this.oModel.getPxSousTraitance();
      const stfTreeHeader = {};
      const treeData = [];
      const root = {
        name: this.oModel.getBusinessNo(),
        isBudget: false,
        isTotal: false,
        isGroupe: true,
        children: []
      };

      treeData.push(root);

      if (!pxSousTraitance || (pxSousTraitance.length === 0)) {
        return { treeData, stfTreeHeader: [] };
      }

      const groupementMap = {};

      const globalTotal = {
        name: "Total global",
        isGroupe: false,
        isBudget: false,
        isTotal: true,
        budgetHorsFrais: 0,
        budgetYCFrais: 0
      };

      const addBudgetTo = (target, { subContractorBudget, subContractorCoef, columnId }) => {
        const amount = subContractorBudget;
        const partnerRatio = subContractorCoef;

        target[columnId] = (target[columnId] || 0) + amount;
        target.budgetHorsFrais += amount;
        target.budgetYCFrais += amount * partnerRatio;
      };

      for (const subContract of pxSousTraitance) {

        const {
          businessNo, endDate, libelle, code, name, startDate, status,
          regroupement,
          subContractorId, subContractorBudget, subContractorCoef, subContractorName, subContractorCumul
        } = subContract;

        const groupId = "GR" + (regroupement ?? "NO_GRP");

        // Init groupement
        if (!groupementMap[groupId]) {
          groupementMap[groupId] = {
            children: [],
            isBudget: false,
            isGroupe: true,
            isTotal: false,
            name: regroupement || "Sans groupement",
            leafMap: {}
          };
        }

        const group = groupementMap[groupId];
        const leafKey = name; // car les feuilles se distinguent par le nom
        let leaf = group.leafMap[leafKey];

        if (!leaf) {
          leaf = {
            isBudget: true,
            isGroupe: false,
            isTotal: false,
            businessNo, endDate, libelle, code, name, startDate, status,
            budgetHorsFrais: 0,
            budgetYCFrais: 0
          };
          group.leafMap[leafKey] = leaf;
          group.children.push(leaf);
        }

        if (subContractorId) {
          const columnId = this._CONSTANT_STF_COLUMN_PREFIXE + subContractorId;
          const subContractor = { subContractorCumul, subContractorName, subContractorId, subContractorBudget, subContractorCoef, columnId };
          if (!stfTreeHeader[columnId]) {
            stfTreeHeader[columnId] = { ...subContractor };
          }
          addBudgetTo(leaf, subContractor);
        }
      }

      // Injecter chaque groupement + leur total dans root
      for (const group of Object.values(groupementMap)) {

        const totalLine = {
          name: "Total",
          isBudget: false,
          isGroupe: false,
          isTotal: true,
          isPercent: false,
          budgetHorsFrais: 0,
          budgetYCFrais: 0
        };

        // Accumuler dans le total global
        for (const child of group.children) {
          if (child.isBudget) {
            for (const columnId in child) {
              if (columnId.startsWith(this._CONSTANT_STF_COLUMN_PREFIXE)) {
                globalTotal[columnId] = (globalTotal[columnId] || 0) + (child[columnId] || 0);
                totalLine[columnId] = (totalLine[columnId] || 0) + (child[columnId] || 0);
              }
            }
            globalTotal.budgetHorsFrais += child.budgetHorsFrais || 0;
            globalTotal.budgetYCFrais += child.budgetYCFrais || 0;

            totalLine.budgetHorsFrais += child.budgetHorsFrais || 0;
            totalLine.budgetYCFrais += child.budgetYCFrais || 0;
          }
        }

        group.children.push(totalLine);
        delete group.leafMap;
        root.children.push(group);
      }

      // Ajouter le total global
      root.children.push(globalTotal);

      const cumulTotal = {
        ...globalTotal,
        name: "Cumul",
        isCumul: true,
        budgetHorsFrais: 0,
        budgetYCFrais: 0
      };

      const percentTotal = {
        ...globalTotal,
        name: "Pourcentage",
        isPercent: true,
        budgetHorsFrais: 0,
        budgetYCFrais: 0
      };

      const RADTotal = {
        ...globalTotal,
        name: "RAD",
        budgetHorsFrais: 0,
        budgetYCFrais: 0
      };

      Object.entries(globalTotal).map(([key, value]) => {
        if (key.startsWith(this._CONSTANT_STF_COLUMN_PREFIXE)) {

          cumulTotal[key] = stfTreeHeader[key]?.subContractorCumul || 0;
          cumulTotal.budgetHorsFrais += cumulTotal[key];
          cumulTotal.budgetYCFrais += cumulTotal[key] * (stfTreeHeader[key]?.subContractorCoef || 1);

          value > 0 ? (percentTotal[key] = cumulTotal[key] / value) : percentTotal[key] = 0;
          RADTotal[key] = value - cumulTotal[key];
        }
      });

      percentTotal.budgetHorsFrais  = globalTotal.budgetHorsFrais > 0 ? (cumulTotal.budgetHorsFrais / globalTotal.budgetHorsFrais) : 0,
      percentTotal.budgetYCFrais    = globalTotal.budgetYCFrais > 0 ? (cumulTotal.budgetYCFrais / globalTotal.budgetYCFrais) : 0

      RADTotal.budgetHorsFrais  = globalTotal.budgetHorsFrais - cumulTotal.budgetHorsFrais,
      RADTotal.budgetYCFrais    = globalTotal.budgetYCFrais - cumulTotal.budgetYCFrais

      root.children.push(cumulTotal);
      root.children.push(percentTotal);
      root.children.push(RADTotal);

      return { treeData: [root], stfTreeHeader: Object.values(stfTreeHeader) };
    }

    buildGroupeTreeData(treeData) {
      const pxSTG = this.oModel.getPxSTG();
      const stgTreeHeader = [];

      if (!pxSTG || (pxSTG.length === 0)) {
        return { "treeData2": treeData, stfTreeHeader: [] };
      }

      const addBudgetTo = (target, { subContractorBudget, subContractorCoef, columnId }) => {
        const amount = subContractorBudget;
        const partnerRatio = subContractorCoef;

        target[columnId] = (target[columnId] || 0) + amount;
        target.budgetHorsFrais += amount;
        target.budgetYCFrais += amount * partnerRatio;
      };

      const globalTotal   = treeData[0].children[treeData[0].children.length - 4];
      const cumulTotal    = treeData[0].children[treeData[0].children.length - 3];
      const percentTotal  = treeData[0].children[treeData[0].children.length - 2];
      const RADTotal      = treeData[0].children[treeData[0].children.length - 1];
      
      treeData[0].children.forEach(groupe => {
        if (!groupe.isTotal) {
          if (groupe.children.length > 0) {
            const totalLine = groupe.children[groupe.children.length - 1];
            groupe.children.forEach(leaf => {
              if (!leaf.isTotal) {
                const cols = pxSTG.filter(stg => stg.name === leaf.name)
                if (cols && cols.length > 0) {
                  cols.forEach(({ subContractorId, subContractorName, profitCenter, subContractorBudget, subContractorCoef }) => {
                    if (subContractorId) {
                      const columnId = this._CONSTANT_STG_COLUMN_PREFIXE + subContractorId;
                      const subContractor = { profitCenter, subContractorName, subContractorId, subContractorBudget, subContractorCoef, columnId };
                      if (!stgTreeHeader[columnId]) {
                        stgTreeHeader[columnId] = { ...subContractor };
                      }
                      addBudgetTo(leaf, subContractor);

                      totalLine[columnId]   = (totalLine[columnId] || 0)   + (subContractorBudget || 0);
                      globalTotal[columnId] = (globalTotal[columnId] || 0) + (subContractorBudget || 0);
                    }
                  });

                  totalLine.budgetHorsFrais += leaf.budgetHorsFrais || 0;
                  totalLine.budgetYCFrais   += leaf.budgetYCFrais   || 0;

                  globalTotal.budgetHorsFrais += leaf.budgetHorsFrais || 0;
                  globalTotal.budgetYCFrais   += leaf.budgetYCFrais   || 0;
                  
                }
              }
            });
          }
        }
      });

      Object.entries(globalTotal).map(([key, value]) => {
        if (key.startsWith(this._CONSTANT_STG_COLUMN_PREFIXE)) {

          cumulTotal[key]             = stgTreeHeader[key]?.subContractorCumul || 0;
          cumulTotal.budgetHorsFrais += cumulTotal[key];
          cumulTotal.budgetYCFrais   += cumulTotal[key] * (stgTreeHeader[key]?.subContractorCoef || 1);

          value > 0 ? (percentTotal[key]  = cumulTotal[key] / value) : percentTotal[key] = 0;
          RADTotal[key]                   = value - cumulTotal[key];
        }
      });

      percentTotal.budgetHorsFrais  = globalTotal.budgetHorsFrais > 0 ? (cumulTotal.budgetHorsFrais / globalTotal.budgetHorsFrais) : 0,
      percentTotal.budgetYCFrais    = globalTotal.budgetYCFrais   > 0 ? (cumulTotal.budgetYCFrais / globalTotal.budgetYCFrais) : 0

      RADTotal.budgetHorsFrais  = globalTotal.budgetHorsFrais - cumulTotal.budgetHorsFrais,
      RADTotal.budgetYCFrais    = globalTotal.budgetYCFrais - cumulTotal.budgetYCFrais

      return { "treeData2": treeData, stgTreeHeader: Object.values(stgTreeHeader) };
    }


    buildTreeData() {
      const { treeData, stfTreeHeader } = this.buildFilialeTreeData();
      const { treeData2, stgTreeHeader } = this.buildGroupeTreeData(treeData);
      return { "treeData": treeData2, stfTreeHeader, stgTreeHeader };
    }


    formattedPxSubContractingExt() {
      const [root] = this.oModel.getPxSubContractingHierarchy(); // = [root]
      const treeHeader = this.oModel.getPxSubContractingHeader();
      const constantPrefix = this._CONSTANT_COLUMN_PREFIXE;
      const flatData = [];

      if (!root || !root.children) return [];

      for (const group of root.children) {
        // Ignorer le total global
        if (group.isTotal) continue;

        const regroupement = group.name;

        for (const leaf of group.children) {
          if (!leaf.isBudget) continue; // ignorer totaux intermédiaires

          // Pour chaque colonne dynamique (un sous-traitant = une colonne)
          for (const columnId of Object.keys(leaf)) {
            if (!columnId.startsWith(constantPrefix)) continue;

            const header = treeHeader.find(h => h.columnId === columnId);
            if (!header) continue;

            flatData.push({
              regroupement,
              name: leaf.name,
              code: leaf.code,
              libelle: leaf.libelle,
              startDate: leaf.startDate,
              endDate: leaf.endDate,
              status: leaf.status,
              businessNo: leaf.businessNo,

              subContractorId: header.subContractorId,
              subContractorBudget: leaf[columnId],
              subContractorPartner: header.subContractorPartner,
              subContractorCoef: header.subContractorCoef,
            });
          }
        }
      }

      return flatData;
    }

  };
});