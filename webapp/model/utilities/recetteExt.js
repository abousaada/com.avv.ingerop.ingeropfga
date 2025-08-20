sap.ui.define([], function () {
  "use strict";

  return class RecetteExt {

    constructor(model) {
      this.oModel = model;
    }

    _totalProps = [
      "montant", /* "externe", */ "groupe", "interUfo", "intraUfo",
      "cumuleEur", /* "cumulePercent", "aVenir" */
    ];

    buildTreeData() {
      const pxRecetteExt = this.oModel.getPxRecetteExt();
      const treeData = [];
      const root = {
        name: this.oModel.getBusinessNo(),
        isBudget: false,
        isTotal: false,
        isGroupe: true,
        children: []
      };

      treeData.push(root);

      if (!pxRecetteExt || pxRecetteExt.length === 0) {
        return treeData;
      }

      const groupementMap = {};

      const globalTotal = {
        name: "Total global",
        isGroupe: false,
        isBudget: false,
        isTotal: true,
      };

      this._totalProps.forEach(prop => { globalTotal[prop] =  0; });

      for (const recetteExt of pxRecetteExt) {

        const {
          // champs récupérés
          regroupement, name,
          // businessNo,  
          // code, libelle, status, montant, startDate, endDate,
          // groupe, interUfo, intraUfo,
          // cumuleEur, 
          
          // champs calculés

          // externe = montant - groupe
          // cumulePercent = ( cumuleEur / montant * 100 ) %
          // aVenir = ( externe + groupe ) - cumuleEur = montant - cumuleEur, ??
        } = recetteExt;

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
            ...recetteExt
          };
          group.leafMap[leafKey] = leaf;
          group.children.push(leaf);
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
        };

        this._totalProps.forEach(prop => { totalLine[prop] =  0; });

        // Accumuler dans le total global
        for (const child of group.children) {
          if (child.isBudget) {
            this._totalProps.forEach(prop => {
              globalTotal[prop] += (parseFloat(child[prop]|| 0) );
              totalLine[prop]   += (parseFloat(child[prop]|| 0) );
            });
          }
        }

        group.children.push(totalLine);
        delete group.leafMap;
        root.children.push(group);
      }

      // Ajouter le total global
      root.children.push(globalTotal);
      
      return [root];
    }

    calcNewBudget(budget){
      return budget;
    }

    reCalcRecetteTable(){
      const [root] = this.oModel.getPxRecetteExtHierarchy();
      const groupement = root.children.slice(0, -1);
      const globalTotal = root.children.at(-1);
      this._totalProps.forEach(prop => { globalTotal[prop] = 0; });

      for (const group of groupement) {
        if (!group.isGroupe || !Array.isArray(group.children)) continue;

        const oldBudgets = group.children.slice(0, -1);
        const newBudgets = oldBudgets.map(budget => this.calcNewBudget(budget));
        const totalLine = group.children.at(-1);
        if (!totalLine) continue; 
        this._totalProps.forEach(prop => { totalLine[prop] =  0; });

        for (const child of newBudgets) {
          this._totalProps.forEach(prop => {
            totalLine[prop]   += (parseFloat(child[prop] || 0) );
            globalTotal[prop] += (parseFloat(child[prop] || 0) );
          });
        }
        group.children = [...newBudgets, totalLine];
      }

      root.children = [...groupement, globalTotal];
      this.oModel.setPxRecetteExtHierarchy([root]);
    }

    formattedPxRecetteExt() {
      
      const [root] = this.oModel.getPxRecetteExtHierarchy(); // = [root]
      const flatData = [];

      if (!root || !root.children) return [];

      for (const group of root.children) {
        // Ignorer le total global
        if (group.isTotal) continue;

        const regroupement = group.name;

        for (const leaf of group.children) {
          if (!leaf.isBudget) continue; // ignorer totaux intermédiaires
            const {isBudget, isGroupe, isTotal, ...rest} = leaf;
            flatData.push({ regroupement, ...rest });
        }
      }

      return flatData;
    }

  };
});