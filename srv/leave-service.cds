using {leave.management as my} from '../db/schema';

service LeaveService {

    @cds.redirection.target entity LeaveRequests as projection on my.LeaveRequest actions{ 
        action approveRequest();
        action rejectRequest();
        action cancelRequest() returns String;
        //function getLeaveRequests @(restrict: ['READ'])() returns my.LeaveRequest;
  };


@requires: 'authenticated-user'
    @restrict: [
        {
            grant: 'READ',
            to: 'Manager',
            where: 'approver_ID = $user'
        },
        {
            grant: 'UPDATE',
            to: 'Manager',
            where: 'approver_ID = $user'
        },
        {
            grant: 'approveRequest',
            to: 'Manager',
            where: 'approver_ID = $user'  //We will check this in the service handler
        },
        {
            grant: 'rejectRequest',
            to: 'Manager',
            where: 'approver_ID = $user'  //We will check this in the service handler
        },
        {
            grant: '*',
            to: 'Admin'
        }
    ]
  entity ApprovalLeaveRequests as projection on my.LeaveRequest{
    ID,
    employee,
    type,
    startDate,
    endDate,
    reason,
    status,
    approver,
    numberOfDays
  };
 // annotate LeaveService.LeaveRequests with @odata.draft.enabled;
 @requires: 'authenticated-user'
    @restrict: [
        {
            grant: 'READ',
            to: 'Employee',
            where: 'employee_ID = $user'
        },
        {
            grant: 'CREATE',
            to: 'Employee'
        },
        {
            grant: 'UPDATE',
            to: 'Employee'
        },
        {
            grant: 'DELETE',
            to: 'Employee',
            where: 'createdBy = $user'
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
    // Employees and managers can view balances, admins can update them
  @restrict: [
        { 
            grant: 'READ', 
            to: 'Employee',
            where: 'employee_ID = $user'
        },
        { 
            grant: '*', 
            to: 'Admin' 
        }
  ]
  entity LeaveBalances as projection on my.LeaveBalance;

  // Only Admins manage the master data of Leave Types
  @restrict: [
        { 
            grant: 'READ', 
            to: ['Employee', 'Manager'] 
        },
        { 
            grant: 'UPDATE', 
            to: ['Employee', 'Manager'] 
        },
        { 
            grant: '*', 
            to: 'Admin' 
        }
  ]
  entity LeaveTypes as projection on my.LeaveType;

  // Everyone can read their own profile, Admins can manage all
  @restrict: [
        { 
            grant: 'READ', 
            to: 'Employee'
            //where: 'ID = $user' 
        },
        { 
            grant: 'READ', 
            to: 'Manager'
            //where: 'manager_ID = $user' 
        },
        { 
            grant: '*', 
            to: 'Admin' 
        }
  ]
  entity Employees as projection on my.Employee;
//   entity Employees as select from my.Employee{
//         ID,
//         name,
//         email,
//         manager
//   };
    
}