sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
  ], function(Controller, JSONModel, MessageToast) {
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

            // Initialize models
            var oMissionModel = new JSONModel({
                missions: [],
                missionTypes: [
                    { code: "AVP", description: "AVP" },
                    { code: "PRO", description: "PRO" },
                    { code: "ACT", description: "ACT" },
                    { code: "DCE", description: "DCE" },
                    { code: "EXE", description: "EXE" }
                    // Add other mission types as needed
                ]
            });

            this.getView().setModel(oMissionModel);

            // Get reference to the main model to access business number
            this._oMainModel = this.getOwnerComponent().getModel();
        },

        onAddMission: function () {
            var oTable = this.byId("missionsTable");
            var oModel = oTable.getModel();
            var aMissions = oModel.getProperty("/missions");


            var oUtilities = sap.ui.getCore().getModel("utilities");
            var sBusinessNo = oUtilities.getProperty("/businessNo");

            // Get business number from main entity
            //var sBusinessNo = this._oMainModel.getProperty("/businessNo");

            // Generate mission number (001, 002, etc.)
            var sMissionNumber = this._padNumber(aMissions.length + 1, 3);

            // Create new mission
            var oNewMission = {
                businessNo: sBusinessNo,
                missionNumber: sMissionNumber,
                missionType: "",
                startDate: null,
                endDate: null,
                externalRevenue: 0,
                laborBudget: 0,
                subcontracting: 0,
                otherCosts: 0
            };

            aMissions.push(oNewMission);
            oModel.setProperty("/missions", aMissions);

            // Focus on the new row
            setTimeout(function () {
                var oRows = oTable.getRows();
                oRows[oRows.length - 1].focus();
            }, 200);
        },

        _padNumber: function (iNumber, iLength) {
            var sNumber = iNumber.toString();
            while (sNumber.length < iLength) {
                sNumber = "0" + sNumber;
            }
            return sNumber;
        },

        // Call this when saving the main entity to process all missions
        processMissions: function () {
            var aMissions = this.getView().getModel().getProperty("/missions");

            // Validate missions
            if (!this._validateMissions(aMissions)) {
                return false;
            }

            // Process missions (send to backend, etc.)
            // ...

            return true;
        },

        _validateMissions: function (aMissions) {
            var bIsValid = true;
            var aErrors = [];

            aMissions.forEach(function (oMission, iIndex) {
                if (!oMission.missionType) {
                    aErrors.push("Mission " + (iIndex + 1) + ": Type de mission requis");
                }
                if (!oMission.startDate) {
                    aErrors.push("Mission " + (iIndex + 1) + ": Date de début requise");
                }
                if (!oMission.endDate) {
                    aErrors.push("Mission " + (iIndex + 1) + ": Date de fin requise");
                }
                // Add other validations as needed
            });

            if (aErrors.length > 0) {
                MessageToast.show(aErrors.join("\n"));
                bIsValid = false;
            }

            return bIsValid;
        }


    });
});
