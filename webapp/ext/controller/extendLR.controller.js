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

            // this section allows to extend lifecycle hooks or hooks provided by Fiori elements
            override: {
                /**
                * Called when a controller is instantiated and its View controls (if available) are already created.
                * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time       initialization.
                * @memberOf sap.fe.cap.customer.ext.controller.PassengerOPExtend
                */

                onInit: function () {
                    // you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
                    //var oModel = this.base.getExtensionAPI().getModel();
                },

                routing: {
                    onAfterBinding: async function (oBindingContext) { }

                },
                
                onListItemPress: function () {

                    console.log("onListItemPress");
                    var oFCL = this.oView.getParent().getParent();
        
                    oFCL.setLayout(fioriLibrary.LayoutType.TwoColumnsMidExpanded);

                    
                },

                onListNavigationExtension: function(oEvent) {
                    var oBindingContext = oEvent.getSource().getBindingContext();
                    var oObject = oBindingContext.getObject();
                    var sBusinessNo = encodeURIComponent(oObject.BusinessNo);
                
                    console.log("Row selected in List Report:", oObject.BusinessNo);
                
                    var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZFGA_SRV");
                    var that = this;
                
                    // Step 1: Load filtered entity from function import (without relying on $expand)
                    var sFunctionPath = "/ZC_FGA(p_period='072025')/Set?$filter=BusinessNo eq '" + sBusinessNo + "'";
                
                    oDataModel.read(sFunctionPath, {
                        success: function(oData) {
                            if (oData && oData.results && oData.results.length > 0) {
                                var oResult = oData.results[0];
                
                                // Build path to navigation entity manually
                                // Example: "/ZC_FGASet(BusinessNo='PROJET CAS TEST1',p_period='072025')/to_Recap"
                                // But you need the actual entity set and key fields
                
                                // Let's assume ZC_FGASet is the correct set name and BusinessNo is the key
                                var sEntityPath = "/ZC_FGASet(BusinessNo='" + sBusinessNo + "',p_period='072025')/to_Recap";
                
                                oDataModel.read(sEntityPath, {
                                    success: function(oRecapData) {
                                        var aRecap = oRecapData.results || [];

                                        var oRecapModel = that.getView().getModel("recap");

                                        if (oRecapModel) {
                                            // The "recap" model exists
                                            oRecapModel.setProperty("/results", aRecap);
                                            

                                        } else {
                                            // The "recap" model does not exist — you can create and attach it
                                            var oNewModel = new sap.ui.model.json.JSONModel({ results: aRecap });
                                            that.getView().setModel(oNewModel, "recap");
                                        }
                                        oRecapModel.refresh(true);
                                    },
                                    error: function(oError) {
                                        console.error("Error loading to_Recap:", oError);
                                    },
                                    refresh: true
                                });
                            }
                        },
                        error: function(oError) {
                            console.error("Error loading main entity:", oError);
                        }
                    });
                }
                
                
            }
        });
    });