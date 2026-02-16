//sap.ui.define([], function () {
//  "use strict";
sap.ui.define([
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
  "use strict";

  return class RecetteExt {

    _getMissionIdsFromPxRecette() {
      const aPx = this.oModel.getPxRecetteExt();
      if (!Array.isArray(aPx)) return [];

      return [...new Set(
        aPx.map(o => o.name).filter(Boolean)
      )];
    }

    _loadBudgetsFromPxRecette() {
      const aMissIds = this._getMissionIdsFromPxRecette();
      if (!aMissIds.length) return Promise.resolve([]);

      // adapte ici selon ton accès au ODataModel
      //const oODataModel = this.oModel.getODataModel(); // <- recommandé

      const oODataModel = this.oDataModel;
      if (!oODataModel) {
        console.error("Missing oDataModel in RecetteExt");
        return Promise.reject(new Error("Missing ODataModel"));
      }

      const aOr = aMissIds.map(id => new Filter("MissId", FilterOperator.EQ, id));
      const oOrFilter = new Filter(aOr, false); // OR

      return new Promise((resolve, reject) => {
        oODataModel.read("/Budget", {
          groupId: "$direct",
          filters: [oOrFilter],
          success: (oData) => {
            resolve(oData?.results || []);
          },
          error: (err) => {
            console.error("OData Budget error:", err);
            reject(err);
          }
        });
      });

    }



    constructor(oUtilModel, oODataModel) {
      this.oModel = oUtilModel;       // utilities
      this.oDataModel = oODataModel;
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
        name: "Total acquis",
        isGroupe: false,
        isBudget: false,
        isTotal: true,
      };

      this._totalProps.forEach(prop => { globalTotal[prop] = 0; });

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
          name: "Total " + group.name + " acquis",
          isBudget: false,
          isGroupe: false,
          isTotal: true,
          isPercent: false,
        };

        this._totalProps.forEach(prop => { totalLine[prop] = 0; });

        // Accumuler dans le total global
        for (const child of group.children) {
          if (child.isBudget && child.status == "A") {
            this._totalProps.forEach(prop => {
              globalTotal[prop] += (parseFloat(child[prop] || 0));
              totalLine[prop] += (parseFloat(child[prop] || 0));
            });
          }
        }

        group.children.push(totalLine);
        delete group.leafMap;
        root.children.push(group);
      }

      // Ajouter le total global
      root.children.push(globalTotal);

      // Ajouter 2 lignes fixes en dessous des totaux
      const affaireType = this.oModel.getProperty("/AffaireType");
      const bEditable = !!this.oModel.getProperty("/Editable");
      const bShowBottomLines = bEditable && (affaireType !== "M");

      if (bShowBottomLines) {
        const bottomLine1 = {
          libelle: "Budget total alloué",
          isGroupe: false,
          isBudget: false,
          isTotal: true,
          isCustomBottom: true
        };
        this._totalProps.forEach(prop => { bottomLine1[prop] = 0; });

        bottomLine1.groupe = this.sumGroupe;
        bottomLine1.interUfo = this.sumInter;
        bottomLine1.intraUfo = this.sumIntra;

        const bottomLine2 = {
          libelle: "Reste à répartir",
          isGroupe: false,
          isBudget: false,
          isTotal: true,
          isCustomBottom: true,
        };
        this._totalProps.forEach(prop => { bottomLine2[prop] = 0; });
        bottomLine2.groupe = (parseFloat(bottomLine1.groupe || 0) - parseFloat(globalTotal.groupe || 0));
        bottomLine2.interUfo = (parseFloat(bottomLine1.interUfo || 0) - parseFloat(globalTotal.interUfo || 0));
        bottomLine2.intraUfo = (parseFloat(bottomLine1.intraUfo || 0) - parseFloat(globalTotal.intraUfo || 0));

        root.children.push(bottomLine1, bottomLine2);
      }

      this._loadBudgetsFromPxRecette().then(aBudgets => {
        console.log("Budgets reçus:", aBudgets);
        this.sumGroupe = 0;
        this.sumInter = 0;
        this.sumIntra = 0;

        aBudgets.forEach(b => {
          this.sumGroupe += Math.abs(parseFloat(b.BudgetGroupe || 0));
          this.sumInter += Math.abs(parseFloat(b.BudgetInterUfo || 0));
          this.sumIntra += Math.abs(parseFloat(b.BudgetIntraUfo || 0));

        });
      });




      return [root];


    }


    calcNewBudget(budget) {
      return budget;
    }

    reCalcRecetteTable() {
      const [root] = this.oModel.getPxRecetteExtHierarchy();
      if (!root || !Array.isArray(root.children)) return;

      // séparer : groupes / total global / bottom lines
      const groups = root.children.filter(x => x && x.isGroupe);
      const globalTotal = root.children.find(x => x && x.isTotal && !x.isCustomBottom);
      const bottomBudget = root.children.find(x => x && x.isCustomBottom && x.libelle === "Budget total alloué");
      const bottomReste = root.children.find(x => x && x.isCustomBottom && x.libelle === "Reste à répartir");

      if (!globalTotal) return;

      // reset global
      this._totalProps.forEach(p => { globalTotal[p] = 0; });

      //recalcul groupes + total global
      for (const group of groups) {
        if (!Array.isArray(group.children)) continue;

        const leaves = group.children.filter(c => c && c.isBudget);
        const totalLine = group.children.find(c => c && c.isTotal); // total du groupe

        if (totalLine) this._totalProps.forEach(p => { totalLine[p] = 0; });

        for (const leaf of leaves) {
          const newLeaf = this.calcNewBudget(leaf);

          this._totalProps.forEach(p => {
            const v = Number(newLeaf[p]) || 0;
            if (totalLine) totalLine[p] += v;
            globalTotal[p] += v;
          });
        }
      }

      // recalcul bottom lines
      if (bottomBudget && bottomReste) {
        bottomReste.groupe = (Number(bottomBudget.groupe) || 0) - (Number(globalTotal.groupe) || 0);
        bottomReste.interUfo = (Number(bottomBudget.interUfo) || 0) - (Number(globalTotal.interUfo) || 0);
        bottomReste.intraUfo = (Number(bottomBudget.intraUfo) || 0) - (Number(globalTotal.intraUfo) || 0);
      }

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
          const { isBudget, isGroupe, isTotal, ...rest } = leaf;
          flatData.push({ regroupement, ...rest });
        }
      }

      return flatData;
    }

  };
});