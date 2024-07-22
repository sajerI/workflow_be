const cds = require("@sap/cds");
const impl = require("./common");
const server = require("./server");
const auth = require("./auth");

module.exports = cds.service.impl(async function() {
    const axios = server.axios;
    this.on("READ", "LegalEntity", async request => {
        return impl.readLegalEntityList(axios, request);
    });  
    this.on("READ", "Users", async request => {
        return impl.readUsersList(axios, request);
    }); 

    this.on("READ", "Languages", async request => {
        return impl.readLanguages(axios, request);
    }); 

    this.on("READ", "Countries", async request => {
        return impl.readCountries(axios, request);
    }); 

    this.on("READ", "Roles", async request => {
        const userAccount = await auth.loadUserAccount(axios, request);
        return userAccount.user;
    });

    this.on("sendEmail", ({data:{to,emailId,userId,seqNumber,itemName}}) => {
        return impl.sendEmail(to,emailId,userId,seqNumber,itemName,axios);
    })

    this.on("sendRemindersToApprovers", async (request)   => {
        return impl.sendRemindersToApprovers(request);
    })

    this.on("sendRemindersToHRadmin", async (request) => {
        return impl.sendRemindersToHRadmin(request)
    })

    this.on("READ","Export", async (request,res) => {
        console.log("exportAll")
        return impl.exportAllItems(request,res)
        //console.log(res)
    })

});
