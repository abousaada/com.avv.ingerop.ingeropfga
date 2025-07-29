sap.ui.define([], function () {
  "use strict";

  return class SubContracting {
    constructor(model) {
      this.oModel = model;

      this._CONSTANT_COLUMN_PREFIXE = "SC_";
    }

    buildTreeData() {
      const pxSousTraitance = this.oModel.getPxSousTraitance();
      const treeHeader = {};
      const treeData = [];
      const root = {
        name: this.oModel.getBusinessNo(),
        isBudget: false,
        isTotal: false,
        isGroupe: true,
        children: []
      };

      treeData.push(root);

      if (!pxSousTraitance || pxSousTraitance.length === 0) {
        return { treeData, treeHeader: [] };
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

      const addBudgetTo = (target, { subContractorBudget, subContractorPartner, columnId }) => {
        const amount = subContractorBudget;
        const partnerRatio = subContractorPartner;

        target[columnId] = (target[columnId] || 0) + amount;
        target.budgetHorsFrais += amount;
        target.budgetYCFrais += amount * partnerRatio;
      };

      for (const subContract of pxSousTraitance) {
        
        const {
          businessNo, endDate, libelle, code, name, startDate, status,
          regroupement,
          subContractorId, subContractorBudget, subContractorPartner 
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
            leafMap:{}
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

        const columnId = this._CONSTANT_COLUMN_PREFIXE + subContractorId;
        const subContractor = {subContractorId, subContractorBudget, subContractorPartner, columnId};
        if (!treeHeader[columnId]) { 
          treeHeader[columnId] = { ...subContractor }; 
        }

        addBudgetTo(leaf, subContractor);
        
      }

      // Injecter chaque groupement + leur total dans root
      for (const group of Object.values(groupementMap)) {
        
        const totalLine = {
          name: "Total",
          isBudget: false,
          isGroupe: false,
          isTotal: true,
          budgetHorsFrais: 0,
          budgetYCFrais: 0
        };

        // Accumuler dans le total global
        for (const child of group.children) {
          if (child.isBudget) {
            for (const columnId in child) {
              if (columnId.startsWith(this._CONSTANT_COLUMN_PREFIXE)) {
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

      return { treeData: [root], treeHeader: Object.values(treeHeader) };
    }

  };
});