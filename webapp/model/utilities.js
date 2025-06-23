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

        async getBEMissions(period, businessNo){
            try {
                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);

                const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_Missions`;
                console.log(`retrieve missions with period: ${period} and BusinessNo: ${businessNo}`);
                
                const missions = await this.read(sPath);
                console.log(`Missions: ${missions?.results}` );
                return missions?.results || [];
            } catch (error) {
                console.log(error);
            }
        },

        async getBEPrevisions(period, businessNo){
            try {

                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);
                const sPath = `/ZC_FGA_PREVISIONS(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                console.log(`retrieve previsions with period: ${period} and BusinessNo: ${businessNo}`);
                
                const previsions = await this.read(sPath);
                console.log(`Previsions: ${previsions?.results}` );
                return previsions?.results || [];
            } catch (error) {
                console.log(error);
            }
        },

        async getBERecaps(period, businessNo){
            try {
                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);
                const sPath = `/ZI_FGA_RECAP(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                console.log(`retrieve recaps with period: ${period} and BusinessNo: ${businessNo}`);
                const recaps = await this.read(sPath);
                console.log(`recaps: ${recaps?.results}` );
                return recaps?.results || [];
            } catch (error) {
                console.log(error);
            }
        },

        setYearByPeriod(period){
            // Extract year from sPeriod (MMYYYY format)
            var sYear = period.substring(2);
            this.setYear(sYear);
        },

        getFormattedMissions(){
            return this.getMissions().map(mission => {
                mission.ExternalRevenue = parseFloat(mission.ExternalRevenue).toFixed(2).toString();
                mission.LaborBudget = parseFloat(mission.LaborBudget).toFixed(2).toString();
                return mission;
            });
        }

    });

});