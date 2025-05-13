using {leave.management as my} from '../db/schema';

service LeaveService {
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
            to: 'Employee',
            where: 'createdBy = $user'
        },
        {
            grant: 'DELETE',
            to: 'Employee',
            where: 'createdBy = $user'
        },
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
            grant: '*',
            to: 'Admin'
        }
    ]
    entity LeaveRequests as projection on my.LeaveRequest actions{
        action approveRequest();
        action rejectRequest();
  };

    // Employees and managers can view balances, admins can update them
  @restrict: [
        { 
            grant: 'READ', 
            to: 'Employee',
            where: 'employee_ID = $user'
        },
        {
            grant: 'READ',
            to: 'Manager'
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
            grant: '*', 
            to: 'Admin' 
        }
  ]
  entity LeaveTypes as projection on my.LeaveType;

  // Everyone can read their own profile, Admins can manage all
  @restrict: [
        { 
            grant: 'READ', 
            to: ['Employee', 'Manager'] 
        },
        { 
            grant: '*', 
            to: 'Admin' 
        }
  ]
  entity Employees as projection on my.Employee;
    
}