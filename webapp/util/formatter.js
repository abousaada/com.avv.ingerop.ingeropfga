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
        setNegativeRedValue: function (sValue) {
            return parseFloat(sValue) < 0 ? "Error" : "None";
        },
        buildFgaHref: function (sValue){
            var period = this.getView().getModel("utilities").getProperty("/period");
            return "#ZFGA-manage&/ZC_FGASet(p_period='" + period + "',BusinessNo='" + sValue + "')";
        }
    };
});