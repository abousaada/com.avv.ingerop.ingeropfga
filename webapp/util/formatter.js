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

        
		formatMonthLabel: function (sMonth, sYear) {
			return sMonth + "/" + sYear;
		},

    };
});