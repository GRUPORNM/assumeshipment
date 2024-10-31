sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("assumeshipment.controller.BaseController", {
        INACTIVITY_TIMEOUT: 10 * 1000, // 5 minutos
        _inactivityTimer: null,

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onNavigation: function (sPath, oRoute, oEntityName) {
            if (sPath) {
                this.getRouter().navTo(oRoute, {
                    objectId: sPath.replace(oEntityName, "")
                }, false, true);
            } else {
                this.getRouter().navTo(oRoute, {}, false, true);
            }
        },

        toggleFullScreen: function () {
            debugger;
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);

            if (!bFullScreen) {
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        },

        onDialogNextButtonRegister: function () {
            this._iSelectedStepIndex = this.byId("DriverRegister").getSteps().indexOf(this._oSelectedStep);
            var oNextStep = this.byId("DriverRegister").getSteps()[this._iSelectedStepIndex + 1];

            this.byId("DriverRegister").nextStep();

            this._iSelectedStepIndex++;
            this._oSelectedStep = oNextStep;
        },

        handleLayoutChange: function () {
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            this.getModel("appView").setProperty("/layout", "OneColumn");
            this.getRouter().navTo("list");
        },

        onRefresh: function () {
            var oWizard = this.byId("CheckInWizard"),
                oCurrentStep = oWizard.getCurrentStep(),
                oShipmentModel = this.getModel("shipmentModel"),
                oAppViewModel = this.getModel("appView");

            if (oCurrentStep && oShipmentModel) {
                if (oCurrentStep.includes("Shipment") || oCurrentStep.includes("PlatesValidation")) {
                    if (oShipmentModel.getProperty("/load")) {
                        var oLoadData = oShipmentModel.getProperty("/load"),
                            oShipmentAssumed = oAppViewModel.getProperty("/shipmentAssumed");

                        if ((oLoadData.sPath && oLoadData.sPath != "") && oShipmentAssumed) {
                            this.showErrorMessage({ title: "Erro", text: "Não é possível cancelar o processo de check-in, para mais informações contacte o responsável de turno através " });
                        } else {
                            this._resetProgress();
                            
                            // SET INITIAL LAYOUT
                            this.getOwnerComponent().oListSelector.clearMasterListSelection();
                            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
                            this.getModel("appView").setProperty("/layout", "OneColumn");
                        }
                    } else {
                        this.showWarningMessage({ title: "Atenção", text: "Tem a certeza que pretende cancelar o processo de check-in?" });
                    }
                }
            }
        },

        showWarningMessage: function (oMessage) {
            var that = this;

            MessageBox.warning(oMessage.text, {
                title: oMessage.title,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._resetProgress();
                    }
                }
            });
        },

        showErrorMessage: function (oMessage) {
            MessageBox.error(oMessage.text, {
                title: oMessage.title,
                actions: [sap.m.MessageBox.Action.OK],
                emphasizedAction: sap.m.MessageBox.Action.OK
            });
        },

        handleWizardNavigationChange: function (oEvent) {
            var oParam = oEvent.getParameter("step"),
                oWizard = this.byId("CheckInWizard"),
                oAppViewModel = this.getModel("appView"),
                oShipmentAssumed = oAppViewModel.getProperty("/shipmentAssumed");

            if (oParam.sId.includes("Shipment") && !oShipmentAssumed) {
                oWizard.setCurrentStep(oParam);
            }

            oParam.setValidated(false);
        },

        _resetProgress: function () {
            var oWizard = this.byId("CheckInWizard");

            if (oWizard) {
                oWizard.discardProgress(oWizard.getSteps()[0]);

                oWizard.getSteps().forEach(function (oStep) {
                    oStep.setValidated(false);
                });

                oWizard.goToStep(oWizard.getSteps()[0]);
            }

            this._clearModelData();
            this.onNavigation("", "start", "");
        },

        _stepNavigator: function (oFinishStep) {
            var oWizard = this.byId("CheckInWizard");

            if (oFinishStep) {
                if (oFinishStep.sId.includes("PlatesValidation")) {
                    var oButton = this.byId("VALIDATE_BT");
                    oButton.setVisible(false);
                }

                oFinishStep.setValidated(true);
                oWizard.nextStep();
            }
        },

        _repeatProccess: function (oError) {
            var that = this,
                message;

            if (oError) {
                message = oError
            } else {
                message = "Falha na leitura biométrica. Deseja tentar novamente?";
            }

            MessageBox.warning(message, {
                title: "Aviso",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that.checkDriverData(true);
                    } else {
                        window.location.href = "https://sap.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/assume_shipment/index.html?sap-client=100";
                    }
                }
            });
        },

        _checkModelData: function (pModel) {
            var oShipmentModel = this.getModel(pModel);

            if (oShipmentModel) {
                var oData = oShipmentModel.getData();

                var bIsFilled = Object.keys(oData).some(function (sKey) {
                    var oProperty = oData[sKey];
                    if (typeof oProperty === "object") {
                        return Object.keys(oProperty).some(function (sSubKey) {
                            return oProperty[sSubKey] !== "" && oProperty[sSubKey] !== null && oProperty[sSubKey] !== undefined;
                        });
                    } else {
                        return oProperty !== "" && oProperty !== null && oProperty !== undefined;
                    }
                });

                return bIsFilled;
            }

            return false;
        },

        _clearModelData: function () {
            var oShipmentModel = this.getModel("shipmentModel"),
                oAppViewModel = this.getModel("appView");

            if (oShipmentModel) {
                oShipmentModel.setProperty("/driver", {});
                oShipmentModel.setProperty("/set", { idstring: "", trator: "", reboque: "" });
                oShipmentModel.setProperty("/load", { sPath: "" });
            }

            if (oAppViewModel) {
                oAppViewModel.setProperty("/assumeShipmentBtn", true);
                oAppViewModel.setProperty("/shipmentAssumed", false);
                oAppViewModel.setProperty("/shipmentStepValidated", false);
                oAppViewModel.setProperty("/bypass", "");
                oAppViewModel.setProperty("/busy", false);
            }
        },

        _attachUserActivityListeners: function () {
            var aEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove', 'touchend'];

            aEvents.forEach(function (sEvent) {
                document.addEventListener(sEvent, this._resetInactivityTimer.bind(this));
            }.bind(this));
        },

        _resetInactivityTimer: function () {
            clearTimeout(this._inactivityTimer);

            this._inactivityTimer = setTimeout(function () {
                this._handleInactivity();
            }.bind(this), this.INACTIVITY_TIMEOUT);
        },

        _handleInactivity: function () {
            var oViewName = this.getView().getViewName();

            if (oViewName.includes("List")) {
                var oAppViewModel = this.getModel("appView"),
                    oShipmentAssumed = oAppViewModel.getProperty("/shipmentAssumed"),
                    oShipmentModel = this.getModel("shipmentModel"),
                    sPath = oShipmentModel.getProperty("/load/sPath");

                if (oShipmentAssumed && sPath) {
                    var checked = this._checkModelData("shipmentModel");

                    if (checked) {
                        this.handleWizardSubmit();
                    }
                }
            }
        },

        onOpenImagePressed: function (imgsrc) {
            if (!this._oDialog) {
                this._oDialog = new sap.m.Dialog({
                    id: "ImageDialog",
                    afterClose: () => {
                        if (this._oDialog) {
                            this._oDialog.destroy();
                            this._oDialog = null;
                        }
                    },
                    content: new sap.m.VBox({
                        items: [
                            new sap.m.Image({
                                width: "100%",
                                height: "100%",
                                src: imgsrc
                            })
                        ]
                    }),
                    buttons: [
                        new sap.m.Button({
                            id: "CancelDestination",
                            text: this.getResourceBundle().getText("closeColumn"),
                            type: sap.m.ButtonType.Default,
                            press: () => {
                                this._oDialog.close();
                            }
                        })
                    ]
                });
                this.getView().addDependent(this._oDialog);
            }

            this._oDialog.open();
        }
    });
});