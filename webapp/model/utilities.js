sap.ui.define([
    "./baseModel",
    "./utilities/initialData",
    "./utilities/formatter",
    "./utilities/filter",
    // ""
],
    function (BaseModel, InitialData, Formatter, Filter, /* Helper */) {
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
                const sBusinessNo = this.getBusinessNo();
                const sMissionNumber = Formatter.getMissionsNumber(oldMissions.length + 1);

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

            async deepCreateFGA(data) {
                try {
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
                    const createdFGA = await this.create("/ZC_FGASet", data);
                    console.log(createdFGA);
                    return createdFGA;
                } catch (error) {
                    console.log(error);
                    // Helper.errorMessage("Creation error: " + error?.responseText );
                }
            },

            async deepUpdatedFGA(data) {
                const businessNo = this.getBusinessNo();
                const period = this.getPeriod();
                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);
                const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')`
                const updatedFGA = await this.update(sPath, data);
                console.log(updatedFGA);
                return updatedFGA;
            },

            async deepDeleteFGA() {
                const businessNo = this.getBusinessNo();
                const period = this.getPeriod();
                const urlBusinessNo = encodeURIComponent(businessNo);
                const urlPeriod = encodeURIComponent(period);
                const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')`
                const deletedFGA = await this.delete(sPath);
                console.log(deletedFGA);
                return deletedFGA;
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

            setYearByPeriod(period) {
                this.setPeriod(period);

                // Extract year from sPeriod (MMYYYY format)
                var sYear = period.substring(2);
                this.setYear(sYear);
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