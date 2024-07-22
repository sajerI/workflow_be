const cds = require("@sap/cds");
const auth = require("./auth");

module.exports = cds.service.impl(async function() {
    this.before("READ", request => {
        /*
        if (!auth.validateHRadmin(request.user.id) || !auth.validateAdmin(request.user.id)  ) {
            request.reject(401, "Unauthorized");
        }
        */
    });

    this.before("UPDATE", async request => {

        //console.log("REQ", JSON.stringify(request));
        //console.log("REQP", JSON.stringify(request.params));
    });

    this.before("DELETE", async request => {

    });

});