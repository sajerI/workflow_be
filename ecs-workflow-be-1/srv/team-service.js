const cds = require("@sap/cds");
const auth = require("./auth");
const impl = require("./team");
const server = require("./server");

module.exports = cds.service.impl(async function() {
    const axios = server.axios;

    this.before("READ", request => {
        if (request.entity.includes("Employment")) return;
        if (!auth.validateUserId(request.user.id, request.params[0].userId)) {
            request.reject(401, "Unauthorized");
        }
    });

    this.on("READ", "Employment", async request => {
        return await impl.readEmployment(axios, request);
    });

    this.on("READ", "Manager", async request => {
        return await impl.readManager(axios, request, 0);
    });

    this.on("READ", "TeamAverage", async request => {
        const manager = await impl.readManager(axios, request, 1);
        return manager.teamAverages;
    });

    this.on("READ", "TeamStructure", async request => {
        const manager = await impl.readManager(axios, request, 2);
        return manager.teamStructures;
    });

    this.on("READ", "TeamPerformance", async request => {
        const manager = await impl.readManager(axios, request, 3);
        return manager.teamPerformances;
    });

    this.on("READ", "TeamPayComponent", async request => {
        const manager = await impl.readManager(axios, request, 4);
        return manager.teamPayComponents;
    });

    this.on("READ", "TeamPayComponentDetail", async request => {
        const manager = await impl.readManager(axios, request, 5);
        return manager.teamPayComponentsDetail;
    });

    this.on("READ", "TeamPayComponentSum", async request => {
        const manager = await impl.readManager(axios, request, 6);
        return manager.teamPayComponentsSum;
    });

    this.on("READ", "UserPayComponent", async request => {
        const manager = await impl.readManager(axios, request, 7);
        return manager.userPayComponents;
    });

    this.on("READ", "TeamGrade", async request => {
        const manager = await impl.readManager(axios, request, 8);
        return manager.teamGrades;
    });

    this.on("READ", "TeamCategory", async request => {
        const manager = await impl.readManager(axios, request, 9);
        return manager.teamCategories;
    });

    this.on("READ", "TeamJob", async request => {
        const manager = await impl.readManager(axios, request, 10);
        return manager.teamJobs;
    });

    this.on("READ", "TeamAgeGroup", async request => {
        const manager = await impl.readManager(axios, request, 11);
        return manager.teamAgeGroups;
    });

    this.on("READ", "GradeGenderDeviation", async request => {
        const manager = await impl.readManager(axios, request, 12);
        return manager.gradeGenderDeviations;
    });

    this.on("READ", "GradeGenderDeviationDetails", async request => {
        const manager = await impl.readManager(axios, request, 13);
        return manager.gradeGenderDeviations;
    });

    this.on("READ", "GradeAverageDeviation", async request => {
        const manager = await impl.readManager(axios, request, 14);
        return manager.gradeAverageDeviations;
    });

    this.on("READ", "SalaryRangePenetration", async request => {
        const manager = await impl.readManager(axios, request, 15);
        return manager.salaryRangePenetrations;
    });

    this.on("READ", "PerformanceHeatMap", async request => {
        const manager = await impl.readManager(axios, request, 16);
        return manager.performanceHeatMap;
    });

    this.on("READ", "PerformanceHeatMapEmployee", async request => {
        const manager = await impl.readManager(axios, request, 17);
        return manager.performanceHeatMap;
    });

    this.on("READ", "TeamStructureByCareerTeam", async request => {
        const manager = await impl.readManager(axios, request, 18);
        return manager.teamStructuresByCareerTeam;
    });

    this.on("READ", "PerformanceCount", async request => {
        const manager = await impl.readManager(axios, request, 19);
        return manager.performanceCounts;
    });

    this.on("READ", "PerformanceSalaryIncrease", async request => {
        const manager = await impl.readManager(axios, request, 20);
        return manager.performanceSalaryIncreases;
    });
});
