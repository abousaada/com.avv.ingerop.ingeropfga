sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend('com.avv.ingerop.ingeropfga.ext.Mission', {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf com.avv.ingerop.ingeropfga.ext.Mission
         */
        //	onInit: function () {
        //
        //	},
        /**
         * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
         * (NOT before the first rendering! onInit() is used for that one!).
         * @memberOf com.avv.ingerop.ingeropfga.ext.Mission
         */
        //	onBeforeRendering: function() {
        //
        //	},
        /**
         * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
         * This hook is the same one that SAPUI5 controls get after being rendered.
         * @memberOf com.avv.ingerop.ingeropfga.ext.Mission
         */
        //	onAfterRendering: function() {
        //
        //	},
        /**
         * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
         * @memberOf com.avv.ingerop.ingeropfga.ext.Mission
         */
        //	onExit: function() {
        //
        //	}

        onInit: function () {
            var oMissionModel = this.getOwnerComponent().getModel("utilities");
            this.getView().setModel(oMissionModel, "utilities");
        },

        onAddMission: function () {
            this.getView().getModel("utilities").addMissionNewLine();
            const oTable = this.byId("missionsTable");
            // Focus on the new row
            setTimeout(function () {
                const oRows = oTable.getRows();
                oRows[oRows.length - 1].focus();
            }, 200);
        },

        onDeleteMission: function(oEvent) {
            var oRowContext = oEvent.getSource().getBindingContext("utilities");
            
            var aMissions = this.getView().getModel("utilities").getProperty("/missions");
            
            var iIndex = aMissions.findIndex(function(mission) {
                return mission.MissionId === oRowContext.getProperty("MissionId") && 
                       mission.BusinessNo === oRowContext.getProperty("BusinessNo");
            });
            
            if (iIndex !== -1) {
                aMissions.splice(iIndex, 1);
                
                this.getView().getModel("utilities").setProperty("/missions", aMissions);
            }
        }

    });
});
