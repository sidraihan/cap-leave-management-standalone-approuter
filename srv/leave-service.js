const cds = require('@sap/cds');
const { parseISO, eachDayOfInterval, isWeekend, nextDay } = require('date-fns');
const { SELECT, INSERT, UPDATE, DELETE } = require('@sap/cds/lib/ql/cds-ql');
console.log("File is leaded")
module.exports = async function (srv){
    // Add user attribute mapping middleware
    srv.before('*', async (req) => {
        const email = req.user.attr.email;
        console.log('Request path:', req.path);
        console.log('Request method:', req.method);
        console.log('User attributes:', req.user.attr);
        console.log('User object::', req.user);
        
        if (email) {
            // Map the email from JWT to user.id for authorization
            req.user.id = email;
            console.log('User mapped:', req.user.id);
           }   
             else {
                console.warn('No email found in user attributes');
                console.log('Full user object:', req.user);
                console.log('User roles:', !(req.user.roles.Admin));
            }
        
    });

    // Add debug middleware for batch requests
    srv.before('READ', '*', async (req) => {
        if (req.headers && req.headers['x-http-method'] === 'BATCH') {
            console.log('Processing batch request for:', req.path);
            console.log('Current user context:', req.user);
            console.log('User role:', req.user.role);
        }
    });

    const {LeaveRequest,Employee,LeaveBalance} = cds.entities;

    //Approve action
    srv.on('approveRequest', 'LeaveRequests',async (req) => {
        const ID = req.params[0];
        const {approver_ID} = await SELECT.one.from(LeaveRequest).where({ID: ID});
        //console.log("Approver is:" +approver_ID)
        //console.log("ID from req is:"+ID);
        const user = req.user;
        //console.log(user);
        console.log("Req.user.role inside approve request is:", req.user.role);

        if(!(req.user.roles.Admin) && !(approver_ID === req.user.id) ){
            return req.error(403, "You cannot perform this action, as you are not the leave applier's manager")
        }

        await UPDATE.entity(LeaveRequest)
        .with({status_code: 'Approved'})
        .where({ ID: ID });

        return {message: 'Leave Request Approved'}

    });

    // Reject action
    srv.on('rejectRequest', async (req) => {
        const ID  = req.params[0];
        const tx= cds.transaction(req);
        const {approver_ID,numberOfDays,type_code,employee_ID} = await SELECT.one.from(LeaveRequest).where({ID: ID});
        const user = req.user;

        if(!(req.user.roles.Admin) && !(approver_ID === req.user.id) ){
            return req.error(403, "You cannot perform this action, as you are not the leave applier's manager")
        }

        await tx.run(UPDATE.entity(LeaveRequest)
        .with({status_code: 'Rejected'})
        .where({ ID: ID }));

        const currLeaveBalance = await SELECT.one.from(LeaveBalance).where({employee_ID: employee_ID, type_code: type_code})

        if(numberOfDays){
            await tx.run(UPDATE.entity(LeaveBalance)
                .with({ balance: currLeaveBalance.balance + numberOfDays })
                .where({ ID: currLeaveBalance.ID }));
        }

        return { message: 'Leave request rejected.' };
    });

    srv.on('READ', 'MyLeaveRequests',async (req) => {
        console.log('Reading MyLeaveRequests');
        console.log('User context:', req.user);
        // Let CAP handle the query including pagination
        const tx = cds.transaction(req);
        
        if (req.user.role === 'Admin') {
            // For admin, just run the query as is
            return tx.run(req.query);
        } else {
            // For non-admin, add the approver filter to the existing query
            
            // const results =  await tx.run(req.query);
            // //console.log("Results are:", results);
            // const filteredResults = results.filter(row => row.createdBy === req.user.id);
            // return filteredResults;
            return tx.run(req.query);
        }
    });

    srv.on('READ', 'ApprovalLeaveRequests', async (req) => {
        console.log("ApprovalLeaveRequests READ is being called");
        console.log("User ID is:", req.user.id);

        // Let CAP handle the query including pagination
        const tx = cds.transaction(req);
        
        if (req.user.role === 'Admin') {
            // For admin, just run the query as is
            return tx.run(req.query);
        } else {
            // For non-admin, add the approver filter to the existing query
            // const results = await tx.run(req.query);
            // const filteredResults = results.filter(row => row.approver_ID === req.user.id);

            return tx.run(req.query);
        }
    });

    srv.after('READ', 'ApprovalLeaveRequests', (results, req) => {
        const entries = Array.isArray(results) ? results : [results];
        entries.forEach(row => {
            row.isPending = row.status.code === 'Pending';
        });
    });


    srv.after('READ', 'MyLeaveRequests', (results, req) => {
        const entries = Array.isArray(results) ? results : [results];
        entries.forEach(row => {
            row.isPending = row.status.code === 'Pending' || row.status.code === 'Approved';
        });
    });

    // CREATE handler for LeaveRequests
    srv.on('CREATE', 'LeaveRequests', async (req) => {
        console.log("CREATE LeaveRequest is being called");
        console.log("Request data:", req.data);
        try{
        if (!req.data) {
            return req.reject(400, "No leave request data provided");
        }

        const {ID, type_code, startDate, endDate, reason } = req.data; //ID is generated as soon as the before handler is called and it is then added to the req.data, so we need to pass it in the entries which will be inserted into the database
        const employee_ID = req.user.id;
        console.log("Req.user.id is:", employee_ID);
        console.log("Req.user.role is:", req.user.role);
        console.log("Req.user.email is:", req.user.email);
        console.log("Req.user.attr.email is:", req.user.attr.email);
        console.log("Req.user.name is:", req.user.name);          // Full display name
        console.log("Req.user.locale is:", req.user.locale);        // User's preferred locale
        console.log("Req.user.scopes is:", req.user.scopes);        // List of user scopes/roles

        if (!type_code || !startDate || !endDate || !reason) {
            return req.reject(400, "Missing required fields: type_code, startDate, endDate, and reason are required");
        }

        const tx = cds.transaction(req);

        //try {
            // Get current leave balance
            const currLeaveBalance = await tx.run(
                SELECT.one.from(LeaveBalance)
                    .where({ 
                        employee_ID: employee_ID, 
                        type_code: type_code 
                    })
            );

            if (!currLeaveBalance) {
                return req.reject(400, "Leave balance not found for this leave type");
            }

            // Get employee's manager ID
            const employee = await tx.run(
                SELECT.one.from(Employee)
                    .where({ ID: employee_ID })
            );

            if (!employee || !employee.manager_ID) {
                return req.reject(400, "Employee's manager not found");
            }

            // Calculate working days
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            const allDays = eachDayOfInterval({ start, end });
            const workingDays = allDays.filter(date => !isWeekend(date)).length;

            if (currLeaveBalance.balance < workingDays) {
                return req.error(400, "You don't have enough leave balance to request this leave");
            }
            const status_code = 'Pending';
            // Create the leave request
            const result = await tx.run(
                INSERT.into(LeaveRequest).entries({
                    ID,
                    type_code,
                    startDate,
                    endDate,
                    reason,
                    employee_ID,
                    status_code,
                    approver_ID: employee.manager_ID,
                    numberOfDays: workingDays
                })
            );

            // Update leave balance
            await tx.run(
                UPDATE.entity(LeaveBalance)
                    .with({ balance: currLeaveBalance.balance - workingDays })
                    .where({ ID: currLeaveBalance.ID })
            );

            // Return only the necessary fields to avoid circular references
            return {
                ID: ID,
                startDate: startDate,
                endDate: endDate,
                type_code: type_code,
                reason: reason,
                status_code: status_code,
                employee_ID: employee_ID,
                approver_ID: employee.manager_ID,
                numberOfDays: workingDays
            };

        } catch (error) {
            console.error("Error creating leave request:", error);
            return req.reject(400, "Error creating leave request: " + error.message);
        }
    });

    // Cancel action
    srv.on('cancelRequest','LeaveRequests', async (req) => {
        const ID = req.params[0];
        console.log("Reached cancel request back end");
        
        try {
            const tx = cds.transaction(req);

            // Get the leave request details
            const leaveRequest = await tx.run(
                SELECT.one.from(LeaveRequest).where({ ID: ID })
            );

            if (!leaveRequest) {
                return req.error(404, "Leave request not found");
            }

            // Check if the user is the one who created the request
            if (leaveRequest.employee_ID !== req.user.id) {
                return req.error(403, "You can only cancel your own leave requests");
            }

            // Check if the leave request is in 'Pending' status
            if (leaveRequest.status_code !== 'Pending' && leaveRequest.status_code !== 'Approved') {
                return req.error(400, "Only pending/approved leave requests can be cancelled");
            }
            // Get current leave balance
            const leaveBalance = await tx.run(
                SELECT.one.from(LeaveBalance)
                    .where({ 
                        employee_ID: req.user.id, 
                        type_code: leaveRequest.type_code 
                    })
            );

            if (leaveBalance) {
                // Restore the leave balance
                await tx.run(
                    UPDATE.entity(LeaveBalance)
                        .with({ balance: leaveBalance.balance + leaveRequest.numberOfDays })
                        .where({ ID: leaveBalance.ID })
                );
            }

            await tx.run(
                UPDATE.entity(LeaveRequest).with({status_code: 'Cancelled'}).where({ID: ID})
            );

            return { message: 'Leave request cancelled successfully' };
        } catch (error) {
            console.error("Error cancelling leave request:", error);
            return req.error(500, "Error cancelling leave request: " + error.message);
        }
    });

    // Add logging to LeaveBalances READ
    // srv.on('READ', 'LeaveBalances', async (req) => {
    //     console.log('Reading LeaveBalances');
    //     console.log('User context:', req.user);
    //     const tx = cds.transaction(req);
    //     const results = await tx.run(
    //         SELECT.from(LeaveBalance)
    //             .where({ employee_ID: req.user.id })
    //     );
    //     console.log('LeaveBalances results:', results);
    //     return results;
    // });
}
    
