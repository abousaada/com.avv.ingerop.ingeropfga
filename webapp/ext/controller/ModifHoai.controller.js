
sap.ui.define([
	"com/avv/ingerop/ingeropfga/ext/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/avv/ingerop/ingeropfga/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/TablePersoController",
	"./PersonalizationService",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/Button"
], function (BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox, MessageToast, TablePersoController,
	DemoPersoService, Dialog, Text, Button) {
	"use strict";
	var that;
	return BaseController.extend("com.avv.ingerop.fga.ingeropfga.v2.controller.ModifHoai", {
		formatter: formatter,
		onInit: function () {

			this.getRouter().getRoute("RouteMain").attachPatternMatched(this.onObjectMatched, this);

			that = this;
			/*this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Modification").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.oModel = this.getOwnerComponent().getModel("list");
			this._oComponent = this.getOwnerComponent();*/

			/*var oListLine = this.oModel.getProperty("/results").find(function(e) {
				return e.BusinessNo === "MM410900";
			});

			this.getOwnerComponent().getModel("listLine").setData(oListLine);*/

			/*this.oModel.read("/MarketTypeListSet", {
				filters: aFilters, 
				success: function (oData) {
					var oMarketTypeListModel = new sap.ui.model.json.JSONModel();
					oMarketTypeListModel.setData(oData.results);
					that.getView().setModel(oMarketTypeListModel, "MarketTypeListModel");
				},
				error: function (oError) {
					console.log("Error fetching MarketTypeListSet", oError);
				}
			});*/

		},

		afterScroll: function () {
			jQuery.sap.delayedCall(100, null, function () {
				that.cssRender("TableItems");
			});
		},

		updateFga: function () {

		},


		onCancel: function () { //Cancel creation or modification
			var oModeli18n = this.getView().getModel("i18n").getResourceBundle();
			var sConfirmBoxTitle = oModeli18n.getText("Title_ChangesLost");
			var sTextConfirmTermination = oModeli18n.getText("Text_MessageSave");
			var sCancelText = oModeli18n.getText("Button_Cancel");
			var sConfirmText = oModeli18n.getText("Button_Validate");
			var oConfirmDialog = new Dialog({
				title: sConfirmBoxTitle,
				type: 'Message',
				content: new Text({
					text: sTextConfirmTermination
				}),
				beginButton: new Button({
					text: sCancelText,
					icon: "sap-icon://decline",
					press: function () {
						oConfirmDialog.close();
					}
				}),
				endButton: new Button({
					text: sConfirmText,
					icon: "sap-icon://accept",
					press: function () {

						that.getRouter().navTo("RouteMain");

						oConfirmDialog.close();
					}
				}),
				afterClose: function () {
					oConfirmDialog.destroy();
				}
			});
			oConfirmDialog.open();
		},
		onChangeLaw: function () {
			var oFormData = this.getModel("FormDataFix").getProperty("/HOAI_2021");
			var oArticle = this.getModel("defaultPhaseRate").getProperty("/results").find(function (e) {
				return e.Article == oFormData.Law;
			});

			if (oArticle.Rates) {
				oFormData.Realize = this._setDefaultRate(oArticle.Rates);
			}

		},

		onCalculate: function () {
			// this.computSeuilDansTableauReference(I, 27000, '35', TarifBase);
			// return ;
			this.getModel("settings").setProperty("/showResult", true);
			this.getModel("settings").setProperty("/showForm", false);

			var sNetFee;
			var sMwSt;

			//Tab1
			var oSelData = this.getModel("FormDataFix").getProperty("/HOAI_2021");
			var oFormData = this.getModel("FormData").getProperty("/HOAI_2021");
			// Get Interpolation data
			var aTarifByCost = this.getModel("tarifByCost").getProperty("/results");
			var oTabRef = this.getTarifReference(aTarifByCost, oSelData.Zone, oSelData.Cost, oSelData.Law);

			// this.setInterpolationData(oTabRef);
			oFormData.Interpolation = {
				"TarifBase": oTabRef.tarifBase,
				"TarifBaseMin": oTabRef.tarifBaseMin,
				"TarifBaseMax": oTabRef.tarifBaseMax,
				"TarifSup": oTabRef.tarifSup,
				"TarifSupMin": oTabRef.tarifSupMin,
				"TarifSupMax": oTabRef.tarifSupMax
			};

			var sNetPriceBase = this.computTarifBaseInterpolation(oTabRef.tarifBaseMin, oSelData.Cost, oTabRef.tarifBase, oTabRef.tarifSupMin, oTabRef.tarifSup);
			var sNetPriceSup = this.computTarifBaseInterpolation(oTabRef.tarifBaseMax, oSelData.Cost, oTabRef.tarifBase, oTabRef.tarifSupMax, oTabRef.tarifSup);

			// result

			oFormData.Result.Base = sNetPriceBase;
			var ref = sNetPriceSup - sNetPriceBase;
			oFormData.Result.OneQuarter = sNetPriceBase + ref * 1 / 4;
			oFormData.Result.TwoQuarter = sNetPriceBase + ref * 2 / 4;
			oFormData.Result.ThreeQuarter = sNetPriceBase + ref * 3 / 4;
			oFormData.Result.Sup = sNetPriceSup;

			switch (oSelData.TarifType) {
				case "1":
					sNetFee = sNetPriceBase;
					break;
				case "2":
					sNetFee = sNetPriceBase + ref * 1 / 4;
					break;
				case "3":
					sNetFee = sNetPriceBase + ref * 2 / 4;
					break;
				case "4":
					sNetFee = sNetPriceBase + ref * 3 / 4;
					break;
				case "5":
					sNetFee = sNetPriceSup;
					break;
			}


			//Affichage des UserInput selon le tableau des frais
			oFormData.Cost = oSelData.Cost;


			//Tab Leistungsphasen Pourcentage phase de travail
			oFormData.Realize["Total%"] = 0;
			oFormData.Realize["Totalâ‚¬"] = 0;

			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p1");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p2");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p3");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p4");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p5");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p6");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p7");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p8");
			oFormData.Realize = this.computRealizePhase(oFormData.Realize, oSelData.Realize, sNetFee, "p9");

			oFormData.Realize["Totalâ‚¬"] = oFormData.Realize["Totalâ‚¬"].toFixed(2);

			// Cout
			var sNetCost = parseFloat(oFormData.Realize["Totalâ‚¬"]);
			oFormData.NetCost = oFormData.Realize["Totalâ‚¬"];

			oFormData.SalesOrder = oSelData.SalesOrder;
			oFormData.Customer = oSelData.Customer;
			oFormData.WBSElement = oSelData.WBSElement;
			oFormData.Zone = this._getZoneText(oSelData.Zone);
			oFormData.TarifType = this._getTarifTypeText(oSelData.TarifType);
			oFormData.Law = this._getLawText(oSelData.Law);

			//Calcul de la TVA
			sMwSt = oSelData.VATPercent;
			oFormData.VATValue = (sMwSt / 100) * sNetCost;
			oFormData.VATPercent = sMwSt;

			//Calcul des frais bruts
			oFormData.BrutCost = sNetCost + oFormData.VATValue;

			this.getView().getModel("FormData").setProperty("/HOAI_2021", oFormData);
		},

		onCreateSO: function () {
			var oEntry = this._buildSOEntry();
			if (oEntry.Vbeln) {
				this._updateSo(oEntry);
			} else {
				this._createSo(oEntry);
			}
		},

		onDisplaySO: function () {
			var sVbeln = this.getModel("salesOrder").getProperty("/Vbeln");
			if (!sVbeln) {
				return;
			}
			sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oService) {
				oService.hrefForExternalAsync({
					target: {
						semanticObject: "SalesOrder",
						action: "displayFactSheet"
					},
					params: {
						"SalesOrder": sVbeln
					}
				}).then(function (sHref) {
					// Place sHref somewhere in the DOM
					window.open(sHref, "__blank");
				});
			});
		},

		onCloseDialog: function () {
			this._closeDialog();
		},


		getTarifReference: function (aTarifByCost, zoneTarifaire, coutEligible, article) {
			//I, 27000, 35, tarifBase
			var oTarifBase = 0;
			var oTarifBaseMin = 0;
			var oTarifBaseMax = 0;
			var oTarifSup = 0;
			var oTarifSupMin = 0;
			var oTarifSupMax = 0;
			var cost = parseFloat(coutEligible);
			//recherche de tableau: rÃ©cupÃ©rer tarif liÃ© Ã  l'article

			var oTarif = aTarifByCost.find(function (line) {
				return line.Article == article;
			});
			//recherche de tableau dans le json zoneTarifaire
			var aTarifByZone = oTarif.Tarifs.filter(function (line) {
				return line.Zone == zoneTarifaire;
			});
			// 
			for (var i in aTarifByZone) {
				var costLow = parseFloat(aTarifByZone[i].CostLow);
				var costHigh = parseFloat(aTarifByZone[i].CostHigh);

				if (cost <= costHigh && cost > costLow) {
					oTarifBase = aTarifByZone[i].CostLow;
					oTarifBaseMin = aTarifByZone[i].TarifLow1;
					oTarifBaseMax = aTarifByZone[i].TarifHigh1;
					oTarifSup = aTarifByZone[i].CostHigh;
					oTarifSupMin = aTarifByZone[i].TarifLow2;
					oTarifSupMax = aTarifByZone[i].TarifHigh2;

					break;
				}
			}
			return {
				"tarifBase": parseFloat(oTarifBase),
				"tarifBaseMin": parseFloat(oTarifBaseMin),
				"tarifBaseMax": parseFloat(oTarifBaseMax),
				"tarifSup": parseFloat(oTarifSup),
				"tarifSupMin": parseFloat(oTarifSupMin),
				"tarifSupMax": parseFloat(oTarifSupMax)
			};
		},

		_setDefaultRate: function (oRates) {
			var oRealize = {};
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p1");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p2");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p3");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p4");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p5");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p6");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p7");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p8");
			oRealize = this._setDefaultPhaseRate(oRealize, oRates, "p9");

			return oRealize;
		},

		_setDefaultPhaseRate: function (oRealize, oRates, sPhase) {

			if (oRates[sPhase]) {
				oRealize[sPhase + "Visible"] = true;
				oRealize[sPhase + "Flag"] = true;
				oRealize[sPhase + "%"] = oRates[sPhase];
			} else {
				oRealize[sPhase + "Visible"] = false;
				oRealize[sPhase + "Flag"] = false;
				oRealize[sPhase + "%"] = 0;
			}

			return oRealize;
		},

		_getZoneText: function (sId) {
			var oZoneModel = this.getModel("zone").getProperty("/results");

			var oZone = oZoneModel.find(function (e) {
				return e.ID === sId;
			});

			return oZone.Text;
		},

		_getTarifTypeText: function (sId) {
			var oModel = this.getModel("tarif").getProperty("/results");

			var oVal = oModel.find(function (e) {
				return e.ID === sId;
			});

			return oVal.Text;
		},

		_getLawText: function (sId) {
			var oModel = this.getModel("law").getProperty("/results");

			var oVal = oModel.find(function (e) {
				return e.ID === sId;
			});

			return oVal.Text;
		},

		_buildSOEntry: function () {
			return {
				"Vbeln": this.getModel("FormData").getProperty("/HOAI_2021/SalesOrder"),
				"Netwr": this.getModel("FormData").getProperty("/HOAI_2021/Realize/Totalâ‚¬"),
				"Waers": "EUR",
				"Pspnr": this.getModel("FormData").getProperty("/HOAI_2021/WBSElement")
			};
		},

		_createSo: function (oEntry) {
			var _this = this;
			sap.ui.core.BusyIndicator.show(10);
			this.getModel().create("/SalesOrderSet", oEntry, {
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					_this.getModel("salesOrder").setData(oData);
					if (oData.Vbeln) {
						_this._showSuccessDialog();
					} else {
						var sText = _this.getResourceBundle().getText("msg.so.create.ko");
						sap.m.MessageBox.error(sText);

					}
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var sText = _this.getModel("i18n").getResourceBundle().getText("msg.so.create.ko");
					sap.m.MessageBox.error(sText);

				}
			});
		},

		_updateSo: function (oEntry) {
			var _this = this;
			sap.ui.core.BusyIndicator.show(10);
			this.getModel().update("/SalesOrderSet('" + oEntry.Vbeln + "')", oEntry, {
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					_this.getModel("salesOrder").setData(oEntry);
					if (oEntry.Vbeln) {
						_this._showSuccessDialog();
					} else {
						var sText = _this.getResourceBundle().getText("msg.so.create.ko");
						sap.m.MessageBox.error(sText);

					}
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var sText = _this.getModel("i18n").getResourceBundle().getText("msg.so.create.ko");
					sap.m.MessageBox.error(sText);

				}
			});
		},

		_showSuccessDialog: function () {
			if (!this.oSuccessDialog) {
				this.loadFragment({ type: "XML", name: "com.arg.avv.hoai.view.fragment.dialog.SuccessDialog" }).then(function (oDialog) {
					this.oSuccessDialog = oDialog;
					oDialog.open();
				}.bind(this));
			} else {
				this.oSuccessDialog.open();
			}
		},

		_closeDialog: function () {
			if (this.oSuccessDialog) {
				this.oSuccessDialog.close();
			}
		},

		getModel: function (sModel) {
			return this.getOwnerComponent().getModel(sModel);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		computSeuilDansTableauReference: function (zoneTarifaire, coutEligible, article, tauxHonoraire, tarifByCost) {
		},

		computTarifBaseInterpolation: function (b, coutEligible, a, bb, aa) {
			var TarifBaseInterpolation = b + [(coutEligible - a) * (bb - b)] / (aa - a);

			return TarifBaseInterpolation;

		},

		computTarifTauxSuperieurDesFrais: function (c, coutEligible, a, cc, aa) {

			var TarifTauxSuperieurDesFrais = c + [(coutEligible - a) * (cc - c)] / (aa - a);

			return TarifTauxSuperieurDesFrais;

		},

		computRealizePhase: function (oFormData, oSelData, iNetFee, sPhase) {
			var oFormDataRes = oFormData;

			var sRealizePhasePercent = oSelData[sPhase + "%"];
			oFormDataRes[sPhase + "%"] = sRealizePhasePercent;
			oFormDataRes[sPhase + "â‚¬"] = (iNetFee * (sRealizePhasePercent / 100)).toFixed(2);
			oFormDataRes[sPhase + "Flag"] = oSelData[sPhase + "Flag"];
			oFormDataRes[sPhase + "Visible"] = oSelData[sPhase + "Visible"];
			oFormDataRes["Total%"] += (oSelData[sPhase + "Flag"]) ? parseFloat(oFormDataRes[sPhase + "%"]) : 0;
			oFormDataRes["Totalâ‚¬"] += (oSelData[sPhase + "Flag"]) ? parseFloat(oFormDataRes[sPhase + "â‚¬"]) : 0;

			return oFormDataRes;
		},


		onAddHOAIItems: function () {
			// Get the tree and its binding
			var oTree = this.byId("budgetTree");
			var oBinding = oTree.getBinding("items");

			// Get the current data from the model
			var aData = this.getView().getModel("budget").getProperty("/results");

			// Find the "Order 4000007" node
			var oCommandeNode = this._findNodeByText(aData, "Order 4000007");

			if (oCommandeNode) {
				// Create HOAI items
				var aHOAIItems = this._createHOAIItems();

				// Add them as children
				if (!oCommandeNode.nodes) {
					oCommandeNode.nodes = [];
				}
				oCommandeNode.nodes = oCommandeNode.nodes.concat(aHOAIItems);

				// Update the model
				this.getView().getModel("budget").setProperty("/results", aData);

				// Refresh the tree binding
				oBinding.refresh();
			}
		},

		_findNodeByText: function (aNodes, sText) {
			for (var i = 0; i < aNodes.length; i++) {
				if (aNodes[i].Mission === sText) {
					return aNodes[i];
				}
				if (aNodes[i].nodes) {
					var oFound = this._findNodeByText(aNodes[i].nodes, sText);
					if (oFound) return oFound;
				}
			}
			return null;
		},

		_createHOAIItems: function () {
			// Create items based on your HOAI table structure
			return [
				{
					Mission: "HOAI Phase 1",
					nodes: [
						{ Mission: "Realize P1" },
						{ Mission: "Realize P2" },
						// Add all other phases as needed
					]
				}
			];
		}

	});
});
