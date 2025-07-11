sap.ui.define([
    "./baseModel",
    "./utilities/initialData",
    "./utilities/formatter",
    "./utilities/filter",
    "../util/constant"
],
    function (BaseModel, InitialData, Formatter, Filter, Constant) {
        "use strict";

        return BaseModel.extend("com.avv.ingerop.ingeropfga.model.utilities", {

            init: function (oModel) {
                this.setData({ ...InitialData });
                this.initModel(oModel);
            },

            reInit() {
                this.setData({ ...InitialData });
            },

            addMissionNewLine() {
                const oldMissions = this.getMissions();
                const BusinessNo = this.getBusinessNo().slice(0, -2); // <-- ABO
                //let MissionId = Formatter.getMissionsNumber(oldMissions.length + 1); 

                const maxMission = oldMissions // <-- ABO : added this fix 
                    .filter(mission => mission.BusinessNo === BusinessNo)
                    .reduce((max, current) => {
                        const currentMatch = current.MissionId.match(/-(\d+)$/);
                        const currentNum = currentMatch ? parseInt(currentMatch[1]) : 0;

                        const maxMatch = max.MissionId?.match(/-(\d+)$/); 
                        const maxNum = maxMatch ? parseInt(maxMatch[1]) : 0;

                        return currentNum > maxNum ? current : max;
                    }, { MissionId: `${BusinessNo}-000` }); 

                const match = maxMission.MissionId.match(/-(\d+)$/);
                const currentMax = match ? parseInt(match[1]) : 0;
                const nextNum = currentMax + 1;
                const paddedNum = String(nextNum).padStart(3, '0'); // add zeros "005"
                const MissionId = `${BusinessNo}-${paddedNum}`; // "MEDXXXXXX000000069-005"


                // Create new mission
                const newMission = { BusinessNo, MissionId, ...Constant.defaultMission };
                const newMissions = [...oldMissions, newMission];
                this.setMissions(newMissions);
            },

            // Call this when saving the main entity to process all missions
            validDataBeforeSave: function () {
                return this.validMissions() && this.validFGAHeaderFields();
            },

            // Validate missions
            validMissions(){
                var aMissions = this.getMissions();
                if (!Filter.validateMissions(aMissions)) { 
                    return false;
                }
                return true;
            },

            validFGAHeaderFields(){

            },

            // const data = {
                    //     "BusinessName": "Nom de l'affaire : text XP",
                    //     "CompanyCode": "9000",
                    //     "PROFITCENTER": "MEDNBTS000",
                    //     "Mission": "05",
                    //     "StartDate": new Date("2025-01-01"),
                    //     "EndDate": new Date("2025-02-28"),
                    //     "to_Missions": [
                    //         {
                    //             "MissionId": "001",
                    //             // "BusinessNo": "AFFAIRE123",
                    //             "MissionCode": "AVP",
                    //             "StartDate": new Date("2025-01-01"),
                    //             "EndDate": new Date("2025-01-30"),
                    //             "ExternalRevenue": "100000.00",
                    //             "LaborBudget": "50000.00"
                    //         },
                    //         {
                    //             "MissionId": "002",
                    //             // "BusinessNo": "AFFAIRE123",
                    //             "MissionCode": "PRO",
                    //             "StartDate": new Date("2025-01-01"),
                    //             "EndDate": new Date("2025-01-30"),
                    //             "ExternalRevenue": "150000.00",
                    //             "LaborBudget": "75000.00"
                    //         }
                    //     ]
                    // };

            async deepCreateFGA(data) {
                try {
                    const createdFGA = await this.create("/ZC_FGASet", data);
                    console.log(createdFGA);
                    return createdFGA;
                } catch (error) {
                    console.log(error);
                    // Helper.errorMessage("Creation error: " + error?.responseText );
                }
            },

            /*async deepUpdatedFGA(data) {
                const businessNo = this.getBusinessNo();
                const period = this.getPeriod();
                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);
                const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')`
                const updatedFGA = await this.update(sPath, data, { method: 'PATCH' } );
                console.log(updatedFGA);
                return updatedFGA;
            },*/

            /*async deepDeleteFGA() {
                const businessNo = this.getBusinessNo();
                const period = this.getPeriod();
                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);
                const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')`
                const deletedFGA = await this.delete(sPath);
                console.log(deletedFGA);
                return deletedFGA;
            },*/

            async deepUpdatedFGA(data) {
                try {
                    const createdFGA = await this.create("/ZC_FGASet", data);
                    console.log(createdFGA);
                    return createdFGA;
                } catch (error) {
                    console.error('Error in deepUpdatedFGA:', error);
                    throw error;
                }
            },

            async deepUpsertFGA(data){
                try {
                    const createdFGA = await this.create("/ZC_FGASet", data);
                    console.log(createdFGA);
                    return createdFGA;
                } catch (error) {
                    console.error('Error in deepUpdatedFGA:', error);
                    throw error;
                }
            },

            async getBEMissions() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);

                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_Missions`;
                    console.log(`retrieve missions with period: ${period} and BusinessNo: ${businessNo}`);
                    const missions = await this.read(sPath);
                    return missions?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBEPrevisions() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_PREVISIONS(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve previsions with period: ${period} and BusinessNo: ${businessNo}`);
                    const previsions = await this.read(sPath);
                    return previsions?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBERecaps() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZI_FGA_RECAP(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve recaps with period: ${period} and BusinessNo: ${businessNo}`);
                    const recaps = await this.read(sPath);
                    return recaps?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBEOpport() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/zc_fga_opport(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve recaps with period: ${period} and BusinessNo: ${businessNo}`);
                    const opport = await this.read(sPath);
                    return opport?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            setYearByPeriod(period) {
                // Extract year from sPeriod (MMYYYY format)
                var sYear = period.substring(2);
                this.setYear(sYear);
                this.setPeriod(period);
            },

            getFormattedMissions() {
                return this.getMissions().map(mission => {
                    mission.ExternalRevenue = parseFloat(mission.ExternalRevenue).toFixed(2).toString();
                    mission.LaborBudget = parseFloat(mission.LaborBudget).toFixed(2).toString();
                    return mission;
                });
            }

        });

    });