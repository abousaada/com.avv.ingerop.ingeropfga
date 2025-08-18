sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "../../util/formatter",
], function (Controller, formatter) {
  "use strict";

  return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.Sfgp", {
    formatter: formatter,

    onInit: function () {
      const oTable = this.byId("sfgpTable");
      if (!oTable) return;

      // 1) quand le binding rows apparaît, on s’y accroche une fois
      oTable.attachModelContextChange(this._hookRowsBinding, this);

      // 2) après chaque rendu des lignes, on stylise le footer
      oTable.attachRowsUpdated(this._styleFooterRow, this);
    },

    /* ===== Binding rows : brancher les bons events une seule fois ===== */
    _hookRowsBinding: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      if (!oBinding || this._rowsBindingHooked) return;

      this._rowsBindingHooked = true;

      // OData → dataReceived; JSON → change (on écoute les deux par sécurité)
      oBinding.attachEventOnce("dataReceived", this._onRowsChanged, this);
      oBinding.attachChange(this._onRowsChanged, this);

      // si les données sont déjà là, on traite tout de suite
      this._onRowsChanged();
    },

    /* ===== Quand les données arrivent/changent ===== */
    _onRowsChanged: function () {
      this._ensureFooterRow();  // ajoute "TOTAL" s’il n’existe pas
      this._setRowCount();      // ajuste le nombre de lignes visibles
      this._setDefaultColumnWidths(); // <-- largeur par défaut
    },

    /* ===== Ajoute une ligne synthétique TOTAL à la fin si absente ===== */
    _ensureFooterRow: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      if (!oBinding) return;

      // modèle & chemin réellement utilisés par la table
      const oModel = oBinding.getModel();
      const sPath  = oBinding.getPath(); // ex. "/sfgp"

      let a = oModel.getProperty(sPath);
      if (!Array.isArray(a) || a.length === 0) return;

      const last = a[a.length - 1];
      const hasFooter = last && (last.isFooter === true || last.business_no === "TOTAL");
      if (hasFooter) return;

      var sBusinessNo = this.getView().getModel("utilities").getBusinessNo();
      var sFooterTitleText = "TOTAL " + sBusinessNo;
      // construit un objet footer avec les mêmes clés que la 1ère ligne
      const f = { isFooter: true, business_no: sFooterTitleText };
      Object.keys(a[0]).forEach(k => { if (!(k in f)) f[k] = ""; });

      oModel.setProperty(sPath, a.concat([f]));
    },

    /* ===== visibleRowCount = nb de lignes (footer inclus) ===== */
    _setRowCount: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      const len      = oBinding && oBinding.getLength ? oBinding.getLength() : 0;
      oTable.setVisibleRowCount(Math.max(1, len));
    },

    /* ===== Styling + fusion 3 premières cellules sur la DERNIÈRE ligne ===== */
    _styleFooterRow: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      if (!oBinding) return;

      const iLast = oBinding.getLength() - 1;
      if (iLast < 0) return;

      oTable.getRows().forEach((oRow) => {
        const $row = oRow.$();
        if (!$row.length) return;

        const isLast = oRow.getIndex() === iLast;
        $row.toggleClass("sfgpFooterRow", isLast);

        if (isLast) {
          // fusion visuelle des 3 premières cellules
          setTimeout(() => {
            const $cells = $row.find(".sapUiTableCell");
            if ($cells.length >= 3) {
              const $c0 = $cells.eq(0);
              $c0.attr("colspan", 3).css({
                "text-align": "center",
                "vertical-align": "middle",
                "font-weight": "bold",
                "background-color": "#333399",
                "color": "white"
              });
              $cells.eq(1).remove();
              $cells.eq(2).remove();
            }
          }, 0);
        } else {
          $row.removeClass("sfgpFooterRow");
        }
      });
    },

        /* ===== Largeur par défaut sur toutes les colonnes ===== */
    _setDefaultColumnWidths: function () {
      const oTable = this.byId("sfgpTable");
      if (!oTable) return;

      oTable.getColumns().forEach((oCol) => {
        let width = oCol.getWidth();
        if (!width || width === "auto" || width === "") {
          oCol.setWidth("8rem");
        }
        // oCol.setResizable(false); // optionnel : empêche l’utilisateur de réduire
      });

      // empêche le drag & drop de colonnes
      oTable.attachColumnMove(function (oEvent) {
        oEvent.preventDefault();
      });
    },

    onPressFGALink: function(oEvent){
      var oCtx = oEvent.getSource().getBindingContext("utilities");
      var period = this.getView().getModel("utilities").getProperty("/period");
      var businessNo = oCtx.getProperty("business_no");

      var sKeys = `p_period='${period}',BusinessNo='${businessNo}'`;

      this.getOwnerComponent().getRouter().navTo("ZC_FGASet", {
        keys1: sKeys
      });
    }
  });
});
