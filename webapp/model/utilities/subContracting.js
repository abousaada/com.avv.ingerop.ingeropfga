sap.ui.define([], function () {
  "use strict";

  return class SubContracting {
    constructor(model) {
      this.oModel = model;
    }

    buildTreeData() {
      const pxSousTraitance = this.oModel.getPxSousTraitance();
      const treeHeader = {};
      const root = {
        children: [],
        isL0: true,
        isNode: true,
        isBudget: false,
        isTotal: false,
        name: this.oModel.getBusinessNo()
      };
    
      if (pxSousTraitance.length === 0) {
        return { treeData: [root], treeHeader: [] };
      }
    
      const groupementMap = {};
      const globalTotal = { name: "Total global", isL0: false, isNode: false, isBudget: false, isTotal: true, budgetHorsFrais: 0, budgetYCFrais: 0 };
    
      // ✅ Fonction utilitaire pour centraliser la logique d'ajout
      const addBudgetTo = (target, subContractor) => {
        const col = "SC" + subContractor.subContractorId;
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
            isL0: false,
            isNode: true,
            isBudget: false,
            isTotal: false,
            name: mission.regroupement || "Sans groupement",
            total: { name: "Total", isL0: false, isNode: false, isBudget: false, isTotal: true, budgetHorsFrais: 0, budgetYCFrais: 0 }
          };
        }
    
        const group = groupementMap[groupId];
        const leaf = {
          isL0: false,
          isNode: false,
          isBudget: true,
          ...mission,
          budgetHorsFrais: 0,
          budgetYCFrais: 0
        };
    
        for (const sub of mission.budgetPxSubContrators) {
          const columnId = "SC" + sub.subContractorId;
    
          // Ajout au header si colonne encore inconnue
          if (!treeHeader[columnId]) {
            treeHeader[columnId] = { ...sub, columnId };
          }
    
          // Mise à jour des budgets
          addBudgetTo(leaf, sub);
          addBudgetTo(group.total, sub);
          addBudgetTo(globalTotal, sub);
        }
    
        group.children.push(leaf);
      }
    
      // Injecter chaque groupement + leur total dans root
      for (const group of Object.values(groupementMap)) {
        group.children.push(group.total);
        root.children.push(group);
      }
    
      // Ajouter le total global
      root.children.push(globalTotal);
    
      return { treeData: [root], treeHeader: Object.values(treeHeader) };
    }


    // buildTreeData() {
    //   const pxSousTraitance = this.oModel.getPxSousTraitance();
    //   let treeHeader = {};

    //   const root = { children: [], isL0: true, isNode: true, name: this.oModel.getBusinessNo() };

    //   if (pxSousTraitance.length === 0) { 
    //     return { treeData : [root] , treeHeader : Object.values(treeHeader)}; 
    //   };

    //   const groupement = {};

    //   pxSousTraitance.forEach(mission => {
    //     const groupementId = "GR" + mission.regroupement;

    //     //et si pas de groupement ??
    //     if (!groupement[groupementId]) {
    //       groupement[groupementId] = {
    //         children: [],
    //         isL0: false,
    //         isNode: true,
    //         name: mission.regroupement
    //       };
    //     }

    //     const leaf = { isL0: false, isNode: false, ...mission };

    //     const budgets = mission.budgetPxSubContrators.reduce((acc, item) => {
    //       acc["SC" + item.subContractorId] = item.subContractorBudget;
    //       acc["budgetHorsFrais"] += item.subContractorBudget;
    //       acc["budgetYCFrais"] += item.subContractorBudget * item.subContractorPartner;
    //       return acc;
    //     }, {budgetYCFrais : 0, budgetHorsFrais: 0 });

    //     groupement[groupementId].children.push({ ...leaf, ...budgets });

    //     mission.budgetPxSubContrators?.length && mission.budgetPxSubContrators.forEach(
    //       subContractor => {
    //         const columnId = "SC" + subContractor.subContractorId;
    //         if(!treeHeader[columnId]){ treeHeader[columnId] = { ...subContractor, columnId }; }
    //       }
    //     );
    //   });;

    //   Object.entries(groupement).map(([groupementId, groupementVal]) => {
    //     const totalLigne = groupementVal.children.reduce((acc, item) => {

    //     }, {name: "Total"});
    //     groupement[groupementId].children.push(totalLigne);
    //   });


    //   root.children.push(...Object.values(groupement));

    //   return { treeData : [root,...totaux] , treeHeader : Object.values(treeHeader) };
    // }

  };
});