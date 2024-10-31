sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, formatter, MessageBox) {
    "use strict";

    return BaseController.extend("assumeshipment.controller.Detail", {

        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._bindView("/xTQAxASSUME_SHIPM_DD" + oEvent.getParameter("arguments").objectId);
        },

        _bindView: function (sObjectPath) {
            this.getView().bindElement({ path: sObjectPath });
        },

        handleAssumeShipment: function () {
            var that = this;

            MessageBox.warning(this.getResourceBundle().getText("confirmText"), {
                title: this.getResourceBundle().getText("confirmTitle"),
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that.onAssumeShipment();
                    }
                }
            });
        },

        onAssumeShipment: function () {
            var oShipmentModel = this.getView().getModel("shipmentModel"),
                oAppViewModel  = this.getModel("appView"),
                sBindingPath = this.getView().getBindingContext().getPath();

            if (sBindingPath && sBindingPath != "") {
                oShipmentModel.setProperty("/load/sPath", sBindingPath);
                oAppViewModel.setProperty("/shipmentStepValidated", true);
                this.handleLayoutChange();
            }
        },

        handleCloseShipmentDetailPressed: function () {
            this.handleLayoutChange();
        },
    });
});