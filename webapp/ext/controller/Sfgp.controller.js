sap.ui.define([
    "sap/ui/core/mvc/Controller"
  ], function (Controller) {
    "use strict";
  
    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.Sfgp", {
      onInit: function () {
        const oData = {
          recapData: [{
            RG1: "Affaire Mère", RG2: '20%', RG3: "BAE1", RG4: "Santé", RG5: "715 000", RG6: "480 000", RG7: "235 000",
            RG8: "400 000", RG9: "50 000", RG10: "30 000", RG11: "480 000",
            RG12: "240 000", RG13: "30 000", RG14: "18 000", RG15: "288 000", RG16: "60%",
            RG17: "160 000", RG18: "20 000", RG19: "12 000", RG20: "192 000"
          }]
        };
        this.getView().setModel(new sap.ui.model.json.JSONModel(oData));

        var oTable = this.byId("sfgpTable");
        if (oTable) {
            oTable.attachRowsUpdated(this._styleFooterRow, this);
        }
      },
  
      onAfterRendering: function () {
        const oTable = this.byId("sfgpTable");
        if (!oTable) return;
  
        setTimeout(() => {
            const $table = oTable.$();
            const $firstRow = $table.find(".sapUiTableColHdrTr").first();

            ["Récap Projet", "Budget Fin d’affaire", "Réalisé", "RAD"].forEach(group => {
                const tds = $firstRow.find("td").filter(function () {
                  return $(this).text().trim() === group;
                });
                if (tds.length > 1) {
                  tds.first().attr("colspan", tds.length).css({
                    "text-align": "center",
                    "border-bottom": "1px solid #ccc"
                  });
                  for (let i = 1; i < tds.length; i++) {
                    tds.eq(i).remove();
                  }
                }
                const recapCells = $firstRow.find("td").filter(function () {
                    return $(this).text().trim() === "RECAP Projet";
                  });
                
                  recapCells.css({
                    "text-align": "center",
                    "vertical-align": "middle",
                    "font-weight": "bold"
                  });
              });
            
          }, 0);

        oTable.getColumns().forEach((oCol) => {
            oCol.setResizable(false);
        
            let width = oCol.getWidth();
            if (!width || width === "") {
              // Valeur par défaut si vide
              width = "8rem";
              oCol.setWidth(width);
            }
          });
          oTable.attachColumnMove(function(oEvent) {
              oEvent.preventDefault();
          });

          var aData = oTable.getBinding("rows").getModel().getProperty("/recapData");
          oTable.setVisibleRowCount(aData.length + 1 || 1); // 1 minimum pour afficher le header et +1 pour compter le footer

          this._addFooterRow();
        },

        _addFooterRow: function () {
            const oTable = this.byId("sfgpTable");
            if (!oTable) return;

            const oModel = oTable.getModel();
            const aData = oModel.getProperty("/recapData") || [];

            // Ajoute une ligne vide avec un indicateur
            aData.push({
                isFooter: true,
            });

            oModel.setProperty("/recapData", aData);
        },

        _styleFooterRow: function () {
            const oTable = this.byId("sfgpTable");
            const aRows = oTable.getRows();

            const oFooterRow = aRows[aRows.length - 1]; // Dernière ligne
            const aCells = oFooterRow.getCells(); // Les contrôles des cellules
            if (aCells.length > 0) {
              aCells[0].setText("TOTAL"); // Seulement si c'est un sap.m.Text / sap.m.Label
            }

            aRows.forEach(oRow => {
                const oContext = oRow.getBindingContext();
                if (oContext && oContext.getProperty("isFooter")) {
                    oRow.addStyleClass("sfgpFooterRow");

                    // Fusionner les 3 premières cellules (DOM manipulation)
                    setTimeout(() => {
                        const $cells = oRow.$().find(".sapUiTableCell");
                        if ($cells.length >= 3) {
                            // Mettre le texte de la 1ère cellule
                            const $firstCell = $cells.eq(0);
                            $firstCell.attr("colspan", 3);
                            $firstCell.css({
                                "text-align": "center",
                                "font-weight": "bold",
                                "color": "white"
                            });

                            // Supprimer les 2 autres cellules visuellement
                            $cells.eq(1).remove();
                            $cells.eq(2).remove();
                        }
                    }, 0);

                } else {
                    oRow.removeStyleClass("sfgpFooterRow");
                }
            });
        }
    });
  });
  