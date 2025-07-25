sap.ui.define([
    "./baseModel",
    "./utilities/initialData",
    "./utilities/formatter",
    "./utilities/filter",
    "./utilities/subContracting",
    "../util/constant"
],
    function (BaseModel, InitialData, Formatter, Filter, SubContracting, Constant) {
        "use strict";

        return BaseModel.extend("com.avv.ingerop.ingeropfga.model.utilities", {

            init: function (oModel) {
                this.setData({ ...InitialData });
                this.initModel(oModel);
                this.oSubContracting = new SubContracting(this);
            },

            reInit() {
                this.setData({ ...InitialData });
            },

            buildPxSubContractingTreeData(){
                const { treeData, treeHeader } = this.oSubContracting.buildTreeData();
                this.setPxSubContractingHierarchy(treeData);
                this.setPxSubContractingHeader(treeHeader);
            },

            async getBEDatas() {
                try {
                    const [missions, previsions, recaps, opport, charts, chartsadddata, pxAutres, pxSubContracting] = await Promise.all([
                        this.getBEMissions(),
                        this.getBEPrevisions(),
                        this.getBERecaps(),
                        this.getBEOpport(),
                        this.getBECharts(),
                        this.getBEChartsAdditionalData(),

                        //Bugets PX
                        this.getBEPxAutres(),
                        this.getBEPxExtSubContracting()
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

                } catch (error) {
                    console.log(error);
                }
            },

            //fonction qui construit le model pour chart
            onCalculChartsData: function (oModelSynthesis, oModelRecap, oModelChart, oModelAdditionnalChart) {
                // var oModelRecap = this.getView().getModel("recap").getData().results;
                var aData = [];
                var aDataChart = [];
                // var oModelSynthesis = this.getView().getModel("synthesis").getData().results;
                // var oModelRecap = this.getView().getModel("recap").getData().results;
                // var oModelChart = this.getView().getModel("chartModel").getData().results;
                // var oModelAdditionnalChart = this.getView().getModel("chartAddData").getData().results;

                // boucle sur model recap
                for (var i = 0; i < oModelRecap.length; i++) {
                    //Chiffre d'affaire
                    if (oModelRecap[i].row_type === "CA") {
                        var oItem = {
                            Categorie: oModelRecap[i].row_description,
                            Type: "Réalisé",
                            Valeur: oModelRecap[i].cumul_n1
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
                for(var j = 0; j < oModelSynthesis.length; j++){
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

                for (var g = 0; g < oModelAdditionnalChart.length; g++){
                    if (oModelAdditionnalChart[g].line_item === "DELAIS") {
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
                var oCharges  = oModelChart.find(obj => obj.line_item === "CHARGES");

                if (oRecettes && oCharges) {
                    var [endMonth, endYear] = oRecettes.period.split("/").map(Number);

                    // 12 mois glissants jusqu'au mois courant
                    for (var i = 11; i >= 0; i--) {
                        // Crée une nouvelle date temporaire à chaque itération
                        var tmpMonth = endMonth - 1; // JS : janvier = 0
                        var tmpYear = endYear;

                        // Recul de i mois manuellement
                        tmpMonth -= i;
                        if (tmpMonth < 0) {
                            tmpYear += Math.floor(tmpMonth / 12);
                            tmpMonth = (tmpMonth % 12 + 12) % 12;
                        }

                        var mm = String(tmpMonth + 1).padStart(2, "0");
                        var yyyy = tmpYear;
                        var label = mm + "/" + yyyy;
                        var index = String(12 - i + 1).padStart(2, "0"); // Month01 à Month12

                        aDataChart.push({
                            Periode: label,
                            Facturation: parseFloat(oRecettes["Month" + index]) || 0,
                            Depense: parseFloat(oCharges["Month" + index]) || 0
                        });
                    }
                }
                // Alimente le modèle final pour le graphique
                // var oModelDataChart = new sap.ui.model.json.JSONModel({ results: aDataChart });
                // this.getView().setModel(oModelDataChart, "chart2");
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
            validDataBeforeSave: function () {
                //return this.validMissions() && this.validFGAHeaderFields();
                return this.validFGAHeaderFields();
            },

            // Validate missions
            validMissions() {
                var aMissions = this.getMissions();
                if (!Filter.validateMissions(aMissions)) {
                    return false;
                }
                return true;
            },

            validFGAHeaderFields() {
                return true;
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
                    const dataToSend = { ...data };
                    delete dataToSend.isTotalRow;

                    // Also check nested arrays
                    if (dataToSend.to_BudgetPxAutre) {
                        dataToSend.to_BudgetPxAutre = dataToSend.to_BudgetPxAutre.map(item => {
                            const newItem = { ...item };
                            delete newItem.isTotalRow;
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

                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_Missions`;
                    console.log(`retrieve missions with period: ${period} and BusinessNo: ${businessNo}`);
                    const missions = await this.read(sPath);
                    return missions?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBEPxAutres() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo).slice(0, -2);
                    const urlPeriod = encodeURIComponent(period);

                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxAutre`;
                    console.log(`retrieve Budget Px Autre with period: ${period} and BusinessNo: ${businessNo}`);
                    const pxAutres = await this.read(sPath);
                    return pxAutres?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBEPxExtSubContracting() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxSubContracting`;
                    console.log(`retrieve previsions with period: ${period} and BusinessNo: ${businessNo}`);
                    const options = { 
                        urlParameters: {
                            "$expand": "to_BudgetPxSubContractor"
                        }
                    }
                    const pxSubContract = await this.read(sPath, options);
                    return (pxSubContract?.results || []).map(Formatter.formatBudgetSubContracting);
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

            async getBECharts() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_CHART(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve charts data with period: ${period} and BusinessNo: ${businessNo}`);
                    const charts = await this.read(sPath);
                    return charts?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBEChartsAdditionalData() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_CHART_AVANCEMENT(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve charts additionnal data with period: ${period} and BusinessNo: ${businessNo}`);
                    const chartsadddata = await this.read(sPath);
                    return chartsadddata?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBEClientById(clientNo) {
                try {
                    const options = { urlParameters: { clientNo } };
                    const client = await this.callFunction("/GetClient", options);
                    return client;
                } catch (error) {
                    console.log(error);
                }
            },

            async getBESupplierById(supplierNo) {
                try {
                    const options = { urlParameters: { supplierNo } };
                    const supplier = await this.callFunction("/GetSupplier", options);
                    return supplier;
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
            },


            getFormattedPxAutre() {
                return this.getPxAutres();
            }

        });

    });