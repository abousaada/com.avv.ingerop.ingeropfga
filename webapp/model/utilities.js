sap.ui.define([
    "./baseModel",
    "./utilities/initialData",
    "./utilities/formatter",
    "./utilities/filter",
    "./utilities/subContracting",
    "./utilities/recetteExt",
    "./utilities/mainOeuvre",
    "../util/constant",
    "../util/helper",
    "../ext/controller/helpers/Missions",
],
    function (BaseModel, InitialData, Formatter, Filter, SubContracting, RecetteExt, MainOeuvre, Constant, Helper, Missions) {
        "use strict";

        return BaseModel.extend("com.avv.ingerop.ingeropfga.model.utilities", {

            init: function (oModel) {
                this.setData({ ...InitialData });
                this.initModel(oModel);
                this.oSubContracting = new SubContracting(this);
                this.oRecetteExt = new RecetteExt(this);
                this.oMainOeuvre = new MainOeuvre(this);
            },

            setView(oView) {
                this.oView = oView;
            },

            getView() {
                return this.oView;
            },

            reInit() {
                this.setData({ ...InitialData });
            },

            buildPxSubContractingTreeData() {
                const { treeData, treeHeader } = this.oSubContracting.buildTreeData();
                this.setPxSubContractingHierarchy(treeData);
                this.setPxSubContractingHeader(treeHeader);
            },

            buildPxRecetteExtTreeData() {
                const treeData = this.oRecetteExt.buildTreeData();
                this.setPxRecetteExtHierarchy(treeData);
            },

            buildPxMainOeuvreTreeData() {
                const { treeData, treeHeader } = this.oMainOeuvre.buildTreeData();
                this.setPxMainOeuvreHierarchy(treeData);
                this.setPxMainOeuvreHeader(treeHeader);
            },

            reCalcRecetteTable() {
                return this.oRecetteExt.reCalcRecetteTable();
            },

            reCalcMainOeuvreTable() {
                return this.oMainOeuvre.reCalcMainOeuvreTable();
            },

            async getBEDatas(type, aSelectedBusinessNos = []) {
                try {

                    if (type === 'previsionel') {
                        const previsionel = await this.getBEPrevisionel(aSelectedBusinessNos);
                        this.setPrevisionel(previsionel || []);
                        return;
                    }
                    const [missions, previsions, recaps, opport, risque, charts,
                        chartsadddata, pxRecettes, pxAutres, pxSubContracting,
                        pxMainOeuvre, pxSTI, pSTI, notes, sfgp]
                        = await Promise.all([

                            this.getBEMissions(),
                            this.getBEPrevisions(),
                            this.getBERecaps(),
                            this.getBEOpport(),
                            this.getBERisque(),
                            this.getBECharts(),
                            this.getBEChartsAdditionalData(),

                            //Bugets PX
                            this.getBEPxRecettes(),
                            this.getBEPxAutres(),
                            this.getBEPxExtSubContracting(),
                            this.getBEPxMainOeuvre(),
                            this.getBEPxSTI(),
                            this.getBEPSTI(),

                            //Notes
                            this.getBENotes(),
                            this.getBESfgp(),

                            //this.getBEPrevisionel(),

                        ]);

                    this.setMissions(missions || []);
                    this.setRecaps(recaps || []);
                    this.setPrevisions(previsions || []);
                    this.setOpport(opport || []);
                    this.setRisque(risque || []);
                    this.setCharts(charts || []);
                    this.setChartsAdditionalData(chartsadddata || []);

                    //Bugets PX
                    this.setPxAutres(pxAutres || []);
                    this.setPxRecetteExt(pxRecettes || []);

                    this.setPxSousTraitance(pxSubContracting || []);
                    this.setPxMainOeuvre(pxMainOeuvre || []);
                    this.setPxSTI(pxSTI || []);
                    this.setPSTI(pSTI || []);

                    // A REMETTRE PROPRE
                    this.onCalculChartsData(previsions, recaps, charts, chartsadddata);
                    //Notes
                    this.setNotes(notes);

                    this.setSfgp(sfgp || []);

                    //this.setPrevisionel(previsionel || []);


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
                if (oView.getModel("ui").getProperty("/createMode")) {
                    return true;
                }

                this._missionsTab = new Missions();
                return this._missionsTab.validateMissionsTreeRequiredFields(oView);

            },

            validRecetteExtBeforeSave(oView) {
                const recetteExt = this.getPxRecetteExt();
                const formattedRecetteExt = this.formattedPxRecetteExt();
                const props = [
                    { inProp: "groupe", outProp: "Groupe" },
                    { inProp: "interUfo", outProp: "InterUFO" },
                    { inProp: "intraUfo", outProp: "IntraUFO" }
                ];

                const sum = (array, prop) => array.reduce((s, v) => s + parseFloat(v[prop]), 0);

                return props.every(({ inProp, outProp }) => sum(recetteExt, inProp) === sum(formattedRecetteExt, outProp));
            },

            getViewField(identifier, field) {
                return this.oView.byId(Helper.headerFieldIdBySectionAndFieldName(identifier, field));
            },

            validFGAHeaderFields() {
                let isValid = true;
                Helper.getHeaderFieldList().map(({ identifier, field }) => {
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

                    if (dataToSend.to_BudgetPxAutre && Array.isArray(dataToSend.to_BudgetPxAutre)) {
                        dataToSend.to_BudgetPxAutre = dataToSend.to_BudgetPxAutre.map(item => {
                            const newItem = { ...item };
                            delete newItem.isTotalRow;
                            delete newItem.FinAffaire;
                            return newItem;
                        });
                    }

                    if (dataToSend.to_Missions && Array.isArray(dataToSend.to_Missions)) {
                        dataToSend.to_Missions = dataToSend.to_Missions.map(item => {
                            const newItem = { ...item };
                            delete newItem.isNode;
                            return newItem;
                        });
                    }

                    if (dataToSend.to_Previsionel && Array.isArray(dataToSend.to_Previsionel)) {
                        dataToSend.to_Previsionel = dataToSend.to_Previsionel.map(item => {
                            const newItem = { ...item };
                            delete newItem.totals;
                            delete newItem.children;
                            delete newItem.mask;
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

            async getBEPxRecettes() {
                try {
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);

                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxRecetteExt`;
                    console.log(`retrieve Budget Px Recettes with period: ${period} and BusinessNo: ${businessNo}`);
                    const pxRecettes = await this.read(sPath);
                    this.setTabBusy(false);
                    return (pxRecettes?.results || []).map(Formatter.formatBudgetRecetteExt);
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

            async getBEPxSTI() {
                try {
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);

                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxSTI`;
                    console.log(`retrieve Budget Px STI with period: ${period} and BusinessNo: ${businessNo}`);
                    const pxSTI = await this.read(sPath);
                    this.setTabBusy(false);
                    return pxSTI?.results || [];
                } catch (error) {
                    this.setTabBusy(false);
                    console.log(error);
                }
            },


            async getBEPSTI() {
                try {
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);

                    // First get the main STI data
                    const sPath = `/ZC_STI?$filter=business_no_e eq '${urlBusinessNo}'`;
                    console.log(`retrieve STI with period: ${period} and BusinessNo: ${businessNo}`);

                    //const pSTI = await this.read(sPath);

                    const pSTI = await this.read("/ZC_STI", {
                        urlParameters: {
                            //"$filter": `business_no_e eq '${businessNo}' and p_period eq '${urlPeriod}'`
                            "$filter": `business_no_e eq '${businessNo}' and p_period eq '${period}'`
                        }
                    });

                    const results = pSTI?.results || [];

                    // Load deferred to_budg association for each result
                    const resultsWithBudget = await Promise.all(
                        results.map(async (sti) => {
                            try {
                                const encodedId = encodeURIComponent(sti.id_formulaire);
                                const encodedBusinessNo = encodeURIComponent(sti.business_no_e);

                                const budgetPath = `/ZC_STI(id_formulaire='${encodedId}',business_no_e='${encodedBusinessNo}')/to_BUDG`;
                                console.log(`Loading budget for ID: ${sti.id_formulaire}, BusinessNo: ${sti.business_no_e}, Path: ${budgetPath}`);

                                const budgetResponse = await this.read(budgetPath);
                                return {
                                    ...sti,
                                    to_budg: budgetResponse?.results || []
                                };
                            } catch (error) {
                                console.log(`Error loading budget for STI ${sti.id_formulaire}:`, error);
                                return {
                                    ...sti,
                                    to_budg: []
                                };
                            }
                        })
                    );

                    this.setTabBusy(false);
                    return resultsWithBudget;
                } catch (error) {
                    this.setTabBusy(false);
                    console.log(error);
                    return [];
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
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZI_FGA_RECAP(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve recaps with period: ${period} and BusinessNo: ${businessNo}`);
                    const recaps = await this.read(sPath);
                    this.setTabBusy(false);
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
                    console.log(`retrieve opport with period: ${period} and BusinessNo: ${businessNo}`);
                    const opport = await this.read(sPath);
                    return opport?.results || [];
                } catch (error) {
                    console.log(error);
                }
            },

            async getBERisque() {
                try {
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_RISQUE(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve risque with period: ${period} and BusinessNo: ${businessNo}`);
                    const risque = await this.read(sPath);
                    return risque?.results || [];
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

            async getBEPxMainOeuvre() {
                try {
                    this.setTabBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGASet(BusinessNo='${urlBusinessNo}',p_period='${urlPeriod}')/to_BudgetPxMainOeuvre`;
                    console.log(`retrieve main d'oeuvre with period: ${period} and BusinessNo: ${businessNo}`);
                    const pxMainOeuvre = await this.read(sPath);
                    this.setTabBusy(false);
                    return (pxMainOeuvre?.results || []).map(Formatter.formatBudgetPxMainOeuvre);
                } catch (error) {
                    this.setTabBusy(false);
                    console.log(error);
                }
            },

            async getBESfgp() {
                try {
                    this.setChartBusy(true);
                    const businessNo = this.getBusinessNo();
                    const period = this.getPeriod();
                    const urlBusinessNo = encodeURIComponent(businessNo);
                    const urlPeriod = encodeURIComponent(period);
                    const sPath = `/ZC_FGA_SFGP_REPORT(p_businessno='${urlBusinessNo}',p_period='${urlPeriod}')/Set`;
                    console.log(`retrieve sfgp report data with period: ${period} and BusinessNo: ${businessNo}`);
                    const sfgp = await this.read(sPath);
                    this.setChartBusy(false);
                    return sfgp?.results || [];
                } catch (error) {
                    this.setChartBusy(false);
                    console.log(error);
                }
            },


            async getBEPrevisionel(filterParams = []) {
                try {
                    this.setChartBusy(true);
                    const period = this.getPeriod();

                    // Gestion de la compatibilité avec l'ancien appel
                    if (Array.isArray(filterParams)) {
                        filterParams = { aSelectedBusinessNos: filterParams };
                    }

                    let urlParameters = {};
                    let filterConditions = [];

                    // Use aSelectedBusinessNos directly
                    let businessNos = filterParams.aSelectedBusinessNos || [];

                    // Ensure businessNos is an array
                    if (!Array.isArray(businessNos)) {
                        businessNos = [businessNos];
                    }
                    businessNos = businessNos
                        .flatMap(bn => {
                            if (typeof bn === 'string' && bn.includes(',')) {
                                // Split comma-separated string into individual items
                                return bn.split(',').map(item => item.trim());
                            }
                            return bn;
                        })
                        .map(bn => bn.toString().trim())
                        .filter(bn => bn.length > 0);

                    if (businessNos.length > 0) {
                        // Multi-sélection BusinessNo
                        const businessFilters = businessNos.map(bn => `BusinessNo eq '${bn}'`).join(' or ');
                        filterConditions.push(`(${businessFilters})`);

                    }

                    if (period) {
                        filterConditions.push(`Period eq '${period}'`);
                    }

                    // Filtres additionnels
                    const filtersConfig = [
                        { param: 'ufo', field: 'business_p_ufo' },
                        { param: 'label', field: 'business_no_p_t' },
                        { param: 'societe', field: 'business_p_cmp' },
                        { param: 'profitCenter', field: 'business_p_cdp' }
                    ];

                    filtersConfig.forEach(({ param, field }) => {
                        if (filterParams[param]) {
                            filterConditions.push(`substringof('${filterParams[param]}', ${field})`);
                        }
                    });

                    if (filterParams.businessNo && businessNos.length === 0) {
                        filterConditions.push(`substringof('${filterParams.businessNo}', MissionId)`);
                    }

                    // Combinaison des filtres
                    if (filterConditions.length > 0) {
                        urlParameters.$filter = filterConditions.join(' and ');
                    }
                    const previsionel = await this.read("/ZC_FGA_Forecast", { urlParameters });
                    return previsionel?.results || [];
                } catch (error) {
                    console.error("Error in getBEPrevisionel:", error);
                    throw error;
                } finally {
                    this.setChartBusy(false);
                }
            },

            async getBEPrevisionel_filtre1(filterParams = {}) {

                try {
                    this.setChartBusy(true);
                    const period = this.getPeriod();

                    let urlParameters = {};
                    let filterConditions = [];

                    // Build filter conditions using supported operators
                    /*if (filterParams.selectedBusinessNos && filterParams.selectedBusinessNos.length > 0) {
                        const businessFilters = filterParams.selectedBusinessNos.map(bn => `BusinessNo eq '${bn}'`).join(' or ');
                        filterConditions.push(`(${businessFilters})`);
                        console.log(`Retrieving Previsionel data for BusinessNos: ${filterParams.selectedBusinessNos.join(", ")}`);
                    } else if (filterParams.businessNo) {
                        filterConditions.push(`BusinessNo eq '${filterParams.businessNo}'`);
                        console.log(`Retrieving Previsionel data for BusinessNo: ${filterParams.businessNo}`);
                    } else {
                        console.log(`Retrieving all Previsionel data`);
                    }*/


                    // Build filter conditions using supported operators
                    if (filterParams.aSelectedBusinessNos && filterParams.aSelectedBusinessNos.length > 0) {
                        const businessFilters = filterParams.aSelectedBusinessNos.map(bn => `BusinessNo eq '${bn}'`).join(' or ');
                        filterConditions.push(`(${businessFilters})`);
                        console.log(`Retrieving Previsionel data for BusinessNos: ${filterParams.aSelectedBusinessNos.join(", ")}`);
                    }
                    else if (filterParams.businessNo) {
                        filterConditions.push(`BusinessNo eq '${filterParams.businessNo}'`);
                        console.log(`Retrieving Previsionel data for BusinessNo: ${filterParams.businessNo}`);
                    } else {
                        console.log(`Retrieving all Previsionel data`);
                    }

                    // UFO filter - use substringof instead of contains
                    if (filterParams.ufo) {
                        filterConditions.push(`substringof('${filterParams.ufo}', business_p_ufo)`);
                    }

                    // Label/Description filter - use substringof instead of contains
                    if (filterParams.label) {
                        filterConditions.push(`substringof('${filterParams.label}', business_no_p_t)`);
                    }

                    // Societe filter - use substringof instead of contains
                    if (filterParams.societe) {
                        filterConditions.push(`substringof('${filterParams.societe}', business_p_cmp)`);
                    }

                    // BusinessManager filter - use substringof instead of contains
                    if (filterParams.profitCenter) {
                        filterConditions.push(`substringof('${filterParams.profitCenter}', business_p_cdp)`);
                    }

                    // STIsLiees filter - use substringof instead of contains
                    if (filterParams.businessNo) {
                        filterConditions.push(`substringof('${filterParams.businessNo}', MissionId)`);
                    }

                    // Combine all filters with AND
                    if (filterConditions.length > 0) {
                        urlParameters.$filter = filterConditions.join(' and ');
                    }

                    console.log("OData URL Parameters:", urlParameters);

                    const previsionel = await this.read("/ZC_FGA_Forecast", { urlParameters });
                    return previsionel?.results || [];
                } catch (error) {
                    console.error("Error in getBEPrevisionel:", error);
                    throw error;
                } finally {
                    this.setChartBusy(false);
                }
            },

            async getBEPrevisionel1(aSelectedBusinessNos = []) {
                try {
                    this.setChartBusy(true);
                    const period = this.getPeriod();

                    let filters = [];
                    if (aSelectedBusinessNos.length > 0) {
                        filters.push(new sap.ui.model.Filter("Period", sap.ui.model.FilterOperator.EQ, period));

                        const businessFilters = aSelectedBusinessNos.map(bn =>
                            new sap.ui.model.Filter("BusinessNo", sap.ui.model.FilterOperator.EQ, bn)
                        );
                        filters.push(new sap.ui.model.Filter({ filters: businessFilters, and: false }));
                        console.log(`Retrieving Previsionel data for BusinessNos: ${aSelectedBusinessNos.join(", ")} and period: ${period}`);
                    } else {
                        console.log(`Retrieving all Previsionel data for period: ${period}`);
                    }

                    const previsionel = await this.read("/ZC_FGA_Forecast", { filters });
                    return previsionel?.results || [];
                } catch (error) {
                    console.error(error);
                } finally {
                    this.setChartBusy(false);
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

            async getBEProfilById(ProfilNo) {
                try {
                    const BusinessNo = this.getBusinessNo();
                    const Period = this.getPeriod();
                    const options = { urlParameters: { ProfilNo, BusinessNo, Period } };
                    const profil = await this.callFunction("/GetProfil", options);
                    return Formatter.formatProfil(profil);
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

            setTabBusy(isBusy) {
                const tabId = Helper.getTabId();
                this.oView.byId(tabId).setBusy(isBusy);
            },

            setChartBusy(isBusy) {
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

            getFormattedPxSTI() {
                return this.getPxSTI();
            },

            formattedPxSubContractingExt() {
                return this.oSubContracting
                    .formattedPxSubContractingExt()
                    .map(Formatter.reverseFormatBudgetSubContracting);
            },

            formattedPxRecetteExt() {
                return this.oRecetteExt
                    .formattedPxRecetteExt()
                    .map(Formatter.reverseFormatBudgetRecetteExt);
            },

            formattedPxMainOeuvre() {
                return this.oMainOeuvre
                    .formattedPxMainOeuvre()
                    .map(Formatter.reverseFormatBudgetMainOeuvre);
            }
        });

    });