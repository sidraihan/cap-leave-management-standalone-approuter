namespace leave.management;
using { cuid,managed,sap.common.CodeList } from '@sap/cds/common';

entity Employee : cuid,managed {
    name: String(100);
    email: String(100);
    role: String (20); //Employee, Manager, Admin -> Raihan: Will use this later for role based access
    manager: Association to Employee;
    leaveRequests: Composition of many LeaveRequest on leaveRequests.employee = $self;
    balances: Composition of many LeaveBalance on balances.employee = $self;
}

entity LeaveRequest : cuid, managed {
    employee: Association to Employee;
    type: Association to LeaveType;
    startDate: Date;
    endDate: Date;
    reason: String(255);
    status: String enum{
        Pending;
        Approved;
        Rejected;
    };
    approver: Association to Employee;
}

entity LeaveBalance : cuid,managed {
    employee: Association to Employee;
    type: Association to LeaveType;
    balance: Double;
    
}

entity LeaveType : CodeList {
    key code: String(10);
    name: localized String(50);
    description: localized String(50);
}
