sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, MessageBox) {
    "use strict";

    return BaseController.extend("assumeshipment.controller.Register", {

        formatter: formatter,

        onInit: function () {
            this.getView().setModel(new JSONModel({}), "userDataModel");
            this.getOwnerComponent().getRouter().attachRouteMatched(this.onRouteMatched, this);
        },

        onRouteMatched: function (oEvent) {
            if (!oEvent || oEvent.getParameter("name") === 'register') {
                this.numberOfCalls = 0;
                this.onDialog();
            }
        },

        onGiftLoad: function () {
            this.byId("gif").setSrc("img/success.gif");
            this.byId("gif").setProperty("width", "180px");
            this.byId("gif").setProperty("height", "180px");

            setTimeout(function () {
                this.onDialogNextButtonRegister();
            }.bind(this), 1000);

            this.handleCreateBiometricScan();
        },

        onGetCitizen: function () {
            var oModel = this.getView().getModel();

            var that = this;

            return new Promise(function (resolve, reject) {
                oModel.read("/xTQAxASSUME_CITIZEN_DD", {
                    success: function (oData) {
                        if (oData.results && oData.results.length > 0) {
                            var oResult = oData.results[0];

                            if (oResult.FaceTemplate !== "200") {
                                reject({
                                    status: oResult.error_status,
                                });
                            } else {
                                that.getModel("userDataModel").setData(oData);
                                that.onGiftLoad();
                                resolve(oData);
                            }
                        } else {
                            reject({
                                status: "500",
                                message: "Unknown error occurred!"
                            });
                        }
                    },
                    error: function (oError) {
                        var sError = JSON.parse(oError.responseText).error.message.value;

                        MessageBox.alert(sError, {
                            icon: "ERROR",
                            onClose: function () {
                                window.location.href = "https://sap.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/assume_shipment/index.html?sap-client=100";
                            },
                            styleClass: '',
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit
                        });
                    }
                });
            });
        },

        handleCreateBiometricScan: function () {
            var that = this,
                oModel = this.getView().getModel(),
                sPath = "/xTQAxASSUME_DRIVER_DD",
                card = this.getModel("userDataModel").getData(),
                oEntry = {
                    citizen: card.results[0].Citizen,
                };

            oModel.create(sPath, oEntry, {
                success: function (oData) {
                    that.byId("page").setShowFooter(true);
                    that.byId("biometricgif").setSrc("img/success.gif");
                    that.byId("biometricgif").setProperty("width", "180px");
                    that.byId("biometricgif").setProperty("height", "180px");

                    setTimeout(function () {
                        MessageBox.success("Registo concluído com sucesso", {
                            title: "Sucesso",
                            actions: [MessageBox.Action.OK],
                            emphasizedAction: MessageBox.Action.OK,
                            onClose: function (oAction) {
                                if (oAction === MessageBox.Action.OK) {
                                    window.location.href = "https://sap.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/assume_shipment/index.html?sap-client=100";
                                }
                            }
                        });
                    }, 15000);
                },
                error: function (oError) {
                    var sError = JSON.parse(oError.responseText).error.message.value;

                    MessageBox.alert(sError, {
                        icon: "ERROR",
                        onClose: null,
                        styleClass: '',
                        initialFocus: null,
                        textDirection: sap.ui.core.TextDirection.Inherit
                    });
                }
            });
        },

        onDialog: function () {
            this.performServiceCall();
        },

        performServiceCall: function () {
            var that = this,
                oAppViewModel = this.getModel("appView"),
                oBusy = oAppViewModel.getProperty("/busy");

            oAppViewModel.setProperty("/busy", true);
            return that.onGetCitizen().then(function () {
            }).catch(function (error) {
                var status = error.status || "500";

                if (status !== "500") {
                    setTimeout(function () {
                        that.performServiceCall();
                    }, 3000);
                } else {
                    if (that.numberOfCalls <= 3) {
                        that.numberOfCalls++;

                        setTimeout(function () {
                            that.performServiceCall();
                        }, 3000);
                    } else {
                        if (oBusy) {
                            oAppViewModel.setProperty("/busy", false);
                            that.numberOfCalls = 0;

                            MessageBox.alert("Não foi possível efetuar a leitura do cartão de cidadão, tente novamente ou entre em contacto com o Responsável de Turno através do Intercomunicador..", {
                                icon: "ERROR",
                                onClose: function () {
                                    window.location.href = "https://sap.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/assume_shipment/index.html?sap-client=100";
                                },
                                styleClass: '',
                                initialFocus: null,
                                textDirection: sap.ui.core.TextDirection.Inherit
                            });
                        }
                    }
                }
            });
        }
    });
});