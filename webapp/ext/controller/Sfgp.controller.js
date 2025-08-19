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

      // quand le binding rows apparaît, on s’y accroche une fois
      oTable.attachModelContextChange(this._hookRowsBinding, this);

      // après chaque rendu des lignes, on (re)style la/les lignes footer
      oTable.attachRowsUpdated(this._styleFooterRow, this);
    },

    /* ===== Binding rows : brancher les bons events une seule fois ===== */
    _hookRowsBinding: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      if (!oBinding || this._rowsBindingHooked) return;

      this._rowsBindingHooked = true;

      // OData → dataReceived; JSON → change
      oBinding.attachEventOnce("dataReceived", this._onRowsChanged, this);
      oBinding.attachChange(this._onRowsChanged, this);

      // si les données sont déjà là, on traite tout de suite
      this._onRowsChanged();
    },

    /* ===== Quand les données arrivent/changent ===== */
    _onRowsChanged: function () {
      // ⚠️ plus d’injection de ligne synthétique ici
      this._setRowCount();
      this._setDefaultColumnWidths();
    },

    /* ===== visibleRowCount = nb de lignes ===== */
    _setRowCount: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      const len      = oBinding && oBinding.getLength ? oBinding.getLength() : 0;
      oTable.setVisibleRowCount(Math.max(1, len));
    },

    /* ===== Styling : applique le bleu sur les lignes isFooter ===== */
    _styleFooterRow: function () {
      const oTable   = this.byId("sfgpTable");
      const oBinding = oTable.getBinding("rows");
      if (!oBinding) return;

      oTable.getRows().forEach((oRow) => {
        const $row = oRow.$();
        if (!$row.length) return;

        const oCtx = oRow.getBindingContext("utilities");
        const vFlag = oCtx && oCtx.getProperty("isFooter");
        const isFooter = (vFlag === true || vFlag === "X" || vFlag === 1 || vFlag === "1");

        // ajoute/retire la classe marquant le footer
        $row.toggleClass("sfgpFooterRow", isFooter);

        // si footer → fusion visuelle des 3 premières cellules
        if (isFooter) {
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
        }
      });
    },

    /* ===== Largeur par défaut sur toutes les colonnes ===== */
    _setDefaultColumnWidths: function () {
      const oTable = this.byId("sfgpTable");
      if (!oTable) return;

      oTable.getColumns().forEach((oCol) => {
        const width = oCol.getWidth();
        if (!width || width === "auto" || width === "") {
          oCol.setWidth("8rem");
        }
      });

      // empêche le drag & drop de colonnes
      oTable.attachColumnMove(function (oEvent) {
        oEvent.preventDefault();
      });
    },

    /* ===== Navigation sur clic du lien (ignore la ligne footer) ===== */
    onPressFGALink: function (oEvent) {
      const oCtx = oEvent.getSource().getBindingContext("utilities");
      if (!oCtx) return;

      const vFlag = oCtx.getProperty("isFooter");
      const isFooter = (vFlag === true || vFlag === "X" || vFlag === 1 || vFlag === "1");
      if (isFooter) return; // pas de nav sur la ligne total

      const period     = this.getView().getModel("utilities").getProperty("/period");
      const businessNo = oCtx.getProperty("business_no");

      // clé OData sûre
      const oMainModel = this.getOwnerComponent().getModel();
      const sKeyPath   = oMainModel.createKey("/ZC_FGASet", {
        p_period  : period,
        BusinessNo: businessNo
      }); // "/ZC_FGASet(p_period='...',BusinessNo='...')"

      // nav via router FE (clé attendue dans {keys1})
      const sKeys1 = sKeyPath.slice(sKeyPath.indexOf("(")); // "(...)"
      this.getOwnerComponent().getRouter().navTo("ZC_FGASet", { keys1: sKeys1 });
    }
  });
});