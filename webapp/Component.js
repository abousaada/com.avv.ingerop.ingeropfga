sap.ui.define([
    "sap/suite/ui/generic/template/lib/AppComponent",
    "sap/ui/model/json/JSONModel"
], function (AppComponent, JSONModel) {
    "use strict";

    return AppComponent.extend("com.avv.ingerop.ingeropfga.Component", {
        metadata: { manifest: "json" },
        init: function () {

            try {
                console.log("✅ AppComponent INIT called");
                AppComponent.prototype.init.apply(this, arguments);
            } catch (error) {
                console.error("Erreur dans Component init():", e);
            }



            // const yearModel = new JSONModel({});
            // this.setModel(yearModel, "yearModel");
        }
    })
});
//# sourceMappingURL=Component.js.map