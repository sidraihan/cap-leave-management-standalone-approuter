sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, History, UIComponent, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("leave.management.controller.CreateLeaveRequest", {
        onInit: function () {
            this._oRouter = UIComponent.getRouterFor(this);
            this._oRouter.attachRouteMatched(this.onRouteMatched, this);
        },

        onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            if (sRouteName === "createLeaveRequest") {
                this._initializeForm();
            }
        },

        _initializeForm: function () {
            // Reset form fields
            this.byId("leaveTypeSelect").setSelectedKey("");
            this.byId("startDatePicker").setValue("");
            this.byId("endDatePicker").setValue("");
            this.byId("reasonTextArea").setValue("");
        },

        onDateChange: function (oEvent) {
            var oStartDate = this.byId("startDatePicker").getDateValue();
            var oEndDate = this.byId("endDatePicker").getDateValue();

            if (oStartDate && oEndDate && oStartDate > oEndDate) {
                MessageBox.warning("End date cannot be before start date");
                oEvent.getSource().setValueState("Error");
            } else {
                oEvent.getSource().setValueState("None");
            }
        },

        _formatDate: function(oDate) {
            if (!oDate) return null;
            
            // Get year, month and day parts
            const year = oDate.getFullYear();
            const month = String(oDate.getMonth() + 1).padStart(2, '0');
            const day = String(oDate.getDate()).padStart(2, '0');
            
            // Return in YYYY-MM-DD format
            return `${year}-${month}-${day}`;
        },

        onSubmit: async function () {
            if (!this._validateForm()) return;
        
            const oModel = this.getView().getModel();
            //console.log("Model:", oModel);

            try {
                const startDate = this._formatDate(this.byId("startDatePicker").getDateValue());
                const endDate = this._formatDate(this.byId("endDatePicker").getDateValue());
                
                //console.log("Start Date:", startDate);
                //console.log("End Date:", endDate);

                const mPayload = {
                    startDate: startDate,
                    endDate: endDate,
                    type_code: this.byId("leaveTypeSelect").getSelectedKey(),
                    reason: this.byId("reasonTextArea").getValue()
                };
                
                //console.log("Payload:", mPayload);

                // Create a context for the action
                const oContext = oModel.bindContext("/createLeave(...)");
                
                // Set the parameters for the action
                Object.entries(mPayload).forEach(([key, value]) => {
                    oContext.setParameter(key, value);
                });

                // Execute the action
                await oContext.execute();

                MessageBox.success("Leave request created successfully", {
                    onClose: () => {
                        this.onNavBack();
                    }
                });
            } catch (error) {
                MessageBox.error("Error creating leave request: " + error.message);
                console.error("Error:", error);
            }
        },

        _validateForm: function () {
            var bValid = true;
            var oView = this.getView();

            // Validate leave type
            if (!this.byId("leaveTypeSelect").getSelectedKey()) {
                this.byId("leaveTypeSelect").setValueState("Error");
                bValid = false;
            } else {
                this.byId("leaveTypeSelect").setValueState("None");
            }

            // Validate dates
            var oStartDate = this.byId("startDatePicker").getDateValue();
            var oEndDate = this.byId("endDatePicker").getDateValue();

            if (!oStartDate) {
                this.byId("startDatePicker").setValueState("Error");
                bValid = false;
            } else {
                this.byId("startDatePicker").setValueState("None");
            }

            if (!oEndDate) {
                this.byId("endDatePicker").setValueState("Error");
                bValid = false;
            } else {
                this.byId("endDatePicker").setValueState("None");
            }

            if (oStartDate && oEndDate && oStartDate > oEndDate) {
                this.byId("endDatePicker").setValueState("Error");
                bValid = false;
            }

            // Validate reason
            if (!this.byId("reasonTextArea").getValue()) {
                this.byId("reasonTextArea").setValueState("Error");
                bValid = false;
            } else {
                this.byId("reasonTextArea").setValueState("None");
            }

            return bValid;
        },

        onNavBack: function () {
            var oRouter = UIComponent.getRouterFor(this);
            if (oRouter) {
                oRouter.navTo("home", {}, true);
            } else {
                window.location.href = "/";
            }
        }
    });
}); 