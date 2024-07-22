const auth = require("./auth");
const server = require("./server");
const utils = require("./utils");

const fnNavProp = server.fnNavProp;
const fnProp = server.fnProp;

module.exports = {
    manager: {},
    convert: {},
    payCompsByGroup: {},
    salaryAveragesByGrade: {},
    formHeaders: {},
    teamPerformances: [],

    readEmployment: async (axios, request) => {
        const { userId, year, target, currency, entireYear, payComponentGroup } = request.params[0];
        const locale = utils.getSFLanguage(request.locale);
        const keyYear = new Date().getFullYear();
        const entireYearTF = (keyYear != year || entireYear.toString() == "true");
        const fromDate = year + "-01-01";
        const toDate = entireYearTF ? (year + "-12-31") : utils.formatDate(new Date());

        if (!auth.validateManager(request.user.id, userId)) {
            return request.params[0];
        }

        module.exports.manager[userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale]
            = await getUser(axios, request, userId, year, target, fromDate, toDate, locale);

        module.exports.manager[userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale].directReports
            = module.exports.manager[userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale].directReports.filter((user) => {
                if (user.empInfo && user.empInfo.jobInfoNav) {
                    const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
                    const emplStatus = (jobInfo && jobInfo.emplStatusNav) ? jobInfo.emplStatusNav.externalCode : null;
                    return emplStatus == "A";
                }
                return false;
            });

        module.exports.formHeaders = await utils.getFormHeadersAll(axios, request, module.exports.manager[userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale].directReports)

        const exchangeRates = await utils.getCurrencyExchangeRates(axios, request, year);
        module.exports.convert[year] = utils.getCurrencyConverter(currency, exchangeRates);

        module.exports.payCompsByGroup[toDate] = await utils.getPayComponentsByGroup(axios, request, toDate);
        module.exports.salaryAveragesByGrade[toDate + "|" + year + "|" + entireYearTF + "|" + payComponentGroup]
            = await utils.getSalaryAveragesByGrade(axios, request, toDate, year, entireYearTF, module.exports.payCompsByGroup[toDate], payComponentGroup, module.exports.convert[year]);
        module.exports.teamPerformances = await utils.getTeamPerformances(
            module.exports.manager[userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale],
            axios, request, year, toDate, module.exports.payCompsByGroup[toDate], payComponentGroup,
            module.exports.convert[year], locale, module.exports.formHeaders);

        return request.params[0];
    },

    readManager: async (axios, request, iFlag) => {
        const { userId, year, target, currency, entireYear, payComponentGroup } = request.params[0];
        const locale = utils.getSFLanguage(request.locale);
        const fkMapper = utils.fkMapper("manager", request.params[0]);
        const keyYear = new Date().getFullYear();
        const entireYearTF = (keyYear != year || entireYear.toString() == "true");
        const fromDate = year + "-01-01";
        const toDate = entireYearTF ? (year + "-12-31") : utils.formatDate(new Date());

        if (!auth.validateManager(request.user.id, userId)) {
            return request.params[0];
        }

        let manager = module.exports.manager[userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale];
        let convert = module.exports.convert[year];
        let payCompsByGroup = module.exports.payCompsByGroup[toDate];
        let salaryAveragesByGrade = module.exports.salaryAveragesByGrade[toDate + "|" + year + "|" + entireYearTF + "|" + payComponentGroup];

        if (iFlag == 0 || iFlag == 1) manager.teamAverages = utils.getTeamAverages(manager, toDate);
        if (iFlag == 0 || iFlag == 2) manager.teamStructures = utils.getTeamStructures(manager, toDate, locale);
        if (iFlag == 0 || iFlag == 3) manager.teamPerformances = module.exports.teamPerformances;
        if (iFlag == 0 || iFlag == 4) manager.teamPayComponents = getTeamPayComponents(manager, year, entireYearTF, target, convert, locale);
        if (iFlag == 0 || iFlag == 5) manager.teamPayComponentsDetail = getTeamPayComponentsDetail(request.query.SELECT, manager, year, entireYearTF, target, convert, locale);
        if (iFlag == 0 || iFlag == 6) manager.teamPayComponentsSum = getTeamPayComponentsSum(manager, year, entireYearTF, target, convert, locale);
        if (iFlag == 0 || iFlag == 7) manager.userPayComponents = getUserPayComponents(request.query.SELECT, manager, year, entireYearTF, target, convert, locale);
        if (iFlag == 0 || iFlag == 8) manager.teamGrades = getTeamGrades(manager, toDate);
        if (iFlag == 0 || iFlag == 9) manager.teamCategories = getTeamCategories(manager, toDate);
        if (iFlag == 0 || iFlag == 10) manager.teamJobs = getTeamJobs(manager, toDate);
        if (iFlag == 0 || iFlag == 11) manager.teamAgeGroups = getTeamAgeGroups(manager);
        if (iFlag == 0 || iFlag == 12) manager.gradeGenderDeviations = getGradeGenderDeviations(request.query.SELECT, manager, year, entireYearTF, toDate, convert, payCompsByGroup, payComponentGroup, locale);
        if (iFlag == 0 || iFlag == 13) manager.gradeGenderDeviations = getGradeGenderDeviations(request.query.SELECT, manager, year, entireYearTF, toDate, convert, payCompsByGroup, payComponentGroup, locale);
        if (iFlag == 0 || iFlag == 14) manager.gradeAverageDeviations = getGradeAverageDeviations(manager, year, entireYearTF, toDate, payCompsByGroup, payComponentGroup, salaryAveragesByGrade, convert, locale);
        if (iFlag == 0 || iFlag == 15) manager.salaryRangePenetrations = getSalaryRangePenetrations(manager, toDate);
        if (iFlag == 0 || iFlag == 16) manager.performanceHeatMap = getPerformanceHeatMap(manager, year, toDate, axios, request);
        if (iFlag == 0 || iFlag == 17) manager.performanceHeatMap = getPerformanceHeatMap(manager, year, toDate, axios, request);
        if (iFlag == 0 || iFlag == 18) manager.teamStructuresByCareerTeam = getTeamStructuresByCareerTeam(request.query.SELECT.where, manager, toDate, locale);
        if (iFlag == 0 || iFlag == 19) manager.performanceCounts = getPerformanceCounts(manager, year, axios, request);
        if (iFlag == 0 || iFlag == 20) manager.performanceSalaryIncreases = getPerformanceSalaryIncreases(manager, year, axios, request);

        manager.year = year;
        manager.target = target;
        manager.currency = currency;
        manager.entireYear = entireYear;
        manager.payComponentGroup = payComponentGroup;

        if (manager.teamAverages) manager.teamAverages = manager.teamAverages.map(fkMapper)
        if (manager.teamStructures) manager.teamStructures = manager.teamStructures.map(fkMapper)
        if (manager.teamPerformances) manager.teamPerformances = manager.teamPerformances.map(fkMapper)
        if (manager.teamPayComponents) manager.teamPayComponents = manager.teamPayComponents.map(fkMapper)
        if (manager.teamPayComponentsDetail) manager.teamPayComponentsDetail = manager.teamPayComponentsDetail.map(fkMapper)
        if (manager.teamPayComponentsSum) manager.teamPayComponentsSum = [manager.teamPayComponentsSum].map(fkMapper)[0]
        if (manager.userPayComponents) manager.userPayComponents = manager.userPayComponents.map(fkMapper)
        if (manager.teamGrades) manager.teamGrades = manager.teamGrades.map(fkMapper)
        if (manager.teamCategories) manager.teamCategories = manager.teamCategories.map(fkMapper)
        if (manager.teamJobs) manager.teamJobs = manager.teamJobs.map(fkMapper)
        if (manager.teamAgeGroups) manager.teamAgeGroups = manager.teamAgeGroups.map(fkMapper)
        if (manager.gradeAverageDeviations) manager.gradeAverageDeviations = manager.gradeAverageDeviations.map(fkMapper)
        if (manager.salaryRangePenetrations) manager.salaryRangePenetrations = manager.salaryRangePenetrations.map(fkMapper)
        if (manager.teamStructuresByCareerTeam) manager.teamStructuresByCareerTeam = manager.teamStructuresByCareerTeam.map(fkMapper)
        if (manager.performanceCounts) manager.performanceCounts = manager.performanceCounts.map(fkMapper)
        if (manager.performanceSalaryIncreases) manager.performanceSalaryIncreases = manager.performanceSalaryIncreases.map(fkMapper)

        if (manager.performanceHeatMap) manager.performanceHeatMap = manager.performanceHeatMap.map(fkMapper).map(oRecord => {
            const oKeys = {
                compaRatioRange: oRecord.compaRatioRange,
                rating: oRecord.rating
            };
            oRecord.employees = oRecord.employees.map(utils.fkMapper("performanceHeatMap", oKeys)).map(utils.fkMapper("performanceHeatMap_manager", request.params[0]));
            return oRecord;
        })
        if (manager.gradeGenderDeviations) manager.gradeGenderDeviations = manager.gradeGenderDeviations.map(fkMapper).map(oRecord => {
            const oKeys = {
                selectedDimension: oRecord.selectedDimension,
                dimension: oRecord.dimension,
                gender: oRecord.gender
            };
            oRecord.details = [oRecord.details].map(utils.fkMapper("gradeGenderDeviation", oKeys)).map(utils.fkMapper("gradeGenderDeviation_manager", request.params[0]))[0];
            return oRecord;
        })

        return manager;
    }
};

async function getUser(axios, request, userId, year, target, fromDate, toDate, locale) {
    const userExpands = [
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/frequencyCodeNav",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav",
        "personKeyNav",
        "directReports/empInfo/compInfoNav/empCompensationCalculatedNav",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/frequencyCodeNav",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav",
        fnNavProp ? "directReports/empInfo/jobInfoNav/" + fnNavProp : null,
        "directReports/empInfo/jobInfoNav/customString16Nav/picklistLabels",
        "directReports/empInfo/jobInfoNav/emplStatusNav",
        "directReports/empInfo/jobInfoNav/jobCodeNav",
        "directReports/empInfo/jobInfoNav/positionNav",
        "directReports/empInfo/personNav/personalInfoNav",
        "directReports/personKeyNav"
    ].filter(expand => expand !== null).join(",");
    const userSelects = [
        "directReports/empInfo/compInfoNav/empCompensationCalculatedNav/compaRatio",
        "directReports/empInfo/compInfoNav/empCompensationCalculatedNav/rangePenetration",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/calculatedAmount",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/currencyCode",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponent",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_" + locale,
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_en_US",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/externalCode",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav/annualizationFactor",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_" + locale,
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_en_US",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/payComponentType",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/target",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/seqNumber",
        "directReports/empInfo/compInfoNav/endDate",
        "directReports/empInfo/compInfoNav/startDate",
        "directReports/empInfo/empPayCompNonRecurringNav/currencyCode",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCode",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav/value_" + locale,
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav/value_en_US",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav/value_" + locale,
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav/value_en_US",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/payComponentType",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/target",
        "directReports/empInfo/empPayCompNonRecurringNav/payDate",
        "directReports/empInfo/empPayCompNonRecurringNav/value",
        fnNavProp ? "directReports/empInfo/jobInfoNav/" + fnNavProp + "/name_" + locale : null,
        fnNavProp ? "directReports/empInfo/jobInfoNav/" + fnNavProp + "/name_en_US" : null,
        "directReports/empInfo/jobInfoNav/customString16Nav/picklistLabels/label",
        "directReports/empInfo/jobInfoNav/customString16Nav/picklistLabels/locale",
        "directReports/empInfo/jobInfoNav/emplStatusNav/externalCode",
        "directReports/empInfo/jobInfoNav/endDate",
        "directReports/empInfo/jobInfoNav/fte",
        "directReports/empInfo/jobInfoNav/jobCodeNav/name_" + locale,
        "directReports/empInfo/jobInfoNav/jobCodeNav/name_en_US",
        "directReports/empInfo/jobInfoNav/jobTitle",
        "directReports/empInfo/jobInfoNav/payGrade",
        "directReports/empInfo/jobInfoNav/positionNav/cust_jobCategory",
        "directReports/empInfo/jobInfoNav/seqNumber",
        "directReports/empInfo/jobInfoNav/startDate",
        "directReports/empInfo/personNav/dateOfBirth",
        "directReports/empInfo/personNav/personalInfoNav/endDate",
        "directReports/empInfo/personNav/personalInfoNav/gender",
        "directReports/empInfo/personNav/personalInfoNav/startDate",
        "directReports/empInfo/startDate",
        "directReports/firstName",
        "directReports/lastName",
        "directReports/personKeyNav/personIdExternal",
        "directReports/userId",
        "empInfo/compInfoNav/empPayCompRecurringNav/calculatedAmount",
        "empInfo/compInfoNav/empPayCompRecurringNav/currencyCode",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponent",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_" + locale,
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_en_US",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/externalCode",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav/annualizationFactor",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_" + locale,
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_en_US",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/payComponentType",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/target",
        "empInfo/compInfoNav/empPayCompRecurringNav/seqNumber",
        "empInfo/compInfoNav/endDate",
        "empInfo/compInfoNav/startDate",
        "empInfo/empPayCompNonRecurringNav/currencyCode",
        "empInfo/empPayCompNonRecurringNav/payComponentCode",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav/value_" + locale,
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav/value_en_US",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav/value_" + locale,
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav/value_en_US",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/payComponentType",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/target",
        "empInfo/empPayCompNonRecurringNav/payDate",
        "empInfo/empPayCompNonRecurringNav/value",
        "userId"
    ].filter(select => select !== null).join(",");
    const userUrl = "/User(" + userId + ")?fromDate=" + fromDate + "&toDate=" + toDate + "&$expand=" + userExpands + "&$select=" + userSelects;
    const userResponse = await axios.get(userUrl);

    return userResponse.data;
}

function getTeamPayComponents(manager, year, entireYear, target, convert, locale) {
    let teamPayComponents = manager.directReports.reduce((results, user) => {
        const compRecords = user.empInfo.compInfoNav;
        const payCompsNonRec = user.empInfo.empPayCompNonRecurringNav;

        let userPayComponents = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, false, convert, locale);
        let userPayTargets = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, true, convert, locale);
        let userBonuses = utils.getPayComponentsNonRec(payCompsNonRec, year, entireYear, target, convert, locale);

        const actualTargetFilter = (payComp) => {
            const isTarget = (target === "true");
            return ((!isTarget && payComp.type == "AMOUNT") || (isTarget && payComp.type == "PERCENTAGE"));
        };

        // TODO: Review conversion to Fixed Pay
        let userCompensation = Object.keys(userPayComponents).reduce((userMix, code) => {
            const userPayComponent = userPayComponents[code];
            if (userPayComponent.description.toLowerCase() == "benefit") { // FIXME: this is only a workaround as requested
                userMix.ben.value += userPayComponent.value;
            }
            else {
                userMix.fix.value += userPayComponent.value;
            }
            return userMix;
        }, {
            fix: {
                name: "Fixed pay",
                uniqueName: "Fixed pay",
                description: null,
                value: 0.0
            },
            var: {
                name: target.toString() == "false" ? "Actual variable pay" : "Target variable pay",
                uniqueName: target.toString() == "false" ? "Actual variable pay" : "Target variable pay",
                description: null,
                value: 0.0
            },
            ben: {
                name: "Benefits",
                uniqueName: "Benefits",
                description: null,
                value: 0.0
            }
        });
        userCompensation = Object.keys(userPayTargets).reduce((userMix, code) => {
            const userPayTarget = userPayTargets[code];
            if (actualTargetFilter(userPayTarget)) userMix.var.value += userPayTarget.value;
            return userMix;
        }, userCompensation);
        userCompensation = Object.keys(userBonuses).reduce((userMix, code) => {
            const userBonus = userBonuses[code];
            userMix.ben.value += userBonus.value;
            return userMix;
        }, userCompensation);

        Object.keys(userCompensation).forEach(code => {
            const userCompRecord = userCompensation[code];
            if (!(code in results)) results[code] = {
                code: code,
                name: userCompRecord.name,
                uniqueName: userCompRecord.name, //userCompRecord.name + " [" + code + "]",
                value: 0.0
            }
            results[code].value += userCompRecord.value;
        });

        return results;
    }, {});

    return Object.keys(teamPayComponents).reduce((results, code) => {
        let payComponent = teamPayComponents[code];
        payComponent.code = code;
        results.push(payComponent);
        return results;
    }, []);
}

function getTeamPayComponentsDetail(select, manager, year, entireYear, target, convert, locale) {
    const where = select.where;
    const orderBy = select.orderBy;

    let sorts = orderBy ? utils.parseSorts(orderBy, false) : [];
    const filters = where ? utils.parseFilters(where) : {};
    const categoryFilter = filters.category ? filters.category : null;

    let teamPayComponents = manager.directReports.reduce((results, user) => {
        const compRecords = user.empInfo.compInfoNav;
        const payCompsNonRec = user.empInfo.empPayCompNonRecurringNav;

        let userPayComponents = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, false, convert, locale);
        let userPayTargets = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, true, convert, locale);
        let userBonuses = utils.getPayComponentsNonRec(payCompsNonRec, year, entireYear, target, convert, locale);

        const actualTargetFilter = (payComp) => {
            const isTarget = (target === "true");
            return ((!isTarget && payComp.type == "AMOUNT") || (isTarget && payComp.type == "PERCENTAGE"));
        };

        results = Object.keys(userPayComponents).reduce((payComponents, code) => {
            const userPayComponent = userPayComponents[code];
            if (!(code in payComponents)) {
                payComponents[code] = userPayComponent;
                if (userPayComponent.description.toLowerCase() == "benefit") { // FIXME: this is only a workaround as requested
                    payComponents[code].category = "ben";
                    payComponents[code].displayOrder = 4;
                }
                else {
                    payComponents[code].category = "fix";
                    payComponents[code].displayOrder = 1;
                }
            }
            else payComponents[code].value += userPayComponent.value;
            return payComponents;
        }, results);
        results = Object.keys(userPayTargets).reduce((payComponents, code) => {
            const userPayTarget = userPayTargets[code];
            if (actualTargetFilter(userPayTarget)) {
                if (!(code in payComponents)) {
                    payComponents[code] = userPayTarget;
                    payComponents[code].category = target.toString() == "false" ? "varact" : "vartar";
                    payComponents[code].displayOrder = 2;
                }
                else payComponents[code].value += userPayTarget.value;
            }
            return payComponents;
        }, results);
        results = Object.keys(userBonuses).reduce((payComponents, code) => {
            const userBonus = userBonuses[code];
            if (!(code in payComponents)) {
                payComponents[code] = userBonus;
                payComponents[code].category = "ben";
                payComponents[code].displayOrder = 3;
            }
            else payComponents[code].value += userBonus.value;
            return payComponents;
        }, results);

        return results;
    }, {});

    let finalResults = Object.keys(teamPayComponents).reduce((results, code) => {
        let payComponent = teamPayComponents[code];
        payComponent.code = code;
        if (!categoryFilter || categoryFilter == payComponent.category) results.push(payComponent);
        return results;
    }, []);

    sorts = sorts.filter(orderPart => orderPart.property != "code");
    return sorts.length > 0 ? utils.orderWith(finalResults, utils.createComparator(sorts)) : finalResults;
}

function getTeamPayComponentsSum(manager, year, entireYear, target, convert, locale) {
    let teamPayComponentSum = manager.directReports.reduce((sum, user) => {
        const compRecords = user.empInfo.compInfoNav;
        const payCompsNonRec = user.empInfo.empPayCompNonRecurringNav;

        let userPayComponents = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, false, convert, locale);
        let userPayTargets = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, true, convert, locale);
        let userBonuses = utils.getPayComponentsNonRec(payCompsNonRec, year, entireYear, target, convert, locale);

        const actualTargetFilter = (payComp) => {
            const isTarget = (target === "true");
            return ((!isTarget && payComp.type == "AMOUNT") || (isTarget && payComp.type == "PERCENTAGE"));
        };

        // TODO: Review conversion to Fixed Pay
        sum = Object.keys(userPayComponents).reduce((sumPart, code) => {
            return sumPart + userPayComponents[code].value;
        }, sum);
        sum = Object.keys(userPayTargets).reduce((sumPart, code) => {
            return sumPart + (actualTargetFilter(userPayTargets[code]) ? userPayTargets[code].value : 0.0);
        }, sum);
        sum = Object.keys(userBonuses).reduce((sumPart, code) => {
            return sumPart + userBonuses[code].value;
        }, sum);

        return sum;
    }, 0.0);

    return {
        value: teamPayComponentSum
    }
}

function getUserPayComponents(select, manager, year, entireYear, target, convert, locale) {
    const orderBy = select.orderBy;
    let sorts = orderBy ? utils.parseSorts(orderBy, false) : [];

    let payComponents = manager.directReports.reduce((results, user) => {
        const compRecords = user.empInfo.compInfoNav;
        const payCompsNonRec = user.empInfo.empPayCompNonRecurringNav;

        let userPayComponents = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, false, convert, locale);
        let userPayTargets = utils.getPayComponentsRec(compRecords, null, null, year, entireYear, true, convert, locale);
        let userBonuses = utils.getPayComponentsNonRec(payCompsNonRec, year, entireYear, target, convert, locale);

        const actualTargetFilter = (payComp) => {
            const isTarget = (target === "true");
            return ((!isTarget && payComp.type == "AMOUNT") || (isTarget && payComp.type == "PERCENTAGE"));
        };

        // TODO: Review conversion to Fixed Pay
        let userCompensation = Object.keys(userPayComponents).reduce((userMix, code) => {
            const userPayComponent = userPayComponents[code];
            if (actualTargetFilter(userPayComponent)) {
                if (userPayComponent.description.toLowerCase() == "benefit") { // FIXME: this is only a workaround as requested
                    userMix.ben.value += userPayComponent.value;
                }
                else {
                    userMix.fix.value += userPayComponent.value;
                }
            }
            return userMix;
        }, {
            fix: {
                displayOrder: 1,
                name: "Fixed pay",
                uniqueName: "Fixed pay",
                description: null,
                value: 0.0
            },
            var: {
                displayOrder: 2,
                name: target.toString() == "false" ? "Actual variable pay" : "Target variable pay",
                uniqueName: target.toString() == "false" ? "Actual variable pay" : "Target variable pay",
                description: null,
                value: 0.0
            },
            ben: {
                displayOrder: 3,
                name: "Benefits",
                uniqueName: "Benefits",
                description: null,
                value: 0.0
            }
        });
        userCompensation = Object.keys(userPayTargets).reduce((userMix, code) => {
            const userPayTarget = userPayTargets[code];
            if (actualTargetFilter(userPayTarget)) userMix.var.value += userPayTarget.value;
            return userMix;
        }, userCompensation);
        userCompensation = Object.keys(userBonuses).reduce((userMix, code) => {
            const userBonus = userBonuses[code];
            if (actualTargetFilter(userBonus)) userMix.ben.value += userBonus.value;
            return userMix;
        }, userCompensation);

        Object.keys(userCompensation).forEach(code => {
            const userCompRecord = userCompensation[code];
            if (!(code in results)) results[code] = {}
            if (!(user.userId in results[code])) results[code][user.userId] = {
                displayOrder: userCompRecord.displayOrder,
                firstName: user.firstName,
                code: code,
                name: userCompRecord.name,
                uniqueName: userCompRecord.name, //userCompRecord.name + " [" + code + "]",
                value: 0.0
            }
            results[code][user.userId].value += userCompRecord.value;
        });

        return results;
    }, {});

    const sums = Object.keys(payComponents).reduce((results, code) => {
        Object.keys(payComponents[code]).forEach(userId => {
            if (!(userId in results)) results[userId] = 0.0;
            results[userId] += payComponents[code][userId].value;
        });

        return results;
    }, {});

    let finalResults = Object.keys(payComponents).reduce((results, code) => {
        Object.keys(payComponents[code]).forEach(userId => {
            let payComponent = payComponents[code][userId];
            payComponent.code = code;
            payComponent.userId = userId;
            payComponent.sum = sums[userId];
            results.push(payComponent);
        });
        return results;
    }, []);

    return sorts.length > 0 ? utils.orderWith(finalResults, utils.createComparator(sorts)) : finalResults;
}

function getTeamGrades(manager, toDate) {
    const teamGrades =  manager.directReports.reduce((results, user) => {
        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
        const payGrade = jobInfo ? jobInfo.payGrade : null;
        const payGradeNonNull = (!payGrade || payGrade == "null") ? "-" : payGrade;

        if (!(payGradeNonNull in results)) {
            results[payGradeNonNull] = payGradeNonNull;
        }

        return results;
    }, { "*": "*" });

    return Object.keys(teamGrades).reduce((results, grade) => {
        results.push({
            grade: grade
        });
        return results;
    }, []);
}

function getTeamCategories(manager, toDate) {
    const teamCategories =  manager.directReports.reduce((results, user) => {
        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
        const category = (jobInfo && jobInfo.positionNav) ? jobInfo.positionNav.cust_jobCategory : null;
        const categoryNonNull = (!category || category == "null") ? "-" : category;

        if (!(categoryNonNull in results)) {
            results[categoryNonNull] = categoryNonNull;
        }

        return results;
    }, { "*": "*" });

    return Object.keys(teamCategories).reduce((results, category) => {
        results.push({
            category: category
        });
        return results;
    }, []);
}

function getTeamJobs(manager, toDate) {
    const teamJobs =  manager.directReports.reduce((results, user) => {
        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
        const job = jobInfo ? jobInfo.jobTitle : null;
        const jobNonNull = (!job || job == "null") ? "-" : job;

        if (!(jobNonNull in results)) {
            results[jobNonNull] = jobNonNull;
        }

        return results;
    }, { "*": "*" });

    return Object.keys(teamJobs).reduce((results, job) => {
        results.push({
            job: job
        });
        return results;
    }, []);
}

function getTeamAgeGroups(manager) {
    const teamAgeGroups =  manager.directReports.reduce((results, user) => {
        const personInfo = user.empInfo.personNav;
        const age = (personInfo && personInfo.dateOfBirth) ? utils.currentAge(utils.parseDate(personInfo.dateOfBirth)) : 0.0;
        const ageGroup = utils.ageGroup(age);
        const ageGroupNonNull = (!ageGroup || ageGroup == "null") ? "-" : ageGroup;

        if (!(ageGroupNonNull in results)) {
            results[ageGroupNonNull] = ageGroupNonNull;
        }

        return results;
    }, { "*": "*" });

    return Object.keys(teamAgeGroups).reduce((results, ageGroup) => {
        results.push({
            ageGroup: ageGroup
        });
        return results;
    }, []);
}

function getGradeGenderDeviations(select, manager, year, entireYear, toDate, convert, payCompsByGroup, payCompGroup, locale) {
    const where = select.where;
    const orderBy = select.orderBy;

    let sorts = orderBy ? utils.parseSorts(orderBy, false) : [];
    const filters = where ? utils.parseFilters(where) : {};
    const selectedDimension = filters.selectedDimension ? filters.selectedDimension : "grade";

    let gradeGenderDeviations = manager.directReports.reduce((results, user) => {
        const personInfo = user.empInfo.personNav;
        const personalInfo = utils.getCurrentRecord(user.empInfo.personNav.personalInfoNav, utils.startDateComparator, toDate);
        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
        const compRecords = user.empInfo.compInfoNav;

        const gender = personalInfo ? personalInfo.gender : null;
        const payGrade = jobInfo ? jobInfo.payGrade : null;
        const payGradeNonNull = payGrade ? payGrade : "-";
        const jobCategory = (jobInfo && jobInfo.positionNav) ? jobInfo.positionNav.cust_jobCategory : null;
        const jobCategoryNonNull = jobCategory ? jobCategory : "-";
        const age = (personInfo && personInfo.dateOfBirth) ? utils.currentAge(utils.parseDate(personInfo.dateOfBirth)) : 0.0;
        const ageGroup = utils.ageGroup(age);
        const fte = (jobInfo && jobInfo.fte) ? parseFloat(jobInfo.fte) : 0.0;

        let genderDescription = "-";

        switch(gender) {
            case "M":
                genderDescription = locale == "de_DE" ? "Männlich" : "Male";
                break;
            case "F":
                genderDescription = locale == "de_DE" ? "Weiblich" : "Female";
                break;
            case "U":
                genderDescription = "Unknown";
                break;
            case "D":
                genderDescription = locale == "de_DE" ? "Nicht deklariert" : "Undeclared";
                break;
            case "O":
                genderDescription = "Others";
                break;
        }

        let dimension = null;

        switch(selectedDimension) {
            case "grade":
                dimension = payGradeNonNull;
                break;
            case "jobCategory":
                dimension = jobCategoryNonNull;
                break;
            case "ageGroup":
                dimension = ageGroup;
                break;
        }

        const initialGenderRecord = (selectedDimension, dimension, genderDescription) => {
            return {
                selectedDimension: selectedDimension,
                dimension: dimension,
                gender: genderDescription,
                value: 0.0,
                details: {
                    fte: 0.0,
                    headcount: 0
                }
            };
        };

        if (!(selectedDimension in results))
            results[selectedDimension] = {}
        if (!(dimension in results[selectedDimension]))
            results[selectedDimension][dimension] = {
                "M": initialGenderRecord(selectedDimension, dimension, locale == "de_DE" ? "Männlich" : "Male"),
                "F": initialGenderRecord(selectedDimension, dimension, locale == "de_DE" ? "Weiblich" : "Female")
            }
        if (!(gender in results[selectedDimension][dimension]))
            results[selectedDimension][dimension][gender] = initialGenderRecord(selectedDimension, dimension, genderDescription);

        for (const [code, payCompRec] of Object.entries(utils.getPayComponentsRec(compRecords, payCompsByGroup, payCompGroup, year, entireYear, false, convert, locale))) {
            results[selectedDimension][dimension][gender].value += payCompRec.value;
        }

        results[selectedDimension][dimension][gender].details.fte += fte;
        results[selectedDimension][dimension][gender].details.headcount++;

        return results;
    }, {});

    let finalResults =  Object.keys(gradeGenderDeviations).reduce((results, selectedDimension) => {
        Object.keys(gradeGenderDeviations[selectedDimension]).forEach(dimension => {
            Object.keys(gradeGenderDeviations[selectedDimension][dimension]).forEach(gender => {
                const deviation = gradeGenderDeviations[selectedDimension][dimension][gender];
                results.push({
                    selectedDimension: selectedDimension,
                    dimension: dimension,
                    gender: deviation.gender,
                    value: deviation.value,
                    details: deviation.details
                });
            });
        });
        return results;
    }, []);

    const createCustomComparator = (selectedDimension) => {
        switch(selectedDimension) {
            case "grade":
                return (item1, item2) => {
                    if (item1.dimension < item2.dimension) return -1;
                    if (item1.dimension > item2.dimension) return 1;
                    return 0;
                };
            case "jobCategory":
                return (item1, item2) => {
                    const normalizeDimension = (dimension) => {
                        switch(dimension) {
                            case "S":
                                return "1S";
                            case "P":
                                return "2P";
                            case "M":
                                return "3M";
                            case "E":
                                return "4E";
                            default:
                                return "0-";
                        }
                    };
                    let item1Dimension = normalizeDimension(item1.dimension);
                    let item2Dimension = normalizeDimension(item2.dimension);

                    if (item1Dimension < item2Dimension) return -1;
                    if (item1Dimension > item2Dimension) return 1;
                    return 0;
                };
            case "ageGroup":
                return (item1, item2) => {
                    if (parseInt(item1.dimension) < parseInt(item2.dimension)) return -1;
                    if (parseInt(item1.dimension) > parseInt(item2.dimension)) return 1;
                    return 0;
                };
        }
    };

    return sorts.length > 0 ? utils.orderWith(finalResults, createCustomComparator(selectedDimension)) : finalResults;
}

function getGradeAverageDeviations(manager, year, entireYear, toDate, payCompsByGroup, payCompGroup, salaryAveragesByGrade, convert, locale) {
    let userPayComponents = manager.directReports.reduce((results, user) => {
        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
        const payGrade = jobInfo ? jobInfo.payGrade : null;
        const compRecords = user.empInfo.compInfoNav;
        const payComponents = utils.getPayComponentsRec(compRecords, payCompsByGroup, payCompGroup, year, entireYear, false, convert, locale);

        Object.keys(payComponents).forEach(code => {
            const payComponent = payComponents[code];
            if (!(user.userId in results)) results[user.userId] = {
                firstName: user.firstName,
                payGrade: payGrade,
                salary: 0.0
            }
            results[user.userId].salary += payComponent.value;
        });

        return results;
    }, {});

    userPayComponents = Object.keys(userPayComponents).reduce((results, userId) => {
        userPayComponents[userId].average = userPayComponents[userId].salary - salaryAveragesByGrade[userPayComponents[userId].payGrade];
        results[userId] = userPayComponents[userId];
        return results;
    }, {});

    return Object.keys(userPayComponents).reduce((results, userId) => {
        let userPayComponent = userPayComponents[userId];
        userPayComponent.userId = userId;
        userPayComponent.deviation = userPayComponent.average / salaryAveragesByGrade[userPayComponents[userId].payGrade];
        results.push(userPayComponent);
        return results;
    }, []);
}

function getSalaryRangePenetrations(manager, toDate) {
    return manager.directReports.reduce((results, user) => {
        const compInfo = utils.getCurrentRecord(user.empInfo.compInfoNav, utils.startDateComparator, toDate);

        results.push({
            userId: user.userId,
            firstName: user.firstName,
            penetration: (compInfo && compInfo.empCompensationCalculatedNav) ? compInfo.empCompensationCalculatedNav.rangePenetration : null
        });

        return results;
    }, []);
}

function getPerformanceHeatMap(manager, year, toDate, axios, request) {
    let i = 0;
    const performanceHeatMap = manager.directReports.reduce((results, user) => {
        const compInfo = utils.getCurrentRecord(user.empInfo.compInfoNav, utils.startDateComparator, toDate);
        const currentFormHeaders = module.exports.formHeaders[user.userId].filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year);
        const compaRatio = (compInfo && compInfo.empCompensationCalculatedNav) ? parseFloat(compInfo.empCompensationCalculatedNav.compaRatio) : null;
        const rating = currentFormHeaders[0] ? currentFormHeaders[0].rating : null;
        const ratingKey = rating ? Math.round(parseFloat(rating)).toString() : "N/R";

        if (!compaRatio || isNaN(compaRatio)) return results;

        let compaRatioRange = null;

        if (compaRatio >= 1.2) compaRatioRange = "> 120";
        if (compaRatio >= 1.1 && compaRatio < 1.2) compaRatioRange = "110 to 120";
        if (compaRatio >= 0.8 && compaRatio < 0.9) compaRatioRange = "80 to 90";
        if (compaRatio < 0.8) compaRatioRange = "< 80";

        if (!compaRatioRange) return results;

        results[compaRatioRange][ratingKey].count++;
        results[compaRatioRange][ratingKey].employees.push({
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName
        });

        return results;
    }, {
        "< 80": {
            "N/R": { count: 0, employees: [] },
            "1": { count: 0, employees: [] },
            "2": { count: 0, employees: [] },
            "3": { count: 0, employees: [] },
            "4": { count: 0, employees: [] },
            "5": { count: 0, employees: [] }
        },
        "80 to 90": {
            "N/R": { count: 0, employees: [] },
            "1": { count: 0, employees: [] },
            "2": { count: 0, employees: [] },
            "3": { count: 0, employees: [] },
            "4": { count: 0, employees: [] },
            "5": { count: 0, employees: [] }
        },
        "110 to 120": {
            "N/R": { count: 0, employees: [] },
            "1": { count: 0, employees: [] },
            "2": { count: 0, employees: [] },
            "3": { count: 0, employees: [] },
            "4": { count: 0, employees: [] },
            "5": { count: 0, employees: [] }
        },
        "> 120": {
            "N/R": { count: 0, employees: [] },
            "1": { count: 0, employees: [] },
            "2": { count: 0, employees: [] },
            "3": { count: 0, employees: [] },
            "4": { count: 0, employees: [] },
            "5": { count: 0, employees: [] }
        },
    });

    return Object.keys(performanceHeatMap).reduce((results, compaRatioRange) => {
        Object.keys(performanceHeatMap[compaRatioRange]).forEach((rating) => {
            results.push({
                compaRatioRange: compaRatioRange,
                rating: rating,
                employeeCount: performanceHeatMap[compaRatioRange][rating].count,
                employees: performanceHeatMap[compaRatioRange][rating].employees
            });
        });
        return results;
    }, []);
}

function getTeamStructuresByCareerTeam(where, manager, toDate, locale) {
    const filters = where ? utils.parseFilters(where) : {};
    const selectedDimension = filters.selectedDimension ? filters.selectedDimension : "jobFunction";

    const teamStructuresByCareerTeam = manager.directReports.reduce((results, user) => {
        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
        const personInfo = user.empInfo.personNav;
        const personalInfo = utils.getCurrentRecord(user.empInfo.personNav.personalInfoNav, utils.startDateComparator, toDate);

        const age = (personInfo && personInfo.dateOfBirth) ? utils.currentAge(utils.parseDate(personInfo.dateOfBirth)) : 0.0;
        const ageGroup = utils.ageGroup(age);
        const gender = personalInfo ? personalInfo.gender : null;
        const payGrade = jobInfo ? jobInfo.payGrade : null;
        const payGradeNonNull = (!payGrade || payGrade == "null") ? "-" : payGrade;
        const jobFunction = ((jobInfo && jobInfo[fnNavProp])
            ? (jobInfo[fnNavProp]["name_" + locale]
                ? jobInfo[fnNavProp]["name_" + locale]
                : jobInfo[fnNavProp].name_en_US)
            : null);
        const jobFunctionNonNull = (!jobFunction || jobFunction == "null") ? "No Data Available" : jobFunction;
        const jobCategory = (jobInfo && jobInfo.positionNav) ? jobInfo.positionNav.cust_jobCategory : null;
        const jobCategoryNonNull = jobCategory ? jobCategory : "-";
        const riskTakerLabels = (jobInfo && jobInfo.customString16Nav) ? jobInfo.customString16Nav.picklistLabels.filter(label => label.locale == "en_US") : [];
        const riskTaker = riskTakerLabels[0] ? riskTakerLabels[0].label : null;
        const fte = (jobInfo && jobInfo.fte) ? parseFloat(jobInfo.fte) : 0.0;

        let genderDescription = "-";

        switch(gender) {
            case "M":
                genderDescription = locale == "de_DE" ? "Männlich" : "Male";
                break;
            case "F":
                genderDescription = locale == "de_DE" ? "Weiblich" : "Female";
                break;
            case "U":
                genderDescription = "Unknown";
                break;
            case "D":
                genderDescription = locale == "de_DE" ? "Nicht deklariert" : "Undeclared";
                break;
            case "O":
                genderDescription = "Others";
                break;
        }

        let dimension = null;

        switch(selectedDimension) {
            case "ageGroup":
                dimension = ageGroup;
                break;
            case "gender":
                dimension = genderDescription;
                break;
            case "grade":
                dimension = payGradeNonNull;
                break;
            case "jobCategory":
                dimension = jobCategoryNonNull;
                break;
            case "jobFunction":
                dimension = jobFunctionNonNull;
                break;
            case "riskTaker":
                dimension = riskTaker;
                break;
        }

        if (!(selectedDimension in results))
            results[selectedDimension] = {};
        if (!(dimension in results[selectedDimension])) {
            results[selectedDimension][dimension] = {
                selectedDimension: selectedDimension,
                dimension: dimension,
                amount: 0.0
            };
        }

        results[selectedDimension][dimension].amount += fte;

        return results;
    }, {});
    
    let finalResults = Object.keys(teamStructuresByCareerTeam).reduce((results, selectedDimension) => {
        Object.keys(teamStructuresByCareerTeam[selectedDimension]).forEach(dimension => {
            results.push({
                selectedDimension: selectedDimension,
                dimension: dimension,
                amount: teamStructuresByCareerTeam[selectedDimension][dimension].amount,
            });
        });
        return results;
    }, []);

    const createCustomComparator = (selectedDimension) => {
        switch(selectedDimension) {
            case "ageGroup":
                return (item1, item2) => {
                    if (parseInt(item1.dimension) < parseInt(item2.dimension)) return -1;
                    if (parseInt(item1.dimension) > parseInt(item2.dimension)) return 1;
                    return 0;
                };
            case "gender":
            case "grade":
            case "jobFunction":
            case "riskTaker":
                return (item1, item2) => {
                    if (item1.dimension < item2.dimension) return -1;
                    if (item1.dimension > item2.dimension) return 1;
                    return 0;
                };
            case "jobCategory":
                return (item1, item2) => {
                    const normalizeDimension = (dimension) => {
                        switch(dimension) {
                            case "S":
                                return "1S";
                            case "P":
                                return "2P";
                            case "M":
                                return "3M";
                            case "E":
                                return "4E";
                            default:
                                return "0-";
                        }
                    };
                    let item1Dimension = normalizeDimension(item1.dimension);
                    let item2Dimension = normalizeDimension(item2.dimension);

                    if (item1Dimension < item2Dimension) return -1;
                    if (item1Dimension > item2Dimension) return 1;
                    return 0;
                };
        }
    };

    return utils.orderWith(finalResults, createCustomComparator(selectedDimension));
}

function getPerformanceCounts(manager, year, axios, request) {
    const ratings = manager.directReports.reduce((results, user) => {
        const currentFormHeaders = module.exports.formHeaders[user.userId].filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year);
        const rating = currentFormHeaders[0] ? currentFormHeaders[0].rating : null;
        const ratingKey = rating ? Math.round(parseFloat(rating)).toString() : "N/R";

        results[ratingKey]++;

        return results;
    }, {
        "N/R": 0,
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
    });

    return Object.keys(ratings).reduce((results, rating) => {
        results.push({
            rating: rating,
            employeeCount: ratings[rating]
        });
        return results;
    }, []);
}

function getPerformanceSalaryIncreases(manager, year, axios, request) {
    let salaryIncreases = manager.directReports.reduce((results, user) => {
        const currentFormHeaders = module.exports.formHeaders[user.userId].filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year);
        const rating = currentFormHeaders[0] ? currentFormHeaders[0].rating : null;
        const salaryIncrease = utils.getSalaryIncrease(user.empInfo.compInfoNav);
        const ratingKey = rating ? Math.round(parseFloat(rating)).toString() : "N/R";

        results[ratingKey].sum += parseFloat(salaryIncrease);
        results[ratingKey].count++;

        return results;
    }, {
        "N/R": { sum: 0.0, count: 0, average: 0.0 },
        "1": { sum: 0.0, count: 0, average: 0.0 },
        "2": { sum: 0.0, count: 0, average: 0.0 },
        "3": { sum: 0.0, count: 0, average: 0.0 },
        "4": { sum: 0.0, count: 0, average: 0.0 },
        "5": { sum: 0.0, count: 0, average: 0.0 }
    });

    salaryIncreases = Object.keys(salaryIncreases).reduce((results, rating) => {
        if (salaryIncreases[rating].count > 0) salaryIncreases[rating].average = salaryIncreases[rating].sum / salaryIncreases[rating].count;
        results[rating] = salaryIncreases[rating];
        return results;
    }, {});

    return Object.keys(salaryIncreases).reduce((results, rating) => {
        results.push({
            rating: rating,
            salaryIncrease: salaryIncreases[rating]
        });
        return results;
    }, []);
}