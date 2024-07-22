const cds = require("@sap/cds");
const auth = require("./auth");
const impl = require("./person");
const server = require("./server");
const utils = require("./utils");

module.exports = cds.service.impl(async function() {
    const axios = server.axios;

    this.on("READ", "Employment", async request => {
        const userAccount = await auth.loadUserAccount(axios, request);
        return userAccount.user;
    });

    this.before("READ", request => {
        if (request.entity.includes("Employment")) return;
        if (request.entity.includes("TeamMember")) return;
        const email = request.user.id;
        const userId = request.params[0].userId;
        if (!auth.validateUserId(email, userId) && !auth.validateManagerId(email, userId)) {
            request.reject(401, "Unauthorized");
        }
    });

    this.on("READ", "Person", async request => {
        return await impl.readPerson(axios, request, true);
    });

    this.on("READ", "EmployeeOverview", async request => {
        const user = await impl.readPerson(axios, request, false);
        return user.employeeOverview;
    });

    this.on("READ", "EmployeeAverage", async request => {
        const user = await impl.readPerson(axios, request, false);
        return user.employeeAverage;
    });

    this.on("READ", "PayComponent", async request => {
        const user = await impl.readPerson(axios, request, false);
        return user.payComponents;
    });

    this.on("READ", "PayComponentSum", async request => {
        const user = await impl.readPerson(axios, request, false);
        return user.payComponentSum;
    });

    this.on("READ", "DeferralBonus", async request => {
        return []; // TODO: impl.
    });

    this.on("READ", "TeamAverage", async request => {
        const employee = await impl.readPerson(axios, request, true);
        return employee.teamAverages;
    });

    this.on("READ", "TeamStructure", async request => {
        const employee = await impl.readPerson(axios, request, true);
        return employee.teamStructures;
    });

    this.on("READ", "TeamPerformance", async request => {
        const employee = await impl.readPerson(axios, request, true);
        return employee.teamPerformances;
    });

    this.on("READ", "TeamMember", async request => {
        const filters = request.query.SELECT.where ? utils.parseFilters(request.query.SELECT.where) : {};

        const managerId = filters.managerId;
        const year = filters.year;
        const entireYear = filters.entireYear;

        if (!auth.validateUserId(request.user.id, managerId)) {
            request.reject(401, "Unauthorized");
        } else return impl.readTeamMember(axios, request, managerId, year, entireYear);
    });
});