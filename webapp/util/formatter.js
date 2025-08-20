sap.ui.define([
], function () {
    "use strict";

    return {
        validMandatoryField: function(field){
            return function (value) {
                const isMandatory = field.getMandatory();
                return isMandatory && !value ? "Error" : "None";
            };
        },
        formatTotal: function(total, percent){
			return percent ? total + "%": total;
		},
        formatExterne:function(montant = 0, groupe = 0){
            montant = parseFloat(montant);
            groupe  = parseFloat(groupe);
            return montant - groupe;
        },
        formatCumulePercent:function(montant = 0, cumuleEur = 0){
            montant     = parseFloat(montant);
            cumuleEur   = parseFloat(cumuleEur);
            if(!montant && !cumuleEur){ return "0 %"; }
            return ( cumuleEur / montant * 100 ).toString() + "%";
        },
        formatAVenir:function(montant = 0, cumuleEur = 0){
            montant     = parseFloat(montant);
            cumuleEur   = parseFloat(cumuleEur);
            return montant - cumuleEur
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