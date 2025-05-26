const cds = require('@sap/cds');
const { parseISO, eachDayOfInterval, isWeekend } = require('date-fns');
const { SELECT, INSERT, UPDATE, DELETE } = require('@sap/cds/lib/ql/cds-ql');
console.log("File is leaded")
module.exports = async function (srv){
    const {LeaveRequest,Employee,LeaveBalance} = cds.entities;

    //Approve action
    srv.on('approveRequest', 'LeaveRequests',async (req) => {
        const ID = req.params[0];
        const {approver_ID} = await SELECT.one.from(LeaveRequest).where({ID: ID});
        //console.log("Approver is:" +approver_ID)
        //console.log("ID from req is:"+ID);
        const user = req.user;
        //console.log(user);

        if(!(approver_ID == req.user.id) && req.user.id !== 'admin'){
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

        if(!(approver_ID == req.user.id) && req.user.id !== 'admin'){
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
        // Let CAP handle the query including pagination
        const tx = cds.transaction(req);
        
        if (req.user.id === 'admin') {
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
        
        if (req.user.id === 'admin') {
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
            row.isPending = row.status_code === 'Pending';
        });
    });

    srv.after('READ', 'MyLeaveRequests', (results, req) => {
        const entries = Array.isArray(results) ? results : [results];
        entries.forEach(row => {
            row.isPending = row.status_code === 'Pending' || row.status_code === 'Approved';
        });
    });

    srv.on('createLeave', async (req) => {
        console.log("createLeave is being called");
        //console.log("Request body:", req.data);

        if (!req.data) {
            return req.error(400, "No leave request data provided");
        }

        const employee_ID = req.user.id;
        const { type_code, startDate, endDate, reason } = req.data;

        const currLeaveBalance = await SELECT.one.from(LeaveBalance).where({employee_ID: employee_ID, type_code: type_code})
        
        if (!type_code || !startDate || !endDate || !reason) {
            return req.error(400, "Missing required fields: type_code, startDate, endDate, and reason are required");
        }

        const status_code = 'Pending';

        try {
            const tx = cds.transaction(req);

            // Get employee's manager ID
            const employee = await tx.run(
                SELECT.one.from(Employee).where({ ID: employee_ID })
            );

            if (!employee || !employee.manager_ID) {
                return req.error(400, "Employee's manager not found");
            }
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            const allDays = eachDayOfInterval({ start, end }); // This will return an array of all the days between leave start and leave end dates
            const workingDays = allDays.filter(date => !isWeekend(date)).length; // This will return the number of working days between leave start and leave end date

            // Create the leave request
            await tx.run(
                INSERT.into(LeaveRequest).entries({
                    employee_ID,
                    type_code,
                    startDate,
                    endDate,
                    reason,
                    status_code,
                    approver_ID: employee.manager_ID,
                    numberOfDays: workingDays
                })
            );

            

            if(currLeaveBalance.balance < workingDays){
                return req.error(400, "You don't have enough leave balance to request this leave");
            }

            if(currLeaveBalance){
                await tx.run(
                    UPDATE.entity(LeaveBalance)
                    .with({balance: currLeaveBalance.balance - workingDays})
                    .where({ID: currLeaveBalance.ID})
                )
            }

            return true;
        } 
        catch (error) {
            console.error("Error creating leave request:", error);
            return req.error(500, "Error creating leave request: " + error.message);
        }
    });

    srv.on('READ','LeaveBalances', async (req) =>{
        const tx = cds.transaction(req);
        const results = await tx.run(SELECT.from(LeaveBalance).columns(r=>{r`.*`,r.type(asi=>{asi`.*`})}).where({employee_ID: req.user.id}))
        return results;
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

            // Calculate working days to restore to leave balance
            // const start = parseISO(leaveRequest.startDate);
            // const end = parseISO(leaveRequest.endDate);
            // const allDays = eachDayOfInterval({ start, end });
            // const workingDays = allDays.filter(date => !isWeekend(date)).length;

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
}
    
