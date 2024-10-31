sap.ui.define([], function () {
    "use strict";

    return {
        dateFormat: function (oDate) {
            if (oDate != null) {
                var oDate = (oDate instanceof Date) ? oDate : new Date(oDate);
                var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy" });

                return dateFormat.format(oDate);
            }
        },

        dateTimeFormat: function (oDate) {
            if (oDate != null) {
                var oDate = (oDate instanceof Date) ? oDate : new Date(oDate);
                var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy HH:mm" });

                return dateFormat.format(oDate);
            }
        },

        driverid: function (oDriverId) {
            if (oDriverId) {
                return this.getView().getModel("i18n").getResourceBundle().getText("notavailable");
            } else {
                return this.getView().getModel("i18n").getResourceBundle().getText("available");
            }
        },

        stateLoad: function (oDriverId) {
            if (oDriverId) {
                return "Warning"
            } else {
                return "Success"
            }
        },

        assumeload: function (oDriverNo) {
            if (oDriverNo) {
                return false;
            } else {
                return true;
            }
        },

        codcompartimento: function (oCompartimento) {
            if (oCompartimento === null || oCompartimento === undefined) {
                return "";
            }

            return oCompartimento.replace(/^0+/, '');
        }

    };
});