sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("assumeshipment.controller.NotFound", {
        onInit: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "NotFound");
            var oRouter = this.getRouter();
            oRouter.attachRouteMatched(this.onRouteMatched, this);
        },

        _onNotFoundDisplayed: function () {
            this.getModel("appView").setProperty("/layout", "OneColumn");
        },

    });
});
