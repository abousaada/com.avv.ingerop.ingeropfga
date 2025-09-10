sap.ui.define([], function () {
  "use strict";

  return class MainOeuvre {

    constructor(model) {
      this.oModel = model;
    }

    _totalProps = [
      "cumul", "physique"
    ];

    _CONSTANT_COLUMN_PREFIXE  = "MO_";
    _CONSTANT_COLUMN_CONSO    = "_CONSO";
    _CONSTANT_COLUMN_REST     = "_REST";

    buildTreeData() {
      const pxMainOeuvre = this.oModel.getPxMainOeuvre();
      const treeData = [], treeHeader = {};
      const root = {
        name: this.oModel.getBusinessNo(),
        isBudget: false,
        isTotal: false,
        isGroupe: true,
        children: []
      };

      treeData.push(root);

      if (!pxMainOeuvre || pxMainOeuvre.length === 0) {
        return { treeData, treeHeader: [] };
      }

      const groupementMap = {};

      const globalTotal = {
        name: "Total global",
        isGroupe: false,
        isBudget: false,
        isTotal: true,
      };

      this._totalProps.forEach(prop => { globalTotal[prop] =  0; });

      for (const mainOeuvre of pxMainOeuvre) {

        const {
          // champs récupérés
          regroupement, name,
          tjm, profilDescription, profil,
          nbJoursConso, nbJoursRest,
          // businessNo,  
          // code, libelle, status, montant, startDate, endDate,
          
          // champs calculés
          // nbJoursConso: "NbJoursConso",
          // nbJoursRest: "NbJoursRest",
          // physique: "Physique",
          // tjm: "Tjm",
          // profil: "Profil",
          // profilDescription: "ProfilDescription",
          // cumul : "Cumul"

          // cumulePercent = ( cumuleEur / montant * 100 ) %
          // aVenir = ( externe + groupe ) - cumuleEur = montant - cumuleEur, ??
          ...reste
        } = mainOeuvre;

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
            regroupement, name,
            ...reste
          };
          group.leafMap[leafKey] = leaf;
          group.children.push(leaf);
        }

        if (profil) {
          const columnId = this._CONSTANT_COLUMN_PREFIXE + profil;
          const profilHeader = { tjm, profilDescription, profil, columnId };
          if (!treeHeader[columnId]) {
            treeHeader[columnId] = { ...profilHeader };
          }

          leaf[columnId + this._CONSTANT_COLUMN_CONSO ] = nbJoursConso;
          leaf[columnId + this._CONSTANT_COLUMN_REST  ] = nbJoursRest;
        }

      }

      this._totalProps.forEach(prop => { 
        globalTotal[prop] =  0;
      });

      Object.keys(treeHeader).forEach(columnId => { 
        globalTotal[columnId + this._CONSTANT_COLUMN_CONSO] =  0; 
        globalTotal[columnId + this._CONSTANT_COLUMN_REST]  =  0;
      });

      // Injecter chaque groupement + leur total dans root
      for (const group of Object.values(groupementMap)) {

        const totalLine = {
          name: "Total",
          isBudget: false,
          isGroupe: false,
          isTotal: true,
          isPercent: false,
        };

        this._totalProps.forEach(prop => { 
          totalLine[prop] =  0;
        });
        Object.keys(treeHeader).forEach(columnId => { 
          totalLine[columnId + this._CONSTANT_COLUMN_CONSO] =  0; 
          totalLine[columnId + this._CONSTANT_COLUMN_REST]  =  0;
        });

        // Accumuler dans le total global
        for (const child of group.children) {
          if (child.isBudget) {
            this._totalProps.forEach(prop => {
              globalTotal[prop] += (parseFloat(child[prop]|| 0) );
              totalLine[prop]   += (parseFloat(child[prop]|| 0) );
            });
            Object.values(treeHeader).forEach(({ columnId, tjm }) => { 
              const restColumnId  = columnId + this._CONSTANT_COLUMN_REST;
              const consoColumnId = columnId + this._CONSTANT_COLUMN_CONSO;

              globalTotal[restColumnId] += (parseFloat(child[restColumnId]|| 0) * ( tjm || 0 ) );
              totalLine[restColumnId]   += (parseFloat(child[restColumnId]|| 0) * ( tjm || 0 ) );

              globalTotal[consoColumnId] += (parseFloat(child[consoColumnId]|| 0) * ( tjm || 0 ) );
              totalLine[consoColumnId]   += (parseFloat(child[consoColumnId]|| 0) * ( tjm || 0 ) );
            });
          }
        }

        group.children.push(totalLine);
        delete group.leafMap;
        root.children.push(group);
      }

      // Ajouter le total global
      root.children.push(globalTotal);
      
      return { treeData: [root], treeHeader: Object.values(treeHeader)};
    }

    calcNewBudget(budget){
      return budget;
    }

    reCalcMainOeuvreTable(){
      const [root] = this.oModel.getPxMainOeuvreHierarchy();
      const treeHeader = this.oModel.getPxMainOeuvreHeader();

      const groupement = root.children.slice(0, -1);
      const globalTotal = root.children.at(-1);

      this._totalProps.forEach(prop => { globalTotal[prop] = 0; });
      treeHeader.forEach(({ columnId }) => { globalTotal[columnId + this._CONSTANT_COLUMN_REST]  =  0;});

      for (const group of groupement) {
        if (!group.isGroupe || !Array.isArray(group.children)) continue;

        const oldBudgets = group.children.slice(0, -1);
        const newBudgets = oldBudgets.map(budget => this.calcNewBudget(budget));
        const totalLine = group.children.at(-1);
        if (!totalLine) continue; 

        this._totalProps.forEach(prop => { totalLine[prop] =  0; });
        treeHeader.forEach(({ columnId }) => { totalLine[columnId + this._CONSTANT_COLUMN_REST]  =  0;});

        for (const child of newBudgets) {
          this._totalProps.forEach(prop => {
            totalLine[prop]   += (parseFloat(child[prop] || 0) );
            globalTotal[prop] += (parseFloat(child[prop] || 0) );
          });

          treeHeader.forEach(({ columnId, tjm }) => { 
            const prop = columnId + this._CONSTANT_COLUMN_REST
            totalLine[prop]   += (parseFloat(child[prop] || 0) * ( tjm || 0 ) );
            globalTotal[prop] += (parseFloat(child[prop] || 0) * ( tjm || 0 ));
          });

        }
        group.children = [...newBudgets, totalLine];
      }

      root.children = [...groupement, globalTotal];
      this.oModel.setPxMainOeuvreHierarchy([root]);
    }

    formattedPxMainOeuvre() {
      const treeHeader = this.oModel.getPxMainOeuvreHeader();
      const [root] = this.oModel.getPxMainOeuvreHierarchy(); // = [root]
      const flatData = [];

      if (!root || !root.children) return [];

      for (const group of root.children) {
        // Ignorer le total global
        if (group.isTotal) continue;

        const regroupement = group.name;

        for (const leaf of group.children) {
          if (!leaf.isBudget) continue; // ignorer totaux intermédiaires
            const {isBudget, isGroupe, isTotal, ...rest} = leaf;

            for (const {columnId, profil, tjm, profilDescription} of treeHeader) {
              rest.profilDescription  = profilDescription;
              rest.profil             = profil;
              rest.tjm                = tjm;
              
              if(leaf[columnId + this._CONSTANT_COLUMN_CONSO]){
                rest.nbJoursConso = (leaf[columnId + this._CONSTANT_COLUMN_CONSO] || 0);
              }
              if(leaf[columnId + this._CONSTANT_COLUMN_REST]){
                rest.nbJoursRest = (leaf[columnId + this._CONSTANT_COLUMN_REST] || 0);
              }
              flatData.push({ ...rest });
            }
        }
      }

      return flatData;
    }

  };
});