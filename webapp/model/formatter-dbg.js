sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		formatValueToFloat: function (sPercent) {
			return parseFloat(sPercent);
		},
		formatValueToFloatPercentage: function (sPercent) {
			if (sPercent) {
				if (isNaN(sPercent)) {
					return "0";
				} else {
					return parseFloat(sPercent).toFixed(0);
				}
			} else {
				return "0";
			}
		},
		formatValueToFloatPercentage0: function (sPercent) {
			if (sPercent) {
				if (isNaN(sPercent)) {
					return 0;
				} else {
					return Number(parseFloat(sPercent).toFixed(0));
				}
			} else {
				return 0;
			}
		},
		formatTotalWorkPercentValueColor: function (sPercent) {
			return parseFloat(sPercent) === 100 ? 'Good' : 'Neutral';
		},
		formatDocListLabel: function (sDecription, sId) {
			return "";
		},

		// ++LNA: 13/06/19
		setItemDescrEditable: function (sValue) {
			return sValue === "" || sValue === undefined || sValue === null ? true : false;
		},

		// ++LNA: 24/06/19
		remove0Before: function (sValue) {
			if (sValue) {
				return sValue.replace(/\b0+/g, '');
			}
		},

		formatBilledIcon: function (sValue) {
			if (sValue) {
				return "sap-icon://sys-enter-2";
			} else {
				return "";
			}
		},

		formatBilledColor: function (sValue) {
			if (sValue) {
				return "#2b7c2b";
			} else {
				return "";
			}
		},

		formatInput: function (sValue) {
			if (sValue) {
				sValue.replace(/\b0+/g, '');
				return parseFloat(sValue).toFixed(2);
			}
		},

		formatCanceledStatus: function (sValue) {
			if (sValue) {
				var sText = this.getModel("i18n").getResourceBundle().getText("Text_Canceled");
				return sText;
			} else {
				return "";
			}
		},

		formatCorrectionValue: function (sValue) {
			var sNumber = parseFloat(sValue) * (-1);
			return sNumber;
		},

		formatSubItm: function (sValue) {
			var subItm;
			if (sValue === "000000" || sValue === 0) {
				subItm = "";
			} else if (sValue === null || sValue === undefined) {
				subItm = "";
			} else {
				subItm = parseInt(sValue, 10);
			}
			return subItm;
		},

		fnSetBillingPercentage: function (AdvAmCumulated, HtCumulated) {
			// MTA - Corr - NE PAS DIVISER PAR 0
			var sTotal
			if (parseFloat(HtCumulated) === 0) {
				sTotal = 0;
			} else {
				sTotal = parseFloat(AdvAmCumulated) / parseFloat(HtCumulated) * 100;
				if (isNaN(sTotal)) {
					sTotal = 0;
				}
			}
			// END MTA
			sTotal = sTotal.toFixed(2).replace(".", ",");
			return sTotal;
		},

		fnSetBillingPercentage0: function (AdvAmCumulated, HtCumulated) {
			// MTA - Corr - NE PAS DIVISER PAR 0
			var sTotal
			if (parseFloat(HtCumulated) === 0) {
				sTotal = 0;
			} else {
				sTotal = parseFloat(AdvAmCumulated) / parseFloat(HtCumulated) * 100;
				if (isNaN(sTotal)) {
					sTotal = 0;
				}
			}
			// END MTA
			sTotal = sTotal.toFixed(0);
			return sTotal;
		},

		fnSetEditableStatus: function (sStatus, sChilds, sEditable) {
			if (sStatus === "O") { //Ouvert
				return sEditable;
			} else {
				return false;
			}
		},

		fnSetEditableHeaderStatus: function (sType, sStatus) {
			if (sStatus === "R" && !sType) { //Validated
				return false;
			} else if (sStatus === "O") {
				return true;
			} else {
				return false;
			}
		},

		fnSetEditableAdvances: function (sStatus, sBilled) {
			if (sStatus === "O") { //Ouvert
				if (sBilled === "X") {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},

		fnSetEditableSimpleStatus: function (sStatus) {
			if (sStatus === "O") {
				return true;
			} else {
				return false;
			}
		},

		// fnSetCorrectedAmount: function (AdvAmCumulated, HtCumulated, sChilds) {
		// if (sChilds === "X") {
		// 	var sTotalPercentage = parseFloat(AdvAmCumulated) / parseFloat(HtCumulated);
		// 	if (isNaN(sTotalPercentage)) {
		// 		sTotalPercentage = 0;
		// 	} else {
		// 		sTotalPercentage = Number(sTotalPercentage.toFixed(2));
		// 	}
		// 	var sTotal = (Number(HtCumulated) * sTotalPercentage).toFixed(2);
		// 	return sTotal;
		// }
		// }


		formatCurrency: function(oValue) {
            var iValue = parseFloat(oValue).toFixed(2);
            iValue = iValue.replace(".", ",")

            return iValue.replace(/\d(?=(\d{3})+\,)/g, '$&.');
        },

		fnSetEditableStatus: function (sStatus, sChilds, sEditable) {
			if (sStatus === "O") { //Ouvert
				return sEditable;
			} else {
				return false;
			}
		},
	};
});