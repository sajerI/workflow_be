const cds = require("@sap/cds");
const impl = require("./employee");
const server = require("./server");
const auth = require("./auth");

module.exports = cds.service.impl(async function() {
    const axios =server.axios

    this.before("READ", request => {
        if (request.entity.includes("ApproverItemsView")) return;
        if (request.entity.includes("EmployeesHistory")) return;
        if (!auth.validateHRadmin(request.user.id)) {
            request.reject(401, "Unauthorized access");
        }
    });

    this.before("READ","EmployeesHistory", request => {
        if (!auth.validateHRadmin(request.user.id) && !auth.validateApprover(request.user.id) ) {
            request.reject(401, "Unauthorized");
        }
    });

    this.before("READ","ApproverItemsView", request => {
        if (!auth.validateApprover(request.user.id) ) {
            request.reject(401, "Unauthorized");
        }
    });
    

    this.on("READ","ApproverItemsView", async request => {
        return impl.getEmployeesForApprover(axios,request);
    });

    this.on("fetchNewHired", ({data:{userId}}) => {
        return impl.fetchNewHired(axios, userId);
    })
    
    this.after("UPDATE","EmpOverview",async request => {
        return impl.checkHRadminStaus(axios,request);
    })
});