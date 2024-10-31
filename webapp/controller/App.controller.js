sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("assumeshipment.controller.App", {

        onInit: function () {
            var iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

            var oViewModel = new JSONModel({
                busy: true,
                delay: 0,
                layout: "OneColumn",
                previousLayout: "",
                actionButtonsInfo: {
                    midColumn: {
                        fullScreen: false
                    }
                }, 
                assumeShipmentBtn: true, 
                shipmentAssumed: false, 
                shipmentStepValidated: false,
                bypass: ""
            });

            var oData = new JSONModel({
                driver: {},  
                set: { idstring: "", trator: "", reboque: ""},  
                load: { sPath: "" } 
            });

            this.setModel(oViewModel, "appView");
            this.setModel(oData, "shipmentModel");

            var fnSetAppNotBusy = function () {
                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/delay", iOriginalBusyDelay);
            };

            this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
            this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }
    });
});