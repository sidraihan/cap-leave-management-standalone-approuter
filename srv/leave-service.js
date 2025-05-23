const cds = require('@sap/cds')
console.log("File is leaded")
module.exports = async function (srv){
    const {LeaveRequest,Employee} = cds.entities;

    srv.on('READ', 'ApprovalLeaveRequests',async (req) => {
        console.log("ApprovalLeaveRequests is being called")
        console.log("User ID is:"+req.user.id)
        const tx = cds.transaction(req);
        const results = await tx.run(SELECT.from(LeaveRequest).columns(r=>{r`.*`,r.employee(asi=>{asi`.*`}),r.type(asi=>{asi`.*`}),r.status(asi=>{asi`.*`}) } ).where({ approver_ID: req.user.id })); // This basically means that extract all rows from LeaveRequest table, but also extract all rows from employee,status and type tables(associations).
        //const results = await tx.run(SELECT.from(LeaveRequest).where({ approver_ID: req.user.id }));
        return results;
    });
    //Approve action
    srv.on('approveRequest', 'LeaveRequests',async (req) => {
        const ID = req.params[0];
        const {approver_ID} = await SELECT.one.from(LeaveRequest).where({ID: ID});
        console.log("Approver is:" +approver_ID)
        console.log("ID from req is:"+ID);
        const user = req.user;
        console.log(user);

        // if(!user.is('Manager') && !user.is('Admin')){
        //     return req.error({ code: "403", message: "Custom error message for this case." });
        // }
        if(!(approver_ID == req.user.id)){
            return req.error(403, "Broski, you're not the leave applier's manager, what the hell are you doing?")
        }

        await UPDATE.entity(LeaveRequest)
        .with({status_code: 'Approved'})
        .where({ ID: ID });

        return {message: 'Leave Request Approved'}

    });

    // Reject action
    srv.on('rejectRequest', async (req) => {
        const ID  = req.params[0];
        const {approver_ID} = await SELECT.one.from(LeaveRequest).where({ID: ID});
        const user = req.user;

        // if (!user.is('Manager') && !user.is('Admin')) {
        // return req.error(403, 'Only Managers or Admins can reject leave requests.');
        // }

        if(!(approver_ID == req.user.id)){
            return req.error(403, "Broski, you're not the leave applier's manager, what the hell are you doing?")
        }

        await UPDATE.entity(LeaveRequest)
        .with({status_code: 'Rejected'})
        .where({ ID: ID });

        return { message: 'Leave request rejected.' };
    });

    srv.on('READ', 'LeaveRequests',async (req) => {
        console.log('Logged in as:', req.user.id);
        console.log('Roles:', req.user.roles);
        const tx = cds.transaction(req);
        const results = await tx.run(SELECT.from(LeaveRequest).columns(r=>{r`.*`,r.employee(asi=>{asi`.*`}),r.type(asi=>{asi`.*`}),r.status(asi=>{asi`.*`}) } ).where({ createdBy: req.user.id }))
        return results;
        //next();
      });

      srv.after('READ', 'LeaveRequests', (each) => {
        const entries = Array.isArray(each) ? each : [each];
        for (let row of entries) {
            row.isPending = row.status_code === 'Pending';
        }
    });

    srv.after('READ', 'ApprovalLeaveRequests', (each) => {
        const entries = Array.isArray(each) ? each : [each];
        for (let row of entries) {
            row.isPending = row.status_code === 'Pending';
        }
    });

    srv.on('createLeave', async (req) => {
        console.log("createLeave is being called");
        // console.log("Raw request:", {
        //     query: req.query,
        //     data: req.data,
        //     params: req.params,
        //     body: req._.req.body
        // });
        console.log("Request body:", req.data);

        if (!req.data) {
            return req.error(400, "No leave request data provided");
        }

        const employee_ID = req.user.id;
        const { type_code, startDate, endDate, reason } = req.data;
        
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

            // Create the leave request
            await tx.run(
                INSERT.into(LeaveRequest).entries({
                    employee_ID,
                    type_code,
                    startDate,
                    endDate,
                    reason,
                    status_code,
                    approver_ID: employee.manager_ID
                })
            );

            return true;
        } catch (error) {
            console.error("Error creating leave request:", error);
            return req.error(500, "Error creating leave request: " + error.message);
        }
    });
      
}
    
