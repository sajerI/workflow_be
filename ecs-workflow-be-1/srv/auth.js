module.exports = {
    
    userAccount: {},

    loadUserAccount: async (axios, request) => {
        const searchUrl = "/UserAccount?$select=personIdExternal,username,email,defaultLocale";
        const email = request.user.id
        //["ivo.sajer@pwc.com", "david.urbanek@pwc.com"].includes(request.user.id) ? "ivo.sajer@pwc.com" : request.user.id; // XXX: temporary override
        const userAccountsResponse = await axios.get(searchUrl);
        let username,personIdExternal,defaultLocale
        const userAccounts = userAccountsResponse.data.filter(userAccount => userAccount.email == email);
        /* START Temporary solution only for testing */
        const aPWManager = userAccounts.find((account) => account.personIdExternal === '10000545' )
        console.log(aPWManager)
        if (aPWManager) {
            username = aPWManager.username;
            personIdExternal = aPWManager.personIdExternal;
            defaultLocale = aPWManager.defaultLocale
        /* END Temporary solution only for testing */
        } else {
            username = userAccounts.length > 0 ? userAccounts[0].username : null;
            personIdExternal = userAccounts.length > 0 ? userAccounts[0].personIdExternal : null;
            defaultLocale = userAccounts.length > 0 ? userAccounts[0].defaultLocale : "en_US";    
        }
  
        if (request.user._is_anonymous) personIdExternal = 'Anonymous'
        if (username) {
            module.exports.userAccount[email] = {
                user: [
                    {
                        pwcAdmin: request.user.is("PwCAdminWF"), // PwCAdminWF
                        //pwcAdmin: request.user.is("Admin"),
                        appAdmin: request.user.is("AppAdminWF"),//false,
                        adminHR: request.user.is("HRAdminWF"),
                        approver: request.user.is("ApproverWF"),
                        email:email,
                        username: username,
                        userId: personIdExternal,
                        lang: defaultLocale
                    }
                ],
                email:email
            };
            return module.exports.userAccount[email];
        }
        
        module.exports.userAccount[email] = {}
        module.exports.userAccount[email].email = email
        module.exports.userAccount[email].user = module.exports.userAccount[email].user.map(user => {
            user.pwcAdmin = request.user.is("PwCAdminWF"),
            user.appAdmin = request.user.is("AppAdminWF"),//false,
            user.adminHR = request.user.is("HRAdminWF"),
            user.approver = request.user.is("ApproverWF"),
            user.email = email,
            user.username = username
            user.userId = personIdExternal,
            user.lang = defaultLocale
            return user;
        });

        return module.exports.userAccount[email];
    },

    getUserAccount: (email) => {
        return module.exports.userAccount[email];
    },

    validatePwCAdmin: (email) => {
        return module.exports._validateRole(email, null, "pwcAdmin");
    },

    validateAdmin: (email) => {
        return module.exports._validateRole(email, null, "appAdmin");
    },

    validateHRadmin: (email) => {
        return module.exports._validateRole(email, null, "adminHR");
    },

    validateApprover: (email, userId) => {
        return module.exports._validateRole(email, null, "approver");
    },

    _validateRole: (email, userId, role) => {
        var account = module.exports.getUserAccount(email)
        //if (!(email in module.exports.userAccount) || module.exports.userAccount[email].user.email != email) return false;
        if (!(email in module.exports.userAccount) || module.exports.userAccount[email].email != email) return false;
        /*
        const aValidEmployments = userId
            ? module.exports.userAccount[email].user.filter(employment => employment.userId == userId)
            : module.exports.userAccount[email].user.filter(employment => employment[role]);
            */

        const aValidEmployments =  module.exports.userAccount[email].user.filter(employment => employment[role]);   
        return (aValidEmployments.length > 0 ? aValidEmployments[0][role] : false);
    },

    validateUserId: (email, userId) => {
        if (!(email in module.exports.userAccount) || module.exports.userAccount[email].user.email != email) return false;
        return module.exports.userAccount[email].user.filter(user => user.userId == userId).length > 0;
    },
    
};