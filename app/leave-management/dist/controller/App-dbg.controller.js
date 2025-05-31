sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, History, UIComponent, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("leave.management.controller.App", {
        onInit: function () {
            // Initialize the router
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.attachRouteMatched(this.onRouteMatched, this);

            // Set up tile data
            var oTileModel = new JSONModel({
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
                        info: "Approve/Reject leave requests",
                        icon: "sap-icon://task",
                        press: this.onApprovalsPress.bind(this)
                    }
                ]
            });
            this.getView().setModel(oTileModel, "tiles");

            // Initialize user model
            const oUserModel = new JSONModel({
                initials: "U" // This will be updated with actual user initials
            });
            this.getView().setModel(oUserModel, "userModel");
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
        },

        onMenuButtonPressed: function () {
            const oToolPage = this.byId("toolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onAvatarPressed: function (oEvent) {
            const oMenu = this.byId("userMenu");
            const oButton = oEvent.getSource();
            
            if (!this._userMenu) {
                this._userMenu = new sap.m.Menu({
                    items: [
                        new sap.m.MenuItem({
                            text: "Logout",
                            press: this.onLogout.bind(this)
                        })
                    ]
                });
            }
            
            this._userMenu.openBy(oButton);
        },

        onMenuItemSelected: function(oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            if (sKey === "logout") {
                this.onLogout();
            }
        },

        onLogout: function () {
            // Show confirmation dialog
            MessageBox.confirm("Are you sure you want to logout?", {
                title: "Logout Confirmation",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // Check if running in Fiori Launchpad
                        localStorage.clear();
                        sessionStorage.clear();
                        const cookies = document.cookie.split(";");

                        for (let i = 0; i < cookies.length; i++) {
                            const cookie = cookies[i];
                            const eqPos = cookie.indexOf("=");
                            const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                        }
                        sap.m.URLHelper.redirect("./logout", false);
                        BusyIndicator.show(0);
                    }
                }
            });
        }
    });
}); 