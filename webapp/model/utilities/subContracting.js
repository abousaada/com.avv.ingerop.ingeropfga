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
        // isRoot: true,
        // isNode: false,
        // isLeaf: false,
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
        // isRoot: false,
        // isNode: false,
        // isLeaf: true,
        isGroupe: false,
        isBudget: false,
        isTotal: true,
        budgetHorsFrais: 0,
        budgetYCFrais: 0
      };

      const addBudgetTo = (target, subContractor) => {
        const col = this._CONSTANT_COLUMN_PREFIXE + subContractor.subContractorId;
        const amount = subContractor.subContractorBudget;
        const partnerRatio = subContractor.subContractorPartner;

        target[col] = (target[col] || 0) + amount;
        target.budgetHorsFrais += amount;
        target.budgetYCFrais += amount * partnerRatio;
      };

      for (const mission of pxSousTraitance) {
        const groupId = "GR" + (mission.regroupement ?? "NO_GRP");

        // Init groupement
        if (!groupementMap[groupId]) {
          groupementMap[groupId] = {
            children: [],
            // isRoot: false,
            // isNode: true,
            // isLeaf: false,
            isBudget: false,
            isGroupe: true,
            isTotal: false,
            name: mission.regroupement || "Sans groupement",
          };
        }

        const group = groupementMap[groupId];
        const leaf = {
          // isRoot: false,
          // isNode: false,
          // isLeaf: true,
          isBudget: true,
          isGroupe: false,
          isTotal: false,
          ...mission,
          budgetHorsFrais: 0,
          budgetYCFrais: 0
        };

        for (const sub of mission.budgetPxSubContrators) {
          const columnId = this._CONSTANT_COLUMN_PREFIXE + sub.subContractorId;

          // Ajout au header si colonne encore inconnue
          if (!treeHeader[columnId]) {
            treeHeader[columnId] = { ...sub, columnId };
          }

          // Mise à jour des budgets
          addBudgetTo(leaf, sub);
        }

        group.children.push(leaf);
      }

      // Injecter chaque groupement + leur total dans root
      for (const group of Object.values(groupementMap)) {
        
        const totalLine = {
          name: "Total",
          // isRoot: false,
          // isNode: false,
          // isLeaf: true,
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

        root.children.push(group);
      }

      // Ajouter le total global
      root.children.push(globalTotal);

      return { treeData: [root], treeHeader: Object.values(treeHeader) };
    }

  };
});