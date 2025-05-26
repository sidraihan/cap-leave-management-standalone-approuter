sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, History, UIComponent, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("leave.management.controller.LeaveBalances", {
        onInit: function () {
            this._oRouter = UIComponent.getRouterFor(this);
            this._oRouter.attachRouteMatched(this.onRouteMatched, this);
        },

        formatDate: function(sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            if (isNaN(oDate)) return "";
            var day = oDate.getDate().toString().padStart(2, '0');
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var month = monthNames[oDate.getMonth()];
            var year = oDate.getFullYear();
            return `${day}-${month}-${year}`;
        },

        onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            if (sRouteName === "leaveRequests") {
                this._loadLeaveRequests();
            }
        },

        _loadLeaveRequests: function () {
            var oTable = this.byId("leaveRequestsTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
            }
        },

        formatStatusState: function (sStatus) {
            switch (sStatus) {
                case "Approved":
                    return "Success";
                case "Rejected":
                    return "Error";
                case "Pending":
                    return "Warning";
                default:
                    return "None";
            }
        },

        onApproveRequest: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var oLeaveRequest = oBindingContext.getObject();
            
            this._callAction(oLeaveRequest.ID, "approveRequest", "Leave request approved successfully");
        },

        onRejectRequest: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            var oLeaveRequest = oBindingContext.getObject();
            
            this._callAction(oLeaveRequest.ID, "rejectRequest", "Leave request rejected successfully");
        },

        _callAction: function (sId, sAction, sSuccessMessage) {
            var oModel = this.getView().getModel();
            var sPath = "/LeaveRequests(" + sId + ")/" + sAction;
            
            oModel.callFunction(sPath, {
                method: "POST",
                success: function () {
                    MessageBox.success(sSuccessMessage);
                    this._loadLeaveRequests();
                }.bind(this),
                error: function (oError) {
                    MessageBox.error("Error: " + oError.message);
                }
            });
        },

        onCreateLeaveRequest: function () {
            this._oRouter.navTo("createLeaveRequest");
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