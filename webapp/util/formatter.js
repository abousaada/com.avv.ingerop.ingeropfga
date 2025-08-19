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
        }
    };
});