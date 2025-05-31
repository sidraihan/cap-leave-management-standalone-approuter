namespace leave.management;
using { cuid,managed,sap.common.CodeList } from '@sap/cds/common';

entity Employee : managed {
    key ID : String(100);
    name: String(100);
    email: String(100);
    gender: String enum{
        Male = 'M';
        Female = 'F';
        Other = 'O';
    };
    role: String (20); //Employee, Manager, Admin -> Raihan: Will use this later for role based access
    manager: Association to Employee;
    leaveRequests: Composition of many LeaveRequest on leaveRequests.employee = $self;
    balances: Composition of many LeaveBalance on balances.employee = $self;
}

entity LeaveRequest :cuid,managed {
    employee: Association to Employee;
    type: Association to LeaveType;
    startDate: Date;
    endDate: Date;
    reason: String(255);
    status: Association to LeaveRequestStatus;
    approver: Association to Employee;
    numberOfDays: Integer;
    virtual isPending : Boolean;
}

entity LeaveBalance : cuid,managed {
    employee: Association to Employee;
    type: Association to LeaveType;
    balance: Double;
    
}

entity LeaveType : CodeList {
    key code: String(25);
    name: String(100);
}

// entity LeaveType : CodeList {
//     key code: String enum{
//          Annual= 'AL';
//          Sick = 'SL';
//          Unpaid = 'UL';
//          Maternity = 'ML';
//          Paternity = 'PL';
//          Bereavement = 'BL';
        
//     };
// }

entity LeaveRequestStatus : CodeList{
    key code: String(25)
}
