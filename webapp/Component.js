sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "./model/models",
    "./controller/ListSelector"
],
    function (UIComponent, Device, models, ListSelector) {
        "use strict";

        return UIComponent.extend("assumeshipment.Component", {
            metadata: {
                manifest: "json"
            },

            init: function () {
                this.oListSelector = new ListSelector();

                this.setModel(models.createDeviceModel(), "device");
                this.setModel(models.createGlobalModel(), "global");

                UIComponent.prototype.init.apply(this, arguments);

                this.getRouter().initialize();
            },

            destroy: function () {
                this.oListSelector.destroy();

                UIComponent.prototype.destroy.apply(this, arguments);
            },

            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    } else if (!Device.support.touch) {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            }

        });
    });