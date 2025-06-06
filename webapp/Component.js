sap.ui.define([
    "sap/suite/ui/generic/template/lib/AppComponent",
    "sap/ui/model/json/JSONModel"
], function (AppComponent, JSONModel) {
    "use strict";

    var component = AppComponent.extend("com.avv.ingerop.ingeropfga.Component", {
        metadata: { manifest: "json" },
        onBeforeRendering: function (event) {
            const yearModel = new JSONModel({});
            this.setModel(yearModel, "yearModel");
        }
    });

    return component;
});
//# sourceMappingURL=Component.js.map