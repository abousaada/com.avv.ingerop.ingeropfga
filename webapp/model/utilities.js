sap.ui.define([
    "./baseModel",
    "./utilities/initialData",
    "./utilities/formatter",
    "./utilities/filter"
], 
function (BaseModel, InitialData, Formatter, Filter) {
    "use strict";

    return BaseModel.extend("com.avv.ingerop.ingeropfga.model.utilities", {

        init: function (oModel) {
            this.setData(InitialData);
            this.initModel(oModel);
        },

        addMissionNewLine(){
            const oldMissions     = this.getMissions();
            const sBusinessNo   = this.getBusinessNo();
            const sMissionNumber = Formatter.getMissionsNumber(oldMissions.length +1);   

            // Create new mission
            const newMission = {
                BusinessNo: sBusinessNo,
                MissionId: sMissionNumber,
                MissionsCode: null,
                StartDate: null,
                EndDate: null,
                ExternalRevenue: 0.00,
                LaborBudget: 0.00,
                // Subcontracting: 0.00,
                // OtherCosts: 0.00
            };
            

            const newMissions = [...oldMissions, newMission];
            this.setMissions(newMissions);
        },

        // Call this when saving the main entity to process all missions
        validDataBeforeSave: function () {
            var aMissions = this.getMissions();

            // Validate missions
            if (!Filter.validateMissions(aMissions)) {
                return false;
            }

            return true;
        },

        async deepCreateFGA(data){
            try {
                const createdFGA = await this.create("/ZC_FGASet", data);
                console.log(createdFGA);
                return createdFGA;
            } catch (error) {
                console.log(error);
            }
        },

    });

});