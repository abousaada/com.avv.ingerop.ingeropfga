sap.ui.define([
    "./helper",
], function (Helper) {
    "use strict";

    return {
        validMandatoryField: function(field){
            return function (value) {
                const isMandatory = field.getMandatory();
                return isMandatory && !value ? "Error" : "None";
            };
        },
        formatTotal: function(total, percent){
            const formatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 2,
                maxFractionDigits: 2,
            });
            const retTotal = formatInstance.format(total);
			return percent ? retTotal + "%": retTotal;
		},
        formatExterne:function(montant = 0, groupe = 0){
            montant = parseFloat(montant || 0);
            groupe  = parseFloat(groupe || 0);

            const formatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 2,
                maxFractionDigits: 2,
            });
            return formatInstance.format(montant - groupe);
        },
        formatCumulePercent:function(montant = 0, cumuleEur = 0){
            montant     = parseFloat(montant || 0);
            cumuleEur   = parseFloat(cumuleEur || 0);
            if(!montant || !cumuleEur){ return "0 %"; }

            const formatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 2,
                maxFractionDigits: 2,
            });
            return formatInstance.format(parseFloat( cumuleEur / montant * 100 )) + "%";

        },
        formatAVenir:function(montant = 0, cumuleEur = 0){
            montant     = parseFloat(montant || 0);
            cumuleEur   = parseFloat(cumuleEur || 0);
            const formatInstance = sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                minFractionDigits: 2,
                maxFractionDigits: 2,
            });
            return formatInstance.format(montant - cumuleEur);
        },
        formatNbMois:function(startDate, endDate ) {
            if(!startDate || !endDate){ return ; }
            return Helper.diffEnMois(new Date(startDate), new Date(endDate));
        },
        setNegativeRedValue: function (value, vIsFooter) {
            const isFooter = (vIsFooter === true || vIsFooter === 'X' || vIsFooter === 1 || vIsFooter === '1');
            if (isFooter) return 'None';
            return (Number(value) < 0) ? 'Error' : 'None';
        },
        buildFgaHref: function (sValue){
            var period = this.getView().getModel("utilities").getProperty("/period");
            return "#ZFGA-manage&/ZC_FGASet(p_period='" + period + "',BusinessNo='" + sValue + "')";
        },
        formatBusinessNo: function (sBusinessNo, vIsFooter) {
            const isFooter = (vIsFooter === true || vIsFooter === 'X' || vIsFooter === 1 || vIsFooter === '1');
            return isFooter ? 'TOTAL' : sBusinessNo;
        },
        formatInt: function (fValue) {
            if (fValue == null) {
                return "";
            }
            var  intVal = Math.round(fValue);
            // Formater avec séparateur "espace"
            return intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        }
    };
});