sap.ui.define([
	'sap/ui/core/mvc/Controller',
	"com/avv/ingerop/ingeropfga/ext/controller/BaseController"
], function (Controller) {
	'use strict';

	return Controller.extend('com.avv.ingerop.ingeropfga.ext.Tab', {
		onInit: function () {
			//this.getRouter().getRoute("RouteSynthesis").attachPatternMatched(this.onObjectMatched, this);

			this.onObjectMatched();
			//var oSyntTable = this.getView().byId("synthesisTab");

			//oSyntTable.attachBrowserEvent("dblclick", this.onCellDblClickSyntTable.bind(this));

			if (!this._DrilldownDialogFrg) {
				this._DrilldownDialogFrg = this.loadFragment({
					name: "com.avv.ingerop.ingeropfga.ext.view.tab.synthese.dialog.DrilldownDialog"
				});
			}
		},

		onBeforeRendering: function () {
			//this.onObjectMatched();

		},

		onAfterRendering: function () {
			//this.onObjectMatched();
		},

		onCellDblClickSyntTable: function (oEvent) {
			var oSyntTable = this.getView().byId("synthesisTab");
			// oSyntTable._findAndfireCellEvent(null, oEvent);
			var oCellParams = this._getCellContext(oSyntTable, oEvent.target);
			if (!oCellParams) {
				return;
			}

			var sNature = oCellParams.rowBindingContext.getObject("NatureBudgetCode");
			var sPeriod = oSyntTable.getColumns()[oCellParams.columnIndex].data("Period");

			if (sNature && sPeriod) {
				this._displayComptaTable(sNature, sPeriod);
			}
		},

		onObjectMatched: function (oEvent) {
			//var oArgument = oEvent.getParameter("arguments");
			//var sId = oArgument.id;


			var sId = 'CC526901'

			//this.setAppVersion();

			this.getModel("rafList").setProperty("/results/0/Mission", sId);

			this._buildListLineData(sId);

			this._addSynthesisStyle();

			this._buildMoProfile();
			this._buildScProfile();
			this._buildStProfile();
			this._buildPrevProfile();

			this._calculAll();
		},

		onRowsUpdatedSyntTab: function () {
			this._addSynthesisStyle();
		},
		onRowsUpdatedBudgetTab: function () {
			var sTabName = this.getView().byId("budgetItb").getSelectedKey();
			this._addBudgetStyle(sTabName);
		},
		onRowsUpdatedSimulTab: function (oEvent) {
			var sTableId = oEvent.getSource().getId();
			if (sTableId.indexOf("SimulTab") !== -1) {
				this._addBudgetStyle(sTableId);
			} else {
				this._addPrevisionStyle(sTableId);
			}
		},

		onChangeBudget: function (oEvent) {
			this._persistBudgetValue(oEvent.getSource());

			this._calculAll();
		},

		onBtnOpenMOProfilePress: function () {
			this._ProfileType = "MO";
			this._openProfileDialog("MO");
		},
		onBtnOpenSCProfilePress: function () {
			this._ProfileType = "SC";
			this._openProfileDialog("SC");
		},
		onBtnOpenSTProfilePress: function () {
			this._ProfileType = "ST";
			this._openProfileDialog("ST");
		},

		onBtnProfileConfirmPressed: function () {
			this._persistProfileChange(this._ProfileType);
			this._closeDialog();
		},


		onBtnAddProfilePress: function () {
			let aProfileList = this.getModel("profileList").getProperty("/results");

			aProfileList.push({
				"ProfileNo": aProfileList.length + 1,
				"ProfileID": "",
				"ProfileName": "",
				"ProfileType": "",
				"ProfileRate": "1"
			});

			this.getModel("profileList").setProperty("/results", aProfileList);

		},

		onBtnCancelPressed: function () {
			this._closeDialog();
		},

		onChangeSimulation: function () {
			this._persistBudgetValue(oEvent.getSource());

			this._calculSimulation();
		},

		onRAFListItemPress: function (oEvent) {
			this.getModel("settings").setProperty("/displatRafDetail", true);
		},


		onNavToJournalEntry: function (oEvent) {
			// const CrossApplicationNavigation =  Container.getServiceAsync("CrossApplicationNavigation");
			var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");

			oCrossAppNav.hrefForExternalAsync({
				target: {
					semanticObject: "AccountingDocument",
					action: "displayFactSheet"
				},
				params: {
					"AccountingDocument": "100000000",
					"CompanyCode": "AR10",
					"FiscalYear": "2024"
				}
			}).then(function (hRef) {
				window.open(hRef, '_blank');
			});
		},


		/*********************************************************************************************
		 * Internal Methods
		 *********************************************************************************************/
		_persistBudgetValue: function (oSource) {
			var oValue = oSource.getValue();
			oSource.setValue(this.formatNumber(oValue));

			var oLinePath = oSource.getBindingContext("budget");
			var oFieldPath = oSource.getBinding("value").getPath();

			this.getModel("budget").setProperty(oLinePath + "/" + oFieldPath, this._convertToFloat(oValue));
		},

		_getCellContext: function (oTable, oTarget) {
			var $target = jQuery(oTarget);
			// find out which cell has been clicked
			var $cell = $target.closest(".sapUiTableDataCell");
			var sId = $cell.attr("id");
			var aMatches = /.*-row(\d*)-col(\d*)/i.exec(sId);
			var bCancel = false;
			var oParams = null;
			// TBD: cellClick event is currently not fired on row action cells.
			// If this should be enabled in future we need to consider a different set of event parameters.
			if (aMatches) {
				var iRow = aMatches[1];
				var iCol = aMatches[2];
				var oRow = oTable.getRows()[iRow];
				var oCell = oRow && oRow.getCells()[iCol];
				var iRealRowIndex = oRow && oRow.getIndex();
				var sColId = sap.ui.table.Column.ofCell(oCell).getId();
				var oRowBindingContext = oRow.getRowBindingContext();
				oParams = {
					rowIndex: iRealRowIndex,
					columnIndex: iCol,
					columnId: sColId,
					cellControl: oCell,
					rowBindingContext: oRowBindingContext,
					cellDomRef: $cell.get(0)
				};
			}
			return oParams;
		},
		_displayComptaTable: function (sNature, sPeriod) {
			if (!this._DrilldownDialogFrg) {
				this._DrilldownDialogFrg = this.loadFragment({
					name: "com.avv.ingerop.ingeropfga.ext.view.tab.synthese.dialog.DrilldownDialog"
				});
			}
			this._DrilldownDialogFrg.then(function (oDialog) {
				var oComptaTable = this.getView().byId("importComptaTab");
				var oVentilTable = this.getView().byId("importVentilTab");
				var aComptaFilter = [];
				var aVentilFilter = [];
				aComptaFilter.push(new sap.ui.model.Filter("NatureBudgetCode", "EQ", sNature));
				if (sPeriod === "CumulN-1") {
					aComptaFilter.push(new sap.ui.model.Filter("Period", "LT", "202301"));
					aVentilFilter.push(new sap.ui.model.Filter("Period", "LT", "202301"));
				} else if (sPeriod === "YearN") {
					aComptaFilter.push(new sap.ui.model.Filter("Period", "GE", "202301"));
					aVentilFilter.push(new sap.ui.model.Filter("Period", "GE", "202301"));
				} else if (sPeriod === "CumulN") {

				} else {
					aComptaFilter.push(new sap.ui.model.Filter("Period", "EQ", sPeriod));
					aVentilFilter.push(new sap.ui.model.Filter("Period", "EQ", sPeriod));

				}

				// oComptaTable.getBinding("rows").filter(aComptaFilter);
				// oVentilTable.getBinding("rows").filter(aVentilFilter);

				this._aComptaFilter = aComptaFilter;
				this._aVentilFilter = aVentilFilter;

				oComptaTable.rebindTable();
				oVentilTable.rebindTable();

				oDialog.open();
			}.bind(this));
		},

		onBeforeRebindTableCompta: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.filter = this._aComptaFilter;
		},

		onBeforeRebindTableVentil: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.filter = this._aVentilFilter;
		},

		_openProfileDialog: function (sType) {
			let oProfileModel = this.getModel("profile");

			this.getModel("profileList").setProperty("/type", sType);
			if (!this._ProfileDialog) {
				this._ProfileDialog = this.loadFragment({
					name: "com.avv.ingerop.ingeropfga.ext.view.tab.budget.dialog.ProfileDialog"
				});
			}
			switch (sType) {
				case "MO":
					this.getModel("profileList").setProperty("/results", oProfileModel.getProperty("/moProfile"));
					break;
				case "SC":
					this.getModel("profileList").setProperty("/results", oProfileModel.getProperty("/scProfile"));
					break;
				case "ST":
					this.getModel("profileList").setProperty("/results", oProfileModel.getProperty("/stProfile"));
					break;
			}
			this._ProfileDialog.then(function (oDialog) {
				oDialog.open();
			}.bind(this));
		},

		_persistProfileChange: function (sType) {
			let aProfileList = this.getModel("profileList").getProperty("/results");
			let oTable = null;
			switch (sType) {
				case "MO":
					this.getModel("profile").setProperty("/moProfile", aProfileList);
					this._buildMoProfile();
					// oTable = this.getView().byId("MOIncomeTab").invalidate();
					break;
				case "SC":
					this.getModel("profile").setProperty("/scProfile", aProfileList);
					this._buildScProfile();
					// oTable = this.getView().byId("SCIncomeTab").invalidate();
					break;
				case "ST":
					this.getModel("profile").setProperty("/stProfile", aProfileList);
					this._buildStProfile();
					// oTable = this.getView().byId("STIncomeTab").invalidate();
					break;
			}
			// this.getView().getModel("scProfile").refresh(true);
			this._calculAll();
		},

		_closeDialog: function () {
			if (this._DrilldownDialogFrg) {
				this._DrilldownDialogFrg.then(function (oDialog) {
					oDialog.close();
				});
			}
			if (this._ProfileDialog) {
				this._ProfileDialog.then(function (oDialog) {
					oDialog.close();
				});
			}
		},
		// Calcul
		_calculAll: function () {
			this._calculTotals();

			this._calculChartInfos();

		},

		_calculSimulation: function () {

		},

		_calculPlanningLine: function (oBudgetLine) {

		},

		_calculTotals: function () {
			var aBudgetLine = this.getModel("budget").getProperty("/results");
			var oMOProfile = this.getModel("moProfile").getData();
			var oSCProfile = this.getModel("scProfile").getData();
			var oSTProfile = this.getModel("stProfile").getData();
			var oTotalLine = {};

			for (var i in aBudgetLine) {
				var oLine = aBudgetLine[i];
				if (oLine.Type == "T") {
					var keys = Object.keys(oTotalLine);
					for (var k in keys) {
						var key = keys[k];
						if (typeof oTotalLine[key] === "number") {
							aBudgetLine[i][key] = this._convertToFloat(oTotalLine[key]);
						} else {
							aBudgetLine[i][key] = oTotalLine[key];
						}
					}

					this._refreshSyntheseData(oTotalLine);
				} else if (oLine.Type == "C") {
				} else if (oLine.Type == "V") {
				} else {

					oLine.MOYetToCome = 0;
					oLine.SCForecastExclCoef = 0;
					oLine.SCForecastInclCoef = 0;
					oLine.SCYetToCome = 0;
					oLine.INVContractInterUFO = 0;
					oLine.INVContractIntraUFO = 0;
					for (var n = 1; n <= 10; n++) {
						// Calculate line total
						// MO Profile
						var sProfileField = "Profile" + n;
						var oCalculMORate = this._convertToFloat(oLine[sProfileField]) * this._convertToFloat(oMOProfile[sProfileField + "Rate"]);
						oCalculMORate = this._convertToFloat(oCalculMORate);
						if (oLine.Status === "Acquis") {
							oLine.MOYetToCome += oCalculMORate;
						}

						if (!oTotalLine[sProfileField]) {
							oTotalLine[sProfileField] = 0;
						}
						oTotalLine[sProfileField] += oCalculMORate;

						// SC Supplier
						if (oLine.Status === "Acquis") {
							var sSupplierField = "Supplier" + n;
							var oSupplierValue = this._convertToFloat(oLine[sSupplierField]);
							var oCalculSCRate = oSupplierValue * this._convertToFloat(oSCProfile[sSupplierField + "Rate"]);
							oCalculSCRate = this._convertToFloat(oCalculSCRate);

							oLine.SCForecastExclCoef += oSupplierValue;
							oLine.SCForecastInclCoef += oCalculSCRate;

							if (!oTotalLine[sSupplierField]) {
								oTotalLine[sSupplierField] = 0;
							}
							oTotalLine[sSupplierField] += oSupplierValue;

						}

						// ST Profile
						var sInteralField = "Internal" + n;
						var oInternalValue = this._convertToFloat(oLine[sInteralField]);
						if (oSTProfile[sInteralField + "Type"] === "Inter UFO") {
							oLine.INVContractInterUFO += oInternalValue;
						} else if (oSTProfile[sInteralField + "Type"] === "Intra UFO") {
							oLine.INVContractIntraUFO += oInternalValue;
						}

						if (!oTotalLine[sInteralField]) {
							oTotalLine[sInteralField] = 0;
						}
						oTotalLine[sInteralField] += oInternalValue;

						// // Prevision
						// var sInteralField = "PrevProfile" + n;

						// oLine.PrevCost = oLine.SCForecastInclCoef 
						// 			   + oLine.MOForecast
						// 			   + oLine.OtherForecast;
						// oLine.PrevRBA = oLine.INVForecast - oLine.PrevCost;
						// if (oLine.INVForecast !== 0) {
						// 	oLine.PrevRBAP = oLine.PrevRBA / oLine.INVForecast;
						// }
						// if (oLine.PrevPhysProgress) {
						// 	oLine.PrevMOCostForecast = oLine.PrevPhysProgress * oLine.MOForecast;
						// }

					}
					// MO
					oLine.MOForecast = this._convertToFloat(oLine.CumulN) + this._convertToFloat(oLine.MOYetToCome);
					if (!oTotalLine.NbOfMonth) {
						oTotalLine.NbOfMonth = 0;
					}
					if (!oTotalLine.MOYetToCome) {
						oTotalLine.MOYetToCome = 0;
					}
					if (!oTotalLine.MOForecast) {
						oTotalLine.MOForecast = 0;
					}
					if (oLine.Status === "Acquis") {
						// oTotalLine.NbOfMonth += this._convertToFloat(oLine.NbOfMonth);
						oTotalLine.MOYetToCome += oLine.MOYetToCome;
						oTotalLine.MOForecast += oLine.MOForecast;
					}

					// SC
					if (!oTotalLine.SCForecastExclCoef) {
						oTotalLine.SCForecastExclCoef = 0;
					}
					if (!oTotalLine.SCForecastInclCoef) {
						oTotalLine.SCForecastInclCoef = 0;
					}
					if (oLine.Status === "Acquis") {
						oLine.SCYetToCome = this._convertToFloat(oLine.SCForecastInclCoef) - this._convertToFloat(oLine.SCActual);
						oTotalLine.SCForecastExclCoef += oLine.SCForecastExclCoef;
						oTotalLine.SCForecastInclCoef += oLine.SCForecastInclCoef;
					}

					// ST
					if (!oTotalLine.INVContractInterUFO) {
						oTotalLine.INVContractInterUFO = 0;
					}
					if (!oTotalLine.INVContractIntraUFO) {
						oTotalLine.INVContractIntraUFO = 0;
					}
					oTotalLine.INVContractInterUFO += oLine.INVContractInterUFO;
					oTotalLine.INVContractIntraUFO += oLine.INVContractIntraUFO;


					// Other
					if (!oTotalLine.TravelExpense) {
						oTotalLine.TravelExpense = 0;
					}
					if (!oTotalLine.OtherExpense) {
						oTotalLine.OtherExpense = 0;
					}
					if (!oTotalLine.DoubtfullDept) {
						oTotalLine.DoubtfullDept = 0;
					}
					if (!oTotalLine.Study) {
						oTotalLine.Study = 0;
					}
					if (!oTotalLine.ClaimLitigation) {
						oTotalLine.ClaimLitigation = 0;
					}
					if (!oTotalLine.OtherRisk) {
						oTotalLine.OtherRisk = 0;
					}
					if (!oTotalLine.OtherForecast) {
						oTotalLine.OtherForecast = 0;
					}
					if (!oTotalLine.OtherYetToCome) {
						oTotalLine.OtherYetToCome = 0;
					}
					oTotalLine.TravelExpense += this._convertToFloat(oLine.TravelExpense);
					oTotalLine.OtherExpense += this._convertToFloat(oLine.OtherExpense);
					oTotalLine.DoubtfullDept += this._convertToFloat(oLine.DoubtfullDept);
					oTotalLine.Study += this._convertToFloat(oLine.Study);
					oTotalLine.ClaimLitigation += this._convertToFloat(oLine.ClaimLitigation);
					oTotalLine.OtherRisk += this._convertToFloat(oLine.OtherRisk);

					oLine.OtherForecast = this._convertToFloat(oLine.TravelExpense) +
						this._convertToFloat(oLine.OtherExpense) +
						this._convertToFloat(oLine.DoubtfullDept) +
						this._convertToFloat(oLine.Study) +
						this._convertToFloat(oLine.ClaimLitigation) +
						this._convertToFloat(oLine.OtherRisk);
					oLine.OtherForecast = this._convertToFloat(oLine.OtherForecast);
					oTotalLine.OtherForecast += this._convertToFloat(oLine.OtherForecast);

					oLine.OtherYetToCome = this._convertToFloat(oLine.OtherForecast) - this._convertToFloat(oLine.OtherActual);
					oTotalLine.OtherYetToCome += this._convertToFloat(oLine.OtherYetToCome);

					aBudgetLine[i] = oLine;
				}

			}

			this.getModel("budget").setProperty("/results", aBudgetLine);
		},

		_calculChartInfos: function () {
			//this._calculRBAEvol();
		},

		_calculRBAEvol: function () {
			var aRBAEvolData = [];

			var oRBAInfo = this.getModel("recap").getProperty("/results").find(function (e) {
				return e.ID === "RBAP";
			});

			if (oRBAInfo) {
				//P0
				aRBAEvolData.push(this._addRBALine(oRBAInfo, "P0"));
				//Cumul N-1
				aRBAEvolData.push(this._addRBALine(oRBAInfo, "CumulN-1"));
				//Year N
				aRBAEvolData.push(this._addRBALine(oRBAInfo, "YearN"));
				//Month M
				aRBAEvolData.push(this._addRBALine(oRBAInfo, "MonthM"));
				//Forecast
				aRBAEvolData.push(this._addRBALine(oRBAInfo, "Forecast"));
			}

			this.getModel("rbaEvol").setProperty("/results", aRBAEvolData);

		},

		_refreshSyntheseData: function (oTotalLine) {
			var aSyntheseLine = this.getModel("synthesis").getProperty("/results");
			var oRecetteLine = null;
			var oChargeLine = null;
			var oTotalForecast = 0;
			var oRecette = 0;
			var oCharge = 0;
			// var oTotalYetToCome = 0;
			for (var x in aSyntheseLine) {
				if (!aSyntheseLine[x].TypeFact) {
					continue;
				}
				switch (aSyntheseLine[x].NatureBudgetCode) {
					case "B_RCAEXT": //Facturations externes
						if (oTotalLine.INVExt) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVExt);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_RCAEXT": //Facturations Groupe
						if (oTotalLine.INVGrp) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVGrp);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_RSTRIN": //Sous-traitance Inter UFO
						if (oTotalLine.INVContractInterUFO) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVContractInterUFO);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_RSTRIA": //Sous-traitance Intra UFO
						if (oTotalLine.INVContractIntraUFO) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVContractIntraUFO);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DMOINU": //Main d'Å’uvre ventilÃ©e UFO
						if (oTotalLine.MOForecast) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.MOForecast);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_RCAOTH": //Autres produits
						if (oTotalLine.INVOther) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.INVOther);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DMOEXU": //Main d'Å’uvre ventilÃ©e autres UFO/StÃ©s

						break;
					case "B_DDEPLA": //Voyages, dÃ©placements, rÃ©ception
						if (oTotalLine.TravelExpense) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.TravelExpense);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DTIRAG": //Autres frais de fonctionnement
						if (oTotalLine.OtherExpense) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.OtherExpense);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DFGXST": //Frais gÃ©nÃ©raux sur sous-traitance
						if (oTotalLine.SCForecastExclCoef > 0 && oTotalLine.SCForecastInclCoef > 0) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.SCForecastInclCoef) - this._convertToFloat(oTotalLine.SCForecastExclCoef);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DSTREX": //Sous-Traitances Tiers
						if (oTotalLine.SCForecastExclCoef) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.SCForecastExclCoef);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DETUDE"://Aleas Etude et travaux
						if (oTotalLine.Study) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.Study);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DSINIS": //Aleas Sinistres et contentieux
						if (oTotalLine.ClaimLitigation) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.ClaimLitigation);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;
					case "B_DIVERS": //Aleas divers
						if (oTotalLine.OtherRisk) {
							aSyntheseLine[x].Forecast = this._convertToFloat(oTotalLine.OtherRisk);
							aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
						}
						break;

				}

				if (aSyntheseLine[x].Type === "T") {
					if (aSyntheseLine[x].TypeFact === "RC") {
						oRecette += this._convertToFloat(oTotalForecast);
					} else if (aSyntheseLine[x].TypeFact === "MO" || aSyntheseLine[x].TypeFact === "OT") {
						oCharge += this._convertToFloat(oTotalForecast);
					}
					if (aSyntheseLine[x].TypeFact === "T") {
						aSyntheseLine[x].Forecast = oRecette - oCharge;
					} else if (aSyntheseLine[x].TypeFact === "CX") {
						aSyntheseLine[x].Forecast = oCharge;
					} else {
						aSyntheseLine[x].Forecast = this._convertToFloat(oTotalForecast);
					}
					aSyntheseLine[x].YetToCome = this._convertToFloat(aSyntheseLine[x].Forecast) - this._convertToFloat(aSyntheseLine[x].CumulN);
					if (aSyntheseLine[x].TypeFact === "RC") {
						oRecetteLine = $.extend({}, aSyntheseLine[x]);
					} else if (aSyntheseLine[x].TypeFact === "CX") {
						oChargeLine = $.extend({}, aSyntheseLine[x]);
					}
					oTotalForecast = 0;
				} else {
					oTotalForecast += this._convertToFloat(aSyntheseLine[x].Forecast);
				}
			}

			this.getModel("synthesis").setProperty("/results", aSyntheseLine);


			var aRecapLine = this.getModel("recap").getProperty("/results");
			var oRecapObject = {};

			for (var y in aRecapLine) {
				var oRecap = aRecapLine[y];

				switch (oRecap.ID) {
					case "FAC": // Facturation
						oRecap.Forecast = this._convertToFloat(oRecetteLine.Forecast);

						oRecap.CumulN = this._convertToFloat(oRecetteLine.CumulN);

						break;
					case "CHR": // Charges
						oRecap.Forecast = this._convertToFloat(oChargeLine.Forecast);

						oRecap.CumulN = this._convertToFloat(oChargeLine.CumulN);

						break;
					case "AP": // Avancement (%)
						oRecap.CumulN = this._convertToFloat(oChargeLine.CumulN) / this._convertToFloat(oChargeLine.Forecast);
						oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"], 3);
						oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"], 3);
						break;

				}

				if (oRecap.Type !== "P") {
					oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
					oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
					oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
				}

				oRecapObject[oRecap.ID] = $.extend({}, oRecap);


				aRecapLine[y] = oRecap;
			}

			for (var y in aRecapLine) {
				var oRecap = aRecapLine[y];

				switch (oRecap.ID) {
					case "CA":
						oRecap.Forecast = this._convertToFloat(oRecetteLine.Forecast);
						oRecap.CumulN = oRecapObject["AP"].CumulN * this._convertToFloat(oRecetteLine.Forecast);
						oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
						oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
						oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
						break;
					case "AJU": // Ajustement
						oRecap.CumulN = this._convertToFloat(oRecapObject["CA"].CumulN) - this._convertToFloat(oRecapObject["FAC"].CumulN);
						oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
						oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
						oRecap.YetToCome = 0;
						break;
					case "PAR": // PAT
						if ((this._convertToFloat(oRecetteLine.Forecast) - this._convertToFloat(oChargeLine.Forecast) < 0)) {
							oRecap.CumulN = (1 - this._convertToFloat(oRecapObject["AP"].CumulN)) * (this._convertToFloat(oRecetteLine.Forecast) - this._convertToFloat(oChargeLine.Forecast));
						} else {
							oRecap.CumulN = 0;
						}
						oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
						oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
						oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
						break;
					case "RBA": // RBA
						oRecap.Forecast = this._convertToFloat(oRecapObject["CA"].Forecast) - this._convertToFloat(oRecapObject["CHR"].Forecast);

						oRecap.CumulN = this._convertToFloat(oRecapObject["CA"].CumulN) - this._convertToFloat(oRecapObject["CHR"].CumulN) + this._convertToFloat(oRecapObject["PAR"].CumulN);
						oRecap.YearN = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulN-1"]);
						oRecap.MonthM = this._convertToFloat(oRecap.CumulN) - this._convertToFloat(oRecap["CumulM-1"]);
						oRecap.YetToCome = this._convertToFloat(oRecap.Forecast) - this._convertToFloat(oRecap.CumulN);
						break;
					case "RBAP": // RBA (%)
						oRecap.Forecast = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].Forecast) / this._convertToFloat(oRecapObject["CA"].Forecast), 3);
						oRecap.CumulN = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].CumulN) / this._convertToFloat(oRecapObject["CA"].CumulN), 3);
						oRecap.YearN = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].YearN) / this._convertToFloat(oRecapObject["CA"].YearN), 3);
						oRecap.MonthM = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].MonthM) / this._convertToFloat(oRecapObject["CA"].MonthM), 3);
						oRecap.YetToCome = this._convertToFloat(this._convertToFloat(oRecapObject["RBA"].YetToCome) / this._convertToFloat(oRecapObject["CA"].YetToCome), 3);
						break;
				}
				oRecapObject[oRecap.ID] = $.extend({}, oRecap);
			}


			this.getModel("recap").setProperty("/results", aRecapLine);
		},

		_addRBALine: function (oRBAInfo, sInfo) {
			return {
				"Type": this.getResourceBundle().getText("recap." + sInfo),
				"Percent": this._convertToPercent(oRBAInfo[sInfo])
			};
		},

		// Data management
		_buildListLineData: function (sId) {
			var oListLine = this.getModel("list").getProperty("/results").find(function (e) {
				return e.BusinessNo === sId;
			});

			this.getModel("listLine").setData(oListLine);
		},

		_buildMoProfile: function () {
			var sPrefix = "Profile";
			var aProfileData = this.getModel("profile").getProperty("/moProfile");
			// var aMOProfile = [];
			var oMOProfile = {};
			for (var i in aProfileData) {
				var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
				var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
				var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
				oMOProfile[sIDField] = aProfileData[i].ProfileID;
				oMOProfile[sRateField] = aProfileData[i].ProfileRate;
				oMOProfile[sNameField] = aProfileData[i].ProfileName;
			}

			this.getModel("moProfile").setData(oMOProfile);
		},
		_buildScProfile: function () {
			var sPrefix = "Supplier";
			var aProfileData = this.getModel("profile").getProperty("/scProfile");
			// var aMOProfile = [];
			var oSCProfile = {};
			for (var i in aProfileData) {
				var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
				var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
				var sTypeField = sPrefix + aProfileData[i].ProfileNo + "Type";
				var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
				oSCProfile[sIDField] = aProfileData[i].ProfileID;
				oSCProfile[sRateField] = aProfileData[i].ProfileRate;
				oSCProfile[sTypeField] = aProfileData[i].ProfileType;
				oSCProfile[sNameField] = aProfileData[i].ProfileName;
			}

			this.getModel("scProfile").setData(oSCProfile);
		},
		_buildStProfile: function () {
			var sPrefix = "Internal";
			var aProfileData = this.getModel("profile").getProperty("/stProfile");
			// var aMOProfile = [];
			var oSTProfile = {};
			for (var i in aProfileData) {
				var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
				var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
				var sTypeField = sPrefix + aProfileData[i].ProfileNo + "Type";
				var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
				oSTProfile[sIDField] = aProfileData[i].ProfileID;
				oSTProfile[sRateField] = aProfileData[i].ProfileRate;
				oSTProfile[sTypeField] = aProfileData[i].ProfileType;
				oSTProfile[sNameField] = aProfileData[i].ProfileName;
			}

			this.getModel("stProfile").setData(oSTProfile);
		},
		_buildPrevProfile: function () {
			var sPrefix = "PrevProfile";
			var aProfileData = this.getModel("profile").getProperty("/prevProfile");
			// var aMOProfile = [];
			var oPrevProfile = {};
			for (var i in aProfileData) {
				var sIDField = sPrefix + aProfileData[i].ProfileNo + "ID";
				var sRateField = sPrefix + aProfileData[i].ProfileNo + "Rate";
				var sNameField = sPrefix + aProfileData[i].ProfileNo + "Name";
				oPrevProfile[sIDField] = aProfileData[i].ProfileID;
				oPrevProfile[sRateField] = aProfileData[i].ProfileRate;
				oPrevProfile[sNameField] = aProfileData[i].ProfileName;
			}

			this.getModel("prevProfile").setData(oPrevProfile);
		},
		// utils
		_convertToFloat: function (oValue, sDecimal) {
			if (!oValue) {
				return 0;
			}
			var iDecimal = 2;
			if (sDecimal >= 0) {
				iDecimal = sDecimal;
			}
			return parseFloat(parseFloat(oValue.toString().replace(" ", "").replace(",", ".")).toFixed(iDecimal));
		},

		_convertToPercent: function (oValue, sDecimal) {
			if (!oValue) {
				return 0;
			}
			var iDecimal = 2;
			if (sDecimal) {
				iDecimal = sDecimal;
			}
			return parseFloat(parseFloat(oValue.toString().replace(" ", "").replace(",", ".") * 100).toFixed(iDecimal));
		},

		// Style management
		_addSynthesisStyle: function () {
			this._cssRender("synthesisTab");
		},

		_addBudgetStyle: function (tableName) {
			this._cssRender(tableName);
		},

		_addPrevisionStyle: function (tableName) {
			this._cssRenderPrevision(tableName);
		},

		_cssRender: function (tableName) {
			if (tableName == "synthesisTab") {
				this._cssRenderSynthesis(tableName);
			} else {
				this._cssRenderBudget(tableName);
			}
		},

		_cssRenderSynthesis: function (tableName) {
			var rows = this.getView().byId(tableName).getRows();
			rows.forEach(function (element, i) {
				var row = element;
				var rowDom = row.$();
				this._removeClass(rowDom);
				var oCtx = element.getBindingContext("synthesis");
				if (oCtx) {
					// var model = this.byId(tableName).getModel("devisItemDisplay").getProperty(oCtx.getPath());
					var model = oCtx.getProperty(oCtx.getPath());
					if (model.Type == "T") {
						this._addClass(rowDom, "totalLine");
					}
				}
			}.bind(this));

		},


		_cssRenderBudget: function (tableName) {
			var rows = this.getView().byId(tableName).getRows();
			rows.forEach(function (element, i) {
				var row = element;
				// this._removeClass(row);
				var oCtx = element.getBindingContext("budget");
				/*if (oCtx) {
					var rowDom = row.$();
					this._removeClass(rowDom);
					var model = oCtx.getProperty(oCtx.getPath());
					if (model.Type) {
						if (model.Type == "T") {
							this._addClass(rowDom, "totalLine");
						} else if (model.Type == "C") {
							this._addClass(rowDom, "totalLine");
						} else if (model.Type == "V") {
							this._addClass(rowDom, "totalLine");
						} 
						var aCells = row.getCells();
						for (var j in aCells) {
							var cell = aCells[j];
							var cellDom = cell.$().parent().parent();
							this._removeClass(cellDom);
						}

					} else {
						var oBudgetTabSettings = this.getModel("budgetTabSettings").getData();
						var aCells = row.getCells();
						for (var j in aCells) {
							var cell = aCells[j];
							var cellDom = cell.$().parent().parent();
							this._removeClass(cellDom);
							var sPath = "";
							var sClass = cell.getMetadata()._sClassName;
							switch(sClass) {
								case "sap.m.Text":
									sPath = cell.getBinding("text").getPath();
									break;
								case "sap.m.Input":
									sPath = cell.getBinding("value").getPath();
									break;
								case "sap.m.Select":
									sPath = cell.getBinding("selectedKey").getPath();
									break;
								case "sap.m.VBox":
									if (cell.getItems().length > 0) {
										sPath = cell.getItems()[0].getBinding("value").getPath();
									}
									break;
								default:
									break;
							}
							if (sPath &&$.inArray(sPath, oBudgetTabSettings.recommandedZone) != -1) {
								this._addClass(cellDom, "recommandedZone");
							} else if (sPath && $.inArray(sPath, oBudgetTabSettings.mandatoryZone) != -1) {
								this._addClass(cellDom, "mandatoryZone");
							}
						}
					}

					// var model = this.byId(tableName).getModel("devisItemDisplay").getProperty(oCtx.getPath());
					// var model = oCtx.getProperty(oCtx.getPath());
					// if (model.Type == "T") {
					// 	this._addClass(row, model);
					// }
				}*/
			}.bind(this));

		},

		_cssRenderPrevision: function (tableName) {
			var rows = this.getView().byId(tableName).getRows();
			rows.forEach(function (element, i) {
				var row = element;
				// this._removeClass(row);
				var oCtx = element.getBindingContext("prevision");
				if (oCtx) {
					var rowDom = row.$();
					this._removeClass(rowDom);
					var model = oCtx.getProperty(oCtx.getPath());
					var oBudgetTabSettings = this.getModel("budgetTabSettings").getData();
					var aCells = row.getCells();
					for (var j in aCells) {
						var cell = aCells[j];
						var cellDom = cell.$().parent().parent();
						this._removeClass(cellDom);
						var sPath = "";
						var sClass = cell.getMetadata()._sClassName;
						switch (sClass) {
							case "sap.m.Text":
								sPath = cell.getBinding("text").getPath();
								break;
							case "sap.m.Input":
								sPath = cell.getBinding("value").getPath();
								break;
							case "sap.m.Select":
								sPath = cell.getBinding("selectedKey").getPath();
								break;
							case "sap.m.VBox":
								if (cell.getItems().length > 0) {
									sPath = cell.getItems()[0].getBinding("value").getPath();
								}
								break;
							default:
								break;
						}
						if (sPath && $.inArray(sPath, oBudgetTabSettings.prevision) != -1) {
							this._addClass(cellDom, "recommandedZone");
						}
					}


					// var model = this.byId(tableName).getModel("devisItemDisplay").getProperty(oCtx.getPath());
					// var model = oCtx.getProperty(oCtx.getPath());
					// if (model.Type == "T") {
					// 	this._addClass(row, model);
					// }
				}
			}.bind(this));

		},

		_removeClass: function (element) {
			element.removeClass("totalLine");
			element.removeClass("mandatoryZone");
			element.removeClass("recommandedZone");
		},

		_addClassIfDifferent: function (element, className) {
			if (!element.hasClass(className)) {
				this._removeClass(element);
				element.addClass(className);
				return true;
			}
			return false;
		},

		_addClass: function (element, className) {
			this._addClassIfDifferent(element, className);
		},

		// formatter
		formatRecap: function (oValue, sType) {
			if (sType === "P") {
				return this._convertToPercent(oValue, 0) + "%";
			} else {
				return this.formatNumbToNoDecimal(oValue);
			}
		},

		formatPercent: function (oValue) {
			return this._convertToPercent(oValue);
		},

		formatNumber: function (oValue) {
			var iValue = this._convertToFloat(oValue);
			var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				"groupingEnabled": true,  // grouping is enabled
				"groupingSeparator": ' ', // grouping separator is '.'
				"groupingSize": 3,        // the amount of digits to be grouped (here: thousand)
				"decimalSeparator": ","   // the decimal separator must be different from the grouping separator
			});

			return oFormat.format(iValue);
		},

		formatNumbToNoDecimal: function (oValue) {
			var iValue = this._convertToFloat(oValue, 0);
			var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				"groupingEnabled": true,  // grouping is enabled
				"groupingSeparator": ' ', // grouping separator is '.'
				"groupingSize": 3,        // the amount of digits to be grouped (here: thousand)
				"decimalSeparator": ","   // the decimal separator must be different from the grouping separator
			});

			return oFormat.format(iValue);
		},

		onMissionLinkPress: function (oEvent) {
			// Get the binding context of the clicked link
			var oBindingContext = oEvent.getSource().getBindingContext("budget");
			var oData = oBindingContext.getObject();

			// Extract the document number (e.g., 40007)
			var sDocumentNumber = oData.Mission; // Assuming "Mission" contains the document number

			// Construct the URL for the Fiori app
			var sUrl = "#SalesDocument-display?SalesDocument=" + sDocumentNumber;

			// Navigate to the URL
			/*
			sap.ui.core.UIComponent.getRouterFor(this).navTo("SalesDocumentDisplay", {
				SalesDocument: sDocumentNumber
			}, true);*/

			window.open(
				"https://demo.augustareeves.fr/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-client=100&sap-language=EN#SalesDocument-display?SalesDocument=40000007",
				"_blank" // Open in a new tab
			);
		}
	});
});
