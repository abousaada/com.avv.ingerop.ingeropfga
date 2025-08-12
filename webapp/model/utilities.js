sap.ui.define([
    "./baseModel",
    "./utilities/initialData",
    "./utilities/formatter",
    "./utilities/filter",
    "./utilities/subContracting",
    "../util/constant",
    "../util/helper",
    "../ext/controller/helpers/Missions",
],
    function (BaseModel, InitialData, Formatter, Filter, SubContracting, Constant, Helper,Missions) {
        "use strict";

        return BaseModel.extend("com.avv.ingerop.ingeropfga.model.utilities", {

            init: function (oModel) {
                this.setData({ ...InitialData });
                this.initModel(oModel);
                this.oSubContracting = new SubContracting(this);
            },

            setView(oView){
                this.oView = oView;
            },

            reInit() {
                this.setData({ ...InitialData });
            },

            buildPxSubContractingTreeData() {
                const { treeData, treeHeader } = this.oSubContracting.buildTreeData();
                this.setPxSubContractingHierarchy(treeData);
                this.setPxSubContractingHeader(treeHeader);
            },

            async getBEDatas() {
                try {
                    const [missions, previsions, recaps, opport, charts, chartsadddata, pxAutres, pxSubContracting, notes] = await Promise.all([
                        this.getBEMissions(),
                        this.getBEPrevisions(),
                        this.getBERecaps(),
                        this.getBEOpport(),
                        this.getBECharts(),
                        this.getBEChartsAdditionalData(),

                        //Bugets PX
                        this.getBEPxAutres(),
                        this.getBEPxExtSubContracting(),

                        //Notes
                        this.getBENotes()
                    ]);

                    this.setMissions(missions || []);
                    this.setRecaps(recaps || []);
                    this.setPrevisions(previsions || []);
                    this.setOpport(opport || []);
                    this.setCharts(charts || []);
                    this.setChartsAdditionalData(chartsadddata || []);
                 
                    //Bugets PX
                    this.setPxAutres(pxAutres || []);

                    this.setPxSousTraitance(pxSubContracting || []);
                    // A REMETTRE PROPRE
                    this.onCalculChartsData(previsions, recaps, charts, chartsadddata);
                //Notes
                    this.setNotes(notes);

                } catch (error) {
                    console.log(error);
                }
            },

            //fonction qui construit le model pour chart
            onCalculChartsData: function (oModelSynthesis, oModelRecap, oModelChart, oModelAdditionnalChart) {
                var aData = [];
                var aDataChart = [];

                // boucle sur model recap
                for (var i = 0; i < oModelRecap.length; i++) {
                    //Chiffre d'affaire
                    if (oModelRecap[i].row_type === "CA") {
                        var oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "Réalisé",
                            Valeur: oModelRecap[i].cumul_ce_jour
                        };
                        aData.push(oItem);

                        oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "A venir",
                            Valeur: oModelRecap[i].reste_a_venir
                        };
                        aData.push(oItem);
                    }

                    if (oModelRecap[i].row_type === "CA") {
                        var oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "Réalisé",
                            Valeur: oModelRecap[i].cumul_ce_jour
                        };
                        aData.push(oItem);

                        oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "A venir",
                            Valeur: oModelRecap[i].reste_a_venir
                        };
                        aData.push(oItem);
                    }

                    if (oModelRecap[i].row_type === "FACT") {
                        var oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "Réalisé",
                            Valeur: oModelRecap[i].cumul_ce_jour
                        };
                        aData.push(oItem);

                        oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "A venir",
                            Valeur: oModelRecap[i].reste_a_venir
                        };
                        aData.push(oItem);
                    }

                    if (oModelRecap[i].row_type === "CHARGE") {
                        var oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "Réalisé",
                            Valeur: oModelRecap[i].cumul_ce_jour
                        };
                        aData.push(oItem);

                        oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "A venir",
                            Valeur: oModelRecap[i].budget_initial
                        };
                        aData.push(oItem);
                    }

                    if (oModelRecap[i].row_type === "CHARGE") {
                        var oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "Réalisé",
                            Valeur: oModelRecap[i].cumul_ce_jour
                        };
                        aData.push(oItem);

                        oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "A venir",
                            Valeur: oModelRecap[i].budget_initial
                        };
                        aData.push(oItem);
                    }
                }

                //boucle sur model synthesis
                for (var j = 0; j < oModelSynthesis.length; j++) {
                    // MAIN D'OEUVRE
                    if (oModelSynthesis[j].line_item === "MAIN_OEUV") {
                        var oItem = {
                            Categorie: oModelSynthesis[j].description,
                            Type: "Réalisé",
                            Valeur: oModelSynthesis[j].CumulN
                        };
                        aData.push(oItem);

                        oItem = {
                            Categorie: oModelSynthesis[j].description,
                            Type: "A venir",
                            Valeur: oModelSynthesis[j].AVenir
                        };
                        aData.push(oItem);
                    }
                }

                for (var g = 0; g < oModelAdditionnalChart.length; g++) {
                    if (oModelAdditionnalChart[g].line_item === "DELAIS") {
                        if (oModelAdditionnalChart[g].Type === "Realised") {
                            var oItem = {
                                Categorie: oModelAdditionnalChart[g].description,
                                Type: "Réalisé",
                                Valeur: oModelAdditionnalChart[g].Value
                            };
                            aData.push(oItem);
                        }
                        else {
                            var oItem = {
                                Categorie: oModelAdditionnalChart[g].description,
                                Type: "A venir",
                                Valeur: oModelAdditionnalChart[g].Value
                            };
                            aData.push(oItem);
                        }
                    }
                    if (oModelAdditionnalChart[g].line_item === "JH") {
                        if (oModelAdditionnalChart[g].Type=== "Realised") {
                            var oItem = {
                                Categorie: oModelAdditionnalChart[g].description,
                                Type: "Réalisé",
                                Valeur: oModelAdditionnalChart[g].Value
                            };
                            aData.push(oItem);
                        }
                        else {
                            var oItem = {
                                Categorie: oModelAdditionnalChart[g].description,
                                Type: "A venir",
                                Valeur: oModelAdditionnalChart[g].Value
                            };
                            aData.push(oItem);
                        }
                    }
                }

                // var oModelData = new sap.ui.model.json.JSONModel({ results: aData });
                // this.getView().setModel(oModelData, "chart");
                this.setCharts(aData);


                // 2ème graphique - Facturation et dépenses 12 derniers mois
                var oRecettes = oModelChart.find(obj => obj.line_item === "RECETTES");
                var oCharges = oModelChart.find(obj => obj.line_item === "CHARGES");

                if (oRecettes && oCharges) {
                    const totalMonths = 12; 

                    const [endMonth, endYear] = oRecettes.period.split("/").map(Number);
                    
                    let startMonth = endMonth;
                    let startYear = endYear;

                    var aDataChart = []; 

                    for (let i = 0; i < totalMonths; i++) {
                        let realMonth = startMonth - i;
                        let realYear = startYear;
                        
                        if (realMonth <= 0) {
                            realMonth += 12;
                            realYear -= 1; 
                        }

                        const label = String(realMonth).padStart(2, "0") + "/" + realYear;

                        const monthIndex = "Month" + String(i + 1).padStart(2, "0");

                        if (oRecettes[monthIndex] !== undefined && oCharges[monthIndex] !== undefined) {
                            aDataChart.push({
                                Periode: label,
                                Facturation: parseFloat(oRecettes[monthIndex]) || 0,
                                Depense: parseFloat(oCharges[monthIndex]) || 0
                            });
                        }
                    }
                    aDataChart.reverse();
                }
                this.setChartsAdditionalData(aDataChart);
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
            validDataBeforeSave: function (oView) {
                //return this.validMissions() && this.validFGAHeaderFields();
                return [this.validFGAHeaderFields(), this.validMissions(oView)].every(bool => !!bool);
            },

            // Validate missions
            validMissions(oView) {
                if(oView.getModel("ui").getProperty("/createMode")){
                    return true;
                }
                    
                this._missionsTab = new Missions();
                return this._missionsTab.validateMissionsTreeRequiredFields(oView);

                /*var aMissions = this.getMissions();
                if (!Filter.validateMissions(aMissions)) {
                    return false;
                }
                return true;*/
            },

            getViewField(identifier, field){
                return this.oView.byId(Helper.headerFieldIdBySectionAndFieldName(identifier, field));
            },

            validFGAHeaderFields() {
                let isValid = true;
                Helper.getHeaderFieldList().map(({identifier, field}) => {
                    const champ = this.getViewField(identifier, field);
                    if (champ?.getVisible() && champ?.getMandatory() && !champ?.getValue()) {
                        champ?.setValueState("Error");
                        champ?.setValueStateText("Mandatory Field required");
                        isValid = false;
                    } else {
                        champ?.setValueState("None");
                    }
                });
                return isValid;
                // return Helper.getHeaderFieldList.some(({identifier, field}) => {
                //     const champ = this.getViewField(identifier, field);
                //     return champ.getMandatory() && !champ.getValue();
                // });
            },

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

            async deepUpsertFGA(data) {
                try {
                    // Clean entity
                    const dataToSend = { ...data };
                    delete dataToSend.isTotalRow;
                    delete dataToSend.FinAffaire;
                    delete dataToSend.isNode;

                    if (dataToSend.to_BudgetPxAutre) {
                        dataToSend.to_BudgetPxAutre = dataToSend.to_BudgetPxAutre.map(item => {
                            const newItem = { ...item };
                            delete newItem.isTotalRow;
                            delete newItem.FinAffaire;
                            return newItem;
                        });
                    }

                    if (dataToSend.to_Missions) {
                        dataToSend.to_Missions = dataToSend.to_Missions.map(item => {
                            const newItem = { ...item };
                            delete newItem.isNode;
                            return newItem;
                        });
                    }

                    const createdFGA = await this.create("/ZC_FGASet", dataToSend);
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
                    this.setTabBusy(true);
                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_Missions`;
                    console.log(`retrieve missions with period: ${period} and BusinessNo: ${businessNo}`);
                    const missions = await this.read(sPath);
                    this.setTabBusy(false);
                    return missions?.results || [];
                } catch (error) {
                    this.setTabBusy(false);
                    console.log(error);
                }
            },

            async getBEPxAutres() {
                try {
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);

                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxAutre`;
                    console.log(`retrieve Budget Px Autre with period: ${period} and BusinessNo: ${businessNo}`);
                    const pxAutres = await this.read(sPath);
                    this.setTabBusy(false);
                    return pxAutres?.results || [];
                } catch (error) {
                    this.setTabBusy(false);
                    console.log(error);
                }
            },

            async getBEPxExtSubContracting() {
                try {
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxSubContracting`;
                    console.log(`retrieve previsions with period: ${period} and BusinessNo: ${businessNo}`);
                    const pxSubContract = await this.read(sPath);
                    this.setTabBusy(false);
                    return (pxSubContract?.results || []).map(Formatter.formatBudgetSubContracting);
                } catch (error) {
                    this.setTabBusy(false);
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

            async getBECharts() {
                try {
                    this.setChartBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_CHART(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve charts data with period: ${period} and BusinessNo: ${businessNo}`);
                    const charts = await this.read(sPath);
                    this.setChartBusy(false);
                    return charts?.results || [];
                } catch (error) {
                    this.setChartBusy(false);
                    console.log(error);
                }
            },

            async getBEChartsAdditionalData() {
                try {
                    this.setChartBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_CHART_AVANCEMENT(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve charts additionnal data with period: ${period} and BusinessNo: ${businessNo}`);
                    const chartsadddata = await this.read(sPath);
                    this.setChartBusy(false);
                    return chartsadddata?.results || [];
                } catch (error) {
                    this.setChartBusy(false);
                    console.log(error);
                }
            },

            async getBEClientById(ClientNo) {
                try {
                    const options = { urlParameters: { ClientNo } };
                    const client = await this.callFunction("/GetClient", options);
                    return client;
                } catch (error) {
                    console.log(error);
                }
            },

            async getBESupplierById(SupplierNo) {
                try {
                    const options = { urlParameters: { SupplierNo } };
                    const supplier = await this.callFunction("/GetSupplier", options);
                    return Formatter.formatSupplier(supplier);
                } catch (error) {
                    console.log(error);
                }
            },

            async getBECompanyByProfitCenter(ProfitCenterCode) {
                try {
                    const options = { urlParameters: { ProfitCenterCode } };
                    const company = await this.callFunction("/GetCompanyCodeByProfitCenter", options);
                    return company;
                } catch (error) {
                    console.log(error);
                }
            },
            //Notes
            async getBENotes() {
                try {     
                     const businessNo = this.getBusinessNo();
                     const period = this.getPeriod();
                     const urlBusinessNo = encodeURIComponent(businessNo);
                     const urlPeriod = encodeURIComponent(period);
                     const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/Notes`;
                     const notes = await this.read(sPath);
                     return notes.Notes;
                    
                } catch (error) {
                    console.log(error);
                }
            },

            setTabBusy(isBusy){
                const tabId = Helper.getTabId();
                this.oView.byId(tabId).setBusy(isBusy);
            },

            setChartBusy(isBusy){
                const graphId = Helper.getGraphicId();
                this.oView.byId(graphId).setBusy(isBusy);
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
            },


            getFormattedPxAutre() {
                return this.getPxAutres();
            },

            formattedPxSubContractingExt() {
                return this.oSubContracting
                           .formattedPxSubContractingExt()
                           .map(Formatter.reverseFormatBudgetSubContracting);
            }

        });

    });