using {leave.management as my} from '../db/schema';

service LeaveService {
    @cds.redirection.target 
    entity LeaveRequests as projection on my.LeaveRequest actions { 
        action approveRequest();
        action rejectRequest();
        action cancelRequest() returns String;
    };

    @requires: 'authenticated-user'
    @restrict: [
        {
            grant: ['READ', 'UPDATE'],
            to: 'Manager',
            where: 'approver_ID = $user'
        },
        {
            grant: ['approveRequest', 'rejectRequest'],
            to: 'Manager',
            where: 'approver_ID = $user'
        },
        {
            grant: '*',
            to: 'Admin'
        }
    ]
    entity ApprovalLeaveRequests as projection on my.LeaveRequest;

    @requires: 'authenticated-user'
    @restrict: [
        {
            grant: ['READ', 'CREATE', 'UPDATE'],
            to: 'Employee',
            where: 'employee_ID = $user'
        },
        {
            grant: 'cancelRequest',
            to: 'Employee',
            where: 'employee_ID = $user'
        },
        {
            grant: '*',
            to: 'Admin'
        }
    ]
    entity MyLeaveRequests as projection on my.LeaveRequest;

    @requires: 'authenticated-user'
    @restrict: [
        { 
            grant: ['READ'], 
            to: 'Employee',
            where: 'employee_ID = $user'
        },
        { 
            grant: '*', 
            to: 'Admin' 
        }
    ]
    entity LeaveBalances as projection on my.LeaveBalance;

    @requires: 'authenticated-user'
    @restrict: [
        { 
            grant: ['READ'], 
            to: ['Employee', 'Manager'] 
        },
        { 
            grant: '*', 
            to: 'Admin' 
        }
    ]
    entity LeaveTypes as projection on my.LeaveType;

    @requires: 'authenticated-user'
    @restrict: [
        { 
            grant: ['READ'], 
            to: ['Employee', 'Manager', 'Admin']
        }
    ]
    entity Employees as projection on my.Employee;
}