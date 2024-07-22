const cds = require("@sap/cds");
const impl = require("./appadmin");
const server = require("./server");
//const { request } = require("express");
const auth = require("./auth");

module.exports = cds.service.impl(async function () {

    
    this.before("CREATE", async request => {
        if (!auth.validateAdmin(request.user.id) && !auth.validatePwCAdmin(request.user.id)) {
            request.reject(401, "Unauthorized");
        }
    });

    this.before("READ", async request => {
        if (!auth.validateAdmin(request.user.id) && !auth.validatePwCAdmin(request.user.id)
        && !auth.validateHRadmin(request.user.id)) {
            request.reject(401, "Unauthorized");
        }
    });

    this.before("DELETE", async request => {
        if (!auth.validateAdmin(request.user.id) && !auth.validatePwCAdmin(request.user.id)) {
            request.reject(401, "Unauthorized");
        }
    });
    
    this.before("UPDATE", "Rules", async request => {
        if (!auth.validateAdmin(request.user.id) && !auth.validatePwCAdmin(request.user.id)) {
            request.reject(401, "Unauthorized");
        }
        console.log("rueles update");
        await impl.checkExistenceOfEntity(request); //Verify that newly added enity is not already used in other rule
    });



});