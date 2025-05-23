sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent"
], function (Controller, History, UIComponent) {
    "use strict";

    return Controller.extend("leave.management.controller.App", {
        onInit: function () {
            // Initialize the router
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.attachRouteMatched(this.onRouteMatched, this);

            // Set up tile data
            var oTileModel = new sap.ui.model.json.JSONModel({
                tiles: [
                    {
                        title: "My Leaves",
                        info: "View your leave requests",
                        icon: "sap-icon://list",
                        press: this.onMyLeavesPress.bind(this)
                    },
                    {
                        title: "Create Leave",
                        info: "Submit a new leave request",
                        icon: "sap-icon://add",
                        press: this.onCreateLeavePress.bind(this)
                    },
                    {
                        title: "Leave Balances",
                        info: "View your leave balances",
                        icon: "sap-icon://table-view",
                        press: this.onLeaveBalancesPress.bind(this)
                    },
                    {
                        title: "Approvals",
                        info: "Approve or reject leave requests",
                        icon: "sap-icon://task",
                        press: this.onApprovalsPress.bind(this)
                    }
                ]
            });
            this.getView().setModel(oTileModel, "tiles");
        },

        onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            // Handle route matching if needed
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo("leaveRequests", {}, true);
            }
        },

        onMyLeavesPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("leaveRequests");
        },

        onCreateLeavePress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("createLeaveRequest");
        },

        onLeaveBalancesPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("leaveBalances");
        },

        onApprovalsPress: function () {
            // For now, navigate to leaveRequests (or implement approvals route if available)
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("approvalLeaveRequests");
        },

        onTilePress: function(oEvent) {
            var oTile = oEvent.getSource();
            var oCtx = oTile.getBindingContext("tiles");
            var sTitle = oCtx.getProperty("title");
            var oRouter = UIComponent.getRouterFor(this);
            switch (sTitle) {
                case "My Leaves":
                    oRouter.navTo("leaveRequests");
                    break;
                case "Create Leave":
                    oRouter.navTo("createLeaveRequest");
                    break;
                case "Leave Balances":
                    oRouter.navTo("leaveBalances");
                    break;
                case "Approvals":
                    oRouter.navTo("approvalLeaveRequests"); // or a dedicated approvals route
                    break;
            }
        }
    });
}); 