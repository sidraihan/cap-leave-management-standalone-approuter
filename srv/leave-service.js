const cds = require('@sap/cds')
console.log("File is leaded")
module.exports = async function (srv){
    const {LeaveRequest} = srv.entities;

    //Approve action
    srv.on('approveRequest', async (req) => {
        const {ID} = req.params[0];
        const user = req.user;

        if(!user.is('Manager') && !user.is('Admin')){
            return req.error(403, 'Only Managers or Admin can approve requests.')
        }

        await UPDATE(LeaveRequest)
        .set({status: 'Approved', approver_ID: user.id})
        .where({ ID });

        return {message: 'Leave Request Approved'}

    });

    // Reject action
    srv.on('rejectRequest', async (req) => {
        const { ID } = req.params[0];
        const user = req.user;

        if (!user.is('Manager') && !user.is('Admin')) {
        return req.error(403, 'Only Managers or Admins can reject leave requests.');
        }

        await UPDATE(LeaveRequest)
        .set({ status: 'Rejected', approver_ID: user.id })
        .where({ ID });

        return { message: 'Leave request rejected.' };
    });

    srv.on('READ', 'LeaveRequests',async (req) => {
        console.log('Logged in as:', req.user.id);
        console.log('Roles:', req.user.roles);
        const tx = cds.transaction(req);
        const results = await tx.run(req.query)
        return results;
        //next();
      });
      
}
    
