sap.ui.define([], function () {
  "use strict";

  return class SubContracting {
    
    _CONSTANT_COLUMN_PREFIXE = "SC_";

    constructor(model) {
      this.oModel = model;
    }

    buildTreeData() {
      const pxSousTraitance = this.oModel.getPxSousTraitance();
      // .filter(st => !st.isFiliale);
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

      const addBudgetTo = (target, { subContractorBudget, subContractorCoef, columnId }) => {
        const amount = subContractorBudget;
        const partnerRatio = subContractorCoef;

        target[columnId] = (target[columnId] || 0) + amount;
        target.budgetHorsFrais += amount;
        target.budgetYCFrais += amount * partnerRatio;
      };

      for (const subContract of pxSousTraitance) {

        const {
          businessNo, endDate, libelle, code, name, startDate, status, isFiliale,
          regroupement,
          subContractorId, subContractorBudget, subContractorCoef, subContractorName, subContractorCumul,
          hasBudget
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

        if (subContractorId && !isFiliale ) {
          const columnId = this._CONSTANT_COLUMN_PREFIXE + subContractorId;
          const subContractor = { subContractorCumul, subContractorName, subContractorId, subContractorBudget, subContractorCoef, hasBudget, columnId };
          if (!treeHeader[columnId]) {
            treeHeader[columnId] = { ...subContractor };
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

      const cumulTotal = {
        ...globalTotal , 
        name: "Cumul", 
        isCumul: true,
        budgetHorsFrais: 0 , 
        budgetYCFrais: 0
      };

      const percentTotal = {
        ...globalTotal , 
        name: "Pourcentage", 
        isPercent: true,
        budgetHorsFrais: 0, 
        budgetYCFrais: 0
      };

      const RADTotal = {
        ...globalTotal , 
        name: "RAD",
        budgetHorsFrais: 0, 
        budgetYCFrais: 0
      };

      Object.entries(globalTotal).map(([key, value]) => {
        if(key.startsWith(this._CONSTANT_COLUMN_PREFIXE)){

          cumulTotal[key] = treeHeader[key]?.subContractorCumul || 0;
          cumulTotal.budgetHorsFrais += cumulTotal[key];
          cumulTotal.budgetYCFrais += cumulTotal[key] * ( treeHeader[key]?.subContractorCoef || 1 );

          value > 0 ? ( percentTotal[key] = cumulTotal[key] / value * 100 ) : percentTotal[key] = 0 ;
          RADTotal[key] = value - cumulTotal[key];
        }
      });

      percentTotal.budgetHorsFrais  = globalTotal.budgetHorsFrais > 0 ? (cumulTotal.budgetHorsFrais / globalTotal.budgetHorsFrais * 100) : 0, 
      percentTotal.budgetYCFrais    = globalTotal.budgetYCFrais > 0 ? (cumulTotal.budgetYCFrais / globalTotal.budgetYCFrais * 100) : 0
      
      RADTotal.budgetHorsFrais= globalTotal.budgetHorsFrais - cumulTotal.budgetHorsFrais, 
      RADTotal.budgetYCFrais= globalTotal.budgetYCFrais - cumulTotal.budgetYCFrais
      
      root.children.push(cumulTotal);
      root.children.push(percentTotal);
      root.children.push(RADTotal);

      return { treeData: [root], treeHeader: Object.values(treeHeader) };
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