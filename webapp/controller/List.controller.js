sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, formatter, MessageBox) {
    "use strict";
    return BaseController.extend("assumeshipment.controller.List", {

        formatter: formatter,

        // LIFECYCLE METHODS
        onInit: function () {
            this.getView().addEventDelegate({
                onBeforeFirstShow: function () {
                    this.getOwnerComponent().oListSelector.setBoundList(this.byId("list"));
                }.bind(this)
            });

            this.getRouter().getRoute("list").attachPatternMatched(this._patternMatched, this);
        },

        onAfterRendering: function () {
            var oFilterBookings = new sap.ui.model.Filter("load_type", sap.ui.model.FilterOperator.EQ, "5");
            this.byId("list1").getBinding("items").filter([oFilterBookings]);
        },

        _resetWizard: function () {
            try {
                var oWizard = this.byId("CheckInWizard");

                if (oWizard) {
                    this.byId("gif").setSrc("sap-icon://biometric-face");
                    this.byId("gif").setColor("white");

                    oWizard.discardProgress(oWizard.getSteps()[0]);

                    return true;
                }
            } catch (error) {
                this._resetProgress();
            }
        },

        _patternMatched: function () {
            var oWizard = this.byId("CheckInWizard"),
                oCurrentStep = this.byId(oWizard.getCurrentStep());

            if (oCurrentStep) {
                var isValidated = oCurrentStep.getValidated();

                // PRIMEIRO PASSO: DETEÇÃO FACIAL
                if (oCurrentStep.sId.includes("BiometricInfo") && !isValidated) {
                    this.checkDriverData();
                } else if (oCurrentStep.sId.includes("BiometricInfo") && isValidated) {
                    this._stepNavigator(oCurrentStep);
                }

                // SEGUNDO PASSO: ESCOLHER TRANSPORTE
                if (oCurrentStep.sId.includes("Shipment") && isValidated) {
                    this._stepNavigator(oCurrentStep);
                }

                // TERCEIRO PASSO: LEITURA DE MATRÍCULAS
                if (oCurrentStep.sId.includes("PlatesValidation") && isValidated) {
                    this._stepNavigator(oCurrentStep);
                }
            } else {
                var oShipmentModel = this.getModel("shipmentModel"),
                    oDriverData = oShipmentModel.getProperty("/driver");

                if (Object.keys(oDriverData).length == 0) {
                    this.checkDriverData();
                }
            }

            this._attachUserActivityListeners();
            this._resetInactivityTimer();
        },

        // LIFECYCLE METHODS: LIST SELECTION CHANGE
        onSelectionChange: function (oEvent) {
            var sPath = "";
            sPath = "/xTQAxASSUME_SHIPM_DD";

            var oList = oEvent.getSource(),
                bSelected = oEvent.getParameter("selected");

            if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
                this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

                this.getRouter().navTo("object", {
                    objectId: oEvent.getSource().getSelectedContextPaths()[0].substring(sPath.length)
                }, false, true);
            }
        },

        // STEP 1: CHECK DRIVER DATA
        checkDriverData: function (tryagain) {
            var that = this,
                oModel = this.getView().getModel(),
                oShipmentModel = this.getModel("shipmentModel"),
                sPath = "/xTQAxASSUME_DRIVER_DD",
                oAppViewModel = this.getModel("appView");

            oModel.read(sPath, {
                success: function (oData) {
                    if (oData.results) {
                        if (oData.results.length > 0 && oShipmentModel) {
                            oShipmentModel.setProperty("/driver", oData.results[0]);
                            that._driverDataChecked();
                        }
                    } else {
                        that._repeatProccess();
                    }
                },
                error: function (oError) {
                    if (!tryagain) {
                        that._repeatProccess(JSON.parse(oError.responseText).error.message.value);
                    } else {
                        window.location.href = "https://sap.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/assume_shipment/index.html?sap-client=100";
                    }
                }
            });

            oModel.attachRequestSent(function () {
                oAppViewModel.setProperty("/busy", true);
            });
            oModel.attachRequestCompleted(function () {
                oAppViewModel.setProperty("/busy", false);
            });
            oModel.attachRequestFailed(function () {
                oAppViewModel.setProperty("/busy", false);
            });
        },

        // STEP 1: DRIVER DATA CHECKED
        _driverDataChecked: function () {
            var oWizard = this.byId("CheckInWizard"),
                oCurrentStep = this.byId(oWizard.getCurrentStep());

            this.byId("gif").setSrc("sap-icon://message-success");
            this.byId("gif").setColor("green");

            setTimeout(function () {
                this._stepNavigator(oCurrentStep)
            }.bind(this), 2000);
        },

        // STEP 3: GET PLATE'S AND IMAGES AND BUILD LAYOUT
        getPlates: function () {
            try {
                var oModel = this.getModel(),
                    oShipmentModel = this.getModel("shipmentModel"),
                    oAppViewModel = this.getModel("appView"),
                    that = this;

                oModel.read("/xTQAxASSUME_PLAT_DD", {
                    filters: [new sap.ui.model.Filter("nrordemcliente", sap.ui.model.FilterOperator.EQ, oAppViewModel.getProperty("/bypass"))],
                    success: function (oData) {
                        if (oShipmentModel && oData.results) {
                            if (oData.results.length > 0) {
                                if ((oData.results[0].log_matricula && oData.results[0].log_matricula != "") && (oData.results[0].reboque && oData.results[0].reboque != "")) {
                                    oShipmentModel.setProperty("/set/idstring", oData.results[0].idstring);
                                    oShipmentModel.setProperty("/set/trator", oData.results[0].log_matricula);
                                    oShipmentModel.setProperty("/set/reboque", oData.results[0].reboque);

                                    debugger;
                                    if (oData.results[0].log_trator != "") {
                                        oShipmentModel.setProperty("/set/imagem", oData.results[0].log_trator);
                                    }

                                    if (oData.results[0].log_reboque != "") {
                                        oShipmentModel.setProperty("/set/imagem_reboque", oData.results[0].log_reboque);
                                    }

                                    that.byId("VALIDATE_BT").setVisible(true);
                                }
                            } else {
                                MessageBox.warning("Não foi possível detetar as matrículas, deseja tentar novamente? Caso queira, verifique se o camião está estacionado corretamente tendo em conta as marcações feitas...", {
                                    title: "Atenção",
                                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                    emphasizedAction: MessageBox.Action.YES,
                                    onClose: function (oAction) {
                                        if (oAction === MessageBox.Action.YES) {
                                            that.getPlates();
                                        } else {
                                            that._resetProgress();
                                        }
                                    }
                                });
                            }
                        }
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

                oModel.attachRequestSent(function () {
                    oAppViewModel.setProperty("/busy", true);
                });
                oModel.attachRequestCompleted(function () {
                    oAppViewModel.setProperty("/busy", false);
                });
                oModel.attachRequestFailed(function () {
                    oAppViewModel.setProperty("/busy", false);
                });
            } catch (error) {
                this.showErrorMessage({ title: "Erro", text: error.message });
            }
        },

        // STEP 3: IMAGE PRESSED
        handleImagePressed: function (oEvent) {
            if (oEvent.getSource().getSrc()) {
                this.onOpenImagePressed(oEvent.getSource().getSrc());
            }
        },

        // STEP 3: SET SHIPMENT
        handleSetShipment: function () {
            var that = this;

            MessageBox.warning("Tem a certeza que pretende assumir este transporte?", {
                title: "Atenção",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that.onSetShipment();
                    }
                }
            });
        },

        onSetShipment: function () {
            try {
                var oModel = this.getModel(),
                    oShipmentModel = this.getModel("shipmentModel"),
                    oDriverData = oShipmentModel.getProperty("/driver"),
                    oLoadData = oShipmentModel.getProperty("/load"),
                    oSetData = oShipmentModel.getProperty("/set"),
                    oMessage = {};

                if (oShipmentModel) {
                    if (oDriverData) {
                        if (!oDriverData.usrid || oDriverData.usrid == "") {
                            oMessage.description = "Erro a identificar o motorista.";
                        }
                    } else {
                        oMessage.description = "Erro técnico.";
                    }

                    if (oLoadData) {
                        if (!oLoadData.sPath || oLoadData.sPath == "") {
                            oMessage.description = "Erro a identificar o transporte.";
                        }
                    } else {
                        oMessage.description = "Erro técnico.";
                    }

                    if (oSetData) {
                        if (!oSetData.idstring || oSetData.idstring == "") {
                            oMessage.description = "Erro técnico.";
                        }

                        if (!oSetData.trator || oSetData.trator == "") {
                            oMessage.description = "Erro a identificar o trator.";
                        }

                        if (!oSetData.reboque || oSetData.reboque == "") {
                            oMessage.description = "Erro a identificar o reboque.";
                        }
                    } else {
                        oMessage.description = "Erro técnico.";
                    }

                    if (Object.keys(oMessage).length == 0) {
                        var oEntry = {
                            driver_no: oDriverData.usrid,
                            idstring: oSetData.idstring,
                            trator: oSetData.trator,
                            reboque: oSetData.reboque
                        },
                            sPath = oLoadData.sPath,
                            that = this,
                            oAppViewModel = this.getModel("appView"),
                            oCurrentStep = this.byId(this.byId("CheckInWizard").getCurrentStep());

                        if (sPath) {
                            oModel.update(sPath, oEntry, {
                                success: function () {
                                    oAppViewModel.setProperty("/assumeShipmentBtn", false);
                                    oAppViewModel.setProperty("/shipmentAssumed", true);

                                    that._stepNavigator(oCurrentStep);
                                },
                                error: function (oError) {
                                    var sError = JSON.parse(oError.responseText).error.message.value;

                                    MessageBox.alert(sError, {
                                        icon: MessageBox.Icon.ERROR,
                                        onClose: null,
                                        styleClass: '',
                                        initialFocus: null,
                                        textDirection: sap.ui.core.TextDirection.Inherit
                                    });
                                }
                            });

                            oModel.attachRequestSent(function () {
                                oAppViewModel.setProperty("/busy", true);
                            });
                            oModel.attachRequestCompleted(function () {
                                oAppViewModel.setProperty("/busy", false);
                            });
                            oModel.attachRequestFailed(function () {
                                oAppViewModel.setProperty("/busy", false);
                            });
                        }
                    }
                }
            } catch (error) {
                this.showErrorMessage({ title: "Erro", text: error.message });
            }
        },

        // STEP 4: FINISH CHECK-IN
        handleWizardSubmit: function () {
            try {
                var oModel = this.getModel(),
                    oObject = oModel.getObject(this.getModel("shipmentModel").getProperty("/load").sPath),
                    sPath = "/ChangeLoads('" + oObject.nrordemcliente + "')",
                    oEntry = {
                        Text: "teste"
                    },
                    oWizard = this.byId("CheckInWizard"),
                    oCurrentStep = this.byId(oWizard.getCurrentStep());

                oModel.update(sPath, oEntry, {});

                oCurrentStep.setValidated(true);
                this._resetProgress();
            } catch (error) {
                this.showErrorMessage({ title: "Erro", text: error.message });
            }
        }
    });
});