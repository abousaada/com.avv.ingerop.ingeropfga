sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/SelectionVariant",
    "sap/ui/generic/app/navigation/service/NavigationHandler"
], function (Controller, SelectionVariant, NavigationHandler) {
    "use strict";

    return Controller.extend("com.avv.ingerop.ingeropfga.ext.controller.extendOP", {

        _getViewFromEvent: function (oEvent) {
            let o = oEvent.getSource();
            while (o && !o.isA("sap.ui.core.mvc.View")) {
                o = o.getParent();
            }
            return o; // View
        },






        onPressMonthLink: function (oEvent, oView) {
            var oLink = oEvent.getSource();

            // Get all custom data items from the link
            var aCustomData = oLink.getCustomData();
            var oCustomValues = {};

            // Convert custom data array to key-value pairs
            aCustomData.forEach(function (oCustomData) {
                oCustomValues[oCustomData.getKey()] = oCustomData.getValue();
            });

            var sMonthField = oCustomValues.monthField;
            var sYearField = oCustomValues.yearField;

            /*var oRowContext = oLink.getBindingContext("synthesis");
            var oRowData = oRowContext.getObject();
            var fMonthValue = oRowData[sMonthField];*/

            // Display to ckeck
            console.log("Clicked month field:", sMonthField);

            // Call for navigation
            this.monthLinkNavigation(oEvent, sMonthField, sYearField, oView);


        },

        monthLinkNavigation: async function (oEvent, sMonthValue, sYearValue) {


            try {

                const oLink = oEvent.getSource();

                // 2. Get GL Accounts
                const oContext = oLink.getBindingContext("utilities");
                const oData = oContext.getObject();
                //const rawGLAccounts = oData.GLAccounts;

                //const glAccounts = rawGLAccounts
                //    ? rawGLAccounts.split(";").map(a => a.trim()).filter(a => a.length > 0)
                //    : [];

                const rawGLAccounts = [
                    oData.GLAccounts1,
                    oData.GLAccounts2,
                    oData.GLAccounts3,
                    oData.GLAccounts4
                ]
                    .filter(part => part && part.length > 0) // garde seulement ceux remplis
                    .join(""); // reconstitue la string complète

                const glAccounts = rawGLAccounts
                    ? rawGLAccounts
                        .split(";")
                        .map(a => a.trim())
                        .filter(a => a.length > 0)
                    : [];

                if (glAccounts.length === 0) {
                    sap.m.MessageToast.show("GLAccount non disponible.");
                    return;
                }

                // 3. Get Date range
                var year = sYearValue;
                const month = sMonthValue;
                if (month === "N1") {
                    year = sYearValue - 1;
                }

                // Calculate first and last day of the month
                const firstDay = `${year}${month}01`;
                const lastDay = this.getLastDayOfMonth(year, month);
                const formattedFirstDay = `${firstDay.substring(0, 4)}-${firstDay.substring(4, 6)}-${firstDay.substring(6, 8)}`;

                console.log(`Navigating for month ${month}/${year} (${firstDay} to ${lastDay})`);

                // 4. Get missions
                //const utilitiesModel = this.oView.getModel("utilities");
                let missions = [];
                try {
                    missions = oLink.getModel('utilities').getMissions();

                } catch (error) {
                    console.error("Failed to fetch missions:", error);
                    throw error;
                }

                const wbsElements = [];
                //  const wbsElements = [oData.business_no];
                if (missions && missions.length > 0) {
                    // Add affaires to the WBS elements array
                    wbsElements.push(...missions.map(mission => mission.BusinessNo));
                    // Add missions to the WBS elements array
                    wbsElements.push(...missions.map(mission => mission.MissionId));
                }

                const oCtx = oEvent.getSource().getBindingContext(); // ou getBindingContext("data")
                const oObj = oCtx && oCtx.getObject();

                const sPeriod = oObj && oObj.p_period;
                const sStartDate = oObj && oObj.StartDate;



                // 5. Create navigation
                /*const oComponent = sap.ui.core.Component.getOwnerComponentFor(this.oView);
                const oAppStateService = sap.ushell.Container.getService("AppState");
                const oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();

                const oAppState = await oAppStateService.createEmptyAppState(oComponent);
                oAppState.setData(oSelectionVariant.toJSONString());
                await oAppState.save();

                const sAppStateKey = oAppState.getKey();*/
                const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

                /*const sUrl = oCrossAppNavigator.toExternal({
                    target: {
                        semanticObject: "GLAccount",
                        action: "displayGLLineItemReportingView"
                    },
                    params: {
                        PostingDate: `GE${firstDay}&LE${lastDay}`,
                        GLAccount: ["0041000001"],
                        WBSElementExternalID: ["PROJET CAS TEST1"],
                        P_DisplayCurrency: "EUR",
                        P_ExchangeRateType: "M",
                        P_ExchangeRateDate: "2019-01-01"
                    }
                });
                // Ouverture dans une nouvelle fenêtre
                window.open(sUrl, "_blank");
                */

                // Construct the URL parameters
                var params

                if (sMonthValue === 'N1' || sMonthValue === '12') {
                    const sEndDate = new Date(2024, 11, 31);
                    const aFiscalPeriods = this.buildFiscalPeriods(sStartDate, sEndDate);
                    params = {
                        //FiscalYear: `${year}`,
                        FiscalYearPeriod: aFiscalPeriods,
                        //FiscalPeriod: `${sYearValue}0${month}`,                      
                        GLAccount: glAccounts,
                        WBSElementExternalID: wbsElements //[oData.business_no],
                    };
                }
                else if (sMonthValue === 'N0') { //Cumul
                    const sMonthPeriod = sPeriod.substring(0, 2);
                    //const sToPeriod = `${year}0${sMonthPeriod}`;
                    const sEndDate = new Date(parseInt(year, 10), parseInt(sMonthPeriod, 10) - 1, 1);
                    const aFiscalPeriods = this.buildFiscalPeriods(sStartDate, sEndDate);


                    params = {
                        FiscalYearPeriod: aFiscalPeriods,
                        GLAccount: Array.isArray(glAccounts) ? glAccounts : [glAccounts],
                        WBSElementExternalID: Array.isArray(wbsElements) ? wbsElements : [wbsElements]
                    };

                }
                else {
                    params = {
                        FiscalYearPeriod: `${sYearValue}0${month}`,
                        //FiscalPeriod: `${sYearValue}0${month}`,
                        GLAccount: glAccounts,
                        WBSElementExternalID: wbsElements
                    };
                }


                // Convert params to URL string
                const sParams = Object.entries(params)
                    .map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
                        }
                        return `${key}=${encodeURIComponent(value)}`;
                    })
                    .join('&');

                // Get the base URL for the target app
                const sHash = oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "GLAccount",
                        action: "displayGLLineItemReportingView"
                    }
                });

                // Get the FLP base URL
                const sBaseUrl = window.location.origin + window.location.pathname;

                // Construct the full URL
                const sUrl = `${sBaseUrl}#${sHash}&${sParams}`;

                // Open in new window
                window.open(sUrl, "_blank", "noopener,noreferrer");



            } catch (err) {
                console.error("Error during navigation:", err);
            }
        },

        buildFiscalPeriods: function (sStartDate, sEndDate) {
            const aPeriods = [];

            if (!(sStartDate instanceof Date) || isNaN(sStartDate)) return aPeriods;
            if (!(sEndDate instanceof Date) || isNaN(sEndDate)) return aPeriods;
            if (sStartDate > sEndDate) return aPeriods;

            let y = sStartDate.getFullYear();
            let m = sStartDate.getMonth();

            const yEnd = sEndDate.getFullYear();
            const mEnd = sEndDate.getMonth();

            while (y < yEnd || (y === yEnd && m <= mEnd)) {
                const mm = String(m + 1).padStart(2, "0");
                aPeriods.push(`${y}0${mm}`);
                m++;
                if (m === 12) { m = 0; y++; }
            }

            return aPeriods;
        },



        // Helper function to get last day of month
        getLastDayOfMonth: function (year, month) {
            // Note: month is 1-12 (not 0-11 like in JS Date)
            const lastDay = new Date(year, month, 0).getDate();
            return `${year}${month.padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`;
        },

    });
});