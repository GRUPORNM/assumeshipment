sap.ui.define([
    "./BaseController",
    "../model/formatter",
], function (BaseController, formatter) {
    "use strict";

    return BaseController.extend("assumeshipment.controller.Start", {

        formatter: formatter,

        onInit: function () {

        },

        onAfterRendering: function () {
            var oButtonA = this.getView().byId("LOGIN_SUBMIT_BLOCK");
            oButtonA.$().on("click", this.onPress.bind(this));

            var oButtonB = this.getView().byId("NEW_SUBMIT_BLOCK");
            oButtonB.$().on("click", this.onPressNewDriver.bind(this));
        },

        onPress: function () {
            this.onNavigation("", "list", "");
        },

        onPressNewDriver: function () {
            this.onNavigation("", "register", "");
        }

    });
});