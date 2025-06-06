sap.ui.define(
	[
		"sap/ui/core/mvc/Controller"
	],
	function (BaseController) {
		"use strict";

		return BaseController.extend("com.avv.ingerop.fga.ingeropfga.v2.controller.BaseController", {
			/**
			 * Convenience method for accessing the router in every controller of the application.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter: function () {
				return this.getOwnerComponent().getRouter();
			},

			/**
			 * Convenience method for getting the view model by name in every controller of the application.
			 * @public
			 * @param {string} sName the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel: function (sName) {
				return this.getView().getModel(sName);
			},

			setAppVersion: function () {
				var sHash = window.location.hash;
				var aParams = sHash.split("?");
				var sParam = "";
				if (aParams.length > 1) {
					sParam = aParams[1];
				}
				if (sParam) {
					let searchParams = new URLSearchParams(sParam);
					let version = searchParams.get("version");
					if (version) {
						this.getModel("settings").setProperty("/version", version);
					}

				}
			},

			/**
			 * Convenience method for setting the view model in every controller of the application.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel: function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Convenience method for getting the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle: function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},


			cssRender: function (tableName) {
				var rows = this.byId(tableName).getRows();
				var that = this;
				rows.forEach(function (element, i) {
					var row = element;
					that.removeClass(row);
					var oCtx;
					var model;
					if (tableName === "itemsTablesDisplay") {
						oCtx = element.getBindingContext("itemsHierarch");
						if (oCtx) {
							model = oCtx.getProperty(oCtx.getPath());
							if (model && (parseFloat(model.DownPaymentChainItemIdHl) === 0) || !parseFloat(model.DownPaymentChainItemIdHl)) {
								that.addClassDark(row, model);
							} else if (model && model.Items && parseFloat(model.DownPaymentChainItemIdHl) !== 0) {
								that.addClassLight(row, model);
							}
						}
					} else if (tableName === "TableItems") {
						oCtx = element.getBindingContext("json");
						if (oCtx) {
							model = oCtx.getProperty(oCtx.getPath());
							if (model && (parseFloat(model.DownPaymentChainItemIdHl) === 0) || !parseFloat(model.DownPaymentChainItemIdHl)) {
								that.addClassDark(row, model);
							} else if (model && model.Childs === "X" && parseFloat(model.DownPaymentChainItemIdHl) !== 0) {
								that.addClassLight(row, model);
							}
						}
					}
				});
			},

			removeClass: function (row) {
				row.$().removeClass("darkblue");
				row.$().removeClass("lightblue");
			},

			addClassDark: function (row, model) {
				this.addClassIfDifferent(row, "darkblue");
			},

			addClassLight: function (row, model) {
				this.addClassIfDifferent(row, "lightblue");
			},

			addClassIfDifferent: function (row, className) {
				if (!row.$().hasClass(className)) {
					this.removeClass(row);
					row.$().addClass(className);
					return true;
				}
				return false;
			},

			addHistoryEntry: (function () {
				var aHistoryEntries = [];

				return function (oEntry, bReset) {
					if (bReset) {
						aHistoryEntries = [];
					}

					var bInHistory = aHistoryEntries.some(function (oHistoryEntry) {
						return oHistoryEntry.intent === oEntry.intent;
					});

					if (!bInHistory) {
						aHistoryEntries.push(oEntry);
						this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
							oService.setHierarchy(aHistoryEntries);
						});
					}
				};
			})(),

			fnGetTvaList: function (sCompany) { //Get filtered VAT list from company id
				var that = this;
				var aFilters = [];
				aFilters.push(new Filter("CompanyId", FilterOperator.EQ, sCompany));

				var oData = new JSONModel();
				oData.loadData("./model/mock/TVAList.json");

				that.getModel("TvaListModel").setData(oData.results);
				that.fnGetTvaListProrata(sCompany);

				/*this.getOwnerComponent().getModel().read("/TVAListSet", {
					filters: aFilters,
					success: function (oData) {
						that.getModel("TvaListModel").setData(oData.results);
						that.fnGetTvaListProrata(sCompany);
					},
					error: function (oError) {}
				});*/

			},

			fnToFixedAmounts: function (value, dp) { //Set value to fixed amount
				return +parseFloat(value).toFixed(dp);
			},
		});


	}
);
