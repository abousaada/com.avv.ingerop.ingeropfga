sap.ui.define(
    [
        "sap/ui/core/mvc/ControllerExtension",
        "sap/m/Dialog",
        "sap/m/library",
        "sap/m/Text",
        "sap/m/Button",
        "sap/m/MessageToast",
        "sap/ui/core/message/MessageType",
        "sap/m/library"
    ],
    function (ControllerExtension, Dialog, mLibrary, Text, Button, MessageToast, MessageType, library) {
        "use strict";

        return ControllerExtension.extend("com.avv.ingerop.ingeropfga.ext.controller.extendLR", {

            isYearEmpty:function(year){
                return !!year;
            },

            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {
                /**
                * Called when a controller is instantiated and its View controls (if available) are already created.
                * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time       initialization.
                * @memberOf sap.fe.cap.customer.ext.controller.PassengerOPExtend
                */

                onInit: function () {
                    // you can access the Fiori elements extensionAPI via this.base.getExtensionAPI

                    // this.base.getView().byId("addEntry").bindProperty("enabled", {
                    //     path: "utilities>/year",
                    //     formatter: this.getInterface().isYearEmpty
                    // });
                },

                onInitSmartFilterBarExtension: function(oEvent){
                    //set Year Data on List Report Page
                    oEvent.getSource().attachFilterChange(function(event){
                        if(event.getParameters().getParameter("id").includes("p_period")){
                            const period = event.getParameters().getParameter("newValue");
                            this.getModel("utilities").setYearByPeriod(period);
                        }
                    });
                },

                // onListNavigationExtension: async function (oEvent) {
                //     var oBindingContext = oEvent.getSource().getBindingContext();
                //     var oObject = oBindingContext.getObject();

                //     var sBusinessNo = encodeURIComponent(oObject.BusinessNo);
                //     var sPeriod = encodeURIComponent(oObject.p_period);
                //     // Extract year from sPeriod (MMYYYY format)
                //     var sYear = sPeriod.substring(2);

                //     // Create or get a model to store the utilities
                //     // var oUtilities = sap.ui.getCore().getModel("utilities") || new sap.ui.model.json.JSONModel();
                //     // oUtilities.setProperty("/businessNo", sBusinessNo);
                //     // sap.ui.getCore().setModel(oUtilities, "utilities");

                //     console.log("Row selected in List Report:", oObject.BusinessNo);

                //     // Use the existing model or get it from the component
                //     var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZFGA_SRV");
                //     var that = this;

                //     // Step 1: Load filtered entity
                //     var sFunctionPath = "/ZC_FGA(p_period='" + sPeriod + "')/Set?$filter=BusinessNo eq '" + sBusinessNo + "'";

                //     oDataModel.read(sFunctionPath, {
                //         success: function (oData) {
                //             if (oData && oData.results && oData.results.length > 0) {
                //                 // Chain the requests to avoid conflicts
                //                 that._loadRecapData(oDataModel, sBusinessNo, sPeriod)
                //                     .then(function () {
                //                         return that._loadPrevisionsData(oDataModel, sBusinessNo, sPeriod);
                //                     })
                //                     // .then(function () {
                //                     //     return that._loadMissionsData(oDataModel, sBusinessNo, sPeriod); // Your new async call
                //                     // })
                //                     .catch(function (oError) {
                //                         console.error("Error in loading data:", oError);
                //                     });
                //             }
                //         },
                //         error: function (oError) {
                //             console.error("Error loading main entity:", oError);
                //         }
                //     });
                //     // return new Promise(async (resolve, reject) => {
                //     //     resolve();
                //     // })
                // },

                onBeforeRebindTableExtension: function (oEvent) {

                }

            },

            _loadRecapData: function (oDataModel, sBusinessNo, sPeriod) {
                return new Promise(function (resolve, reject) {
                    //var sEntityPath = "/ZC_FGASet(BusinessNo='" + sBusinessNo + "',p_period='" + sPeriod + "')/to_Recap";

                    var sEntityPath = "/ZI_FGA_RECAP(p_businessno='" + sBusinessNo + "',p_period='" + sPeriod + "')/Set";

                    oDataModel.read(sEntityPath, {
                        success: function (oRecapData) {
                            var aRecap = oRecapData.results || [];
                            var oRecapModel = this.getView().getModel("recap") ||
                                new sap.ui.model.json.JSONModel({ results: [] });

                            oRecapModel.setProperty("/results", aRecap);
                            this.getView().setModel(oRecapModel, "recap");
                            oRecapModel.refresh(true);
                            resolve();
                        }.bind(this),
                        error: function (oError) {
                            console.error("Error loading to_Recap:", oError);
                            reject(oError);
                        }
                    });
                }.bind(this));
            },

            _loadPrevisionsData: function (oDataModel, sBusinessNo, sPeriod) {
                return new Promise(function (resolve, reject) {
                    //var sEntityPath = "/ZC_FGASet(BusinessNo='" + sBusinessNo + "',p_period='" + sPeriod + "')/to_Previsions";

                    var sEntityPath = "/ZC_FGA_PREVISIONS(p_businessno='" + sBusinessNo + "',p_period='" + sPeriod + "')/Set";
                    
                    oDataModel.read(sEntityPath, {
                        success: function (oPrevisions) {
                            var aPrevisions = oPrevisions.results || [];
                            var oPrevisionsModel = this.getView().getModel("synthesis") ||
                                new sap.ui.model.json.JSONModel({ results: [] });

                            oPrevisionsModel.setProperty("/results", aPrevisions);
                            this.getView().setModel(oPrevisionsModel, "synthesis");
                            oPrevisionsModel.refresh(true);
                            resolve();
                        }.bind(this),
                        error: function (oError) {
                            console.error("Error loading to_Previsions:", oError);
                            reject(oError);
                        }
                    });
                }.bind(this));
            },

            _loadMissionsData: function (oDataModel, sBusinessNo, sPeriod) {
                return new Promise(function (resolve, reject) {
                    var sEntityPath = "/ZC_FGASet(BusinessNo='" + sBusinessNo + "',p_period='" + sPeriod + "')/to_Missions";

                    oDataModel.read(sEntityPath, {
                        success: function (oMissionsData) {
                            var aMissions = oMissionsData.results || [];
                            var oMissionsModel = this.getView().getModel("missions") ||
                                new sap.ui.model.json.JSONModel({ results: [] });

                            oMissionsModel.setProperty("/results", aMissions);
                            this.getView().setModel(oMissionsModel, "missions");
                            oMissionsModel.refresh(true);
                            resolve();
                        }.bind(this),
                        error: function (oError) {
                            console.error("Error loading to_Missions:", oError);
                            reject(oError);
                        }
                    });
                }.bind(this));
            },


        });
    });