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
    };
});