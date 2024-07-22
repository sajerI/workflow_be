const auth = require('./auth');
const team = require('./team');
const server = require("./server");
const utils = require("./utils");

const fnNavProp = server.fnNavProp;
const fnProp = server.fnProp;

module.exports = {
    readPerson: async (axios, request, includeTeamData) => {
        const { userId, year, target, currency, entireYear, payComponentGroup } = request.params[0];
        const locale = utils.getSFLanguage(request.locale);
        const fkMapper = utils.fkMapper("person", request.params[0]);
        const keyYear = new Date().getFullYear();
        const entireYearTF = (keyYear != year || entireYear.toString() == "true");
        const fromDate = year + "-01-01";
        const toDate = entireYearTF ? (year + "-12-31") : utils.formatDate(new Date());

        let user = await getUser(axios, request, userId, fromDate, toDate, includeTeamData, locale);

        const formHeaders = await utils.getFormHeaders(axios, request, user.personKeyNav.personIdExternal);
        const exchangeRates = await utils.getCurrencyExchangeRates(axios, request, year);
        const convert = utils.getCurrencyConverter(currency, exchangeRates);

        const payCompsByGroup = await utils.getPayComponentsByGroup(axios, request, toDate);

        user.employeeOverview = await getEmployeeOverview(axios, request, locale, user, formHeaders, year, toDate, payCompsByGroup, payComponentGroup, convert);
        user.employeeAverage = getEmployeeAverage(user, formHeaders, year);
        user.payComponents = getPayComponents(request.query.SELECT, user, year, entireYearTF, target, convert, locale);
        user.payComponentSum = user.payComponents.reduce((sum, payComponent) => {
            sum.value += payComponent.value;
            return sum;
        }, { value: 0.0 });

        if (includeTeamData) {
            const managerKey = userId + "|" + year + "|" + target + "|" + fromDate + "|" + toDate + "|" + locale;
            let manager = undefined;
            let managerFormHeaders = undefined;
            if (team.manager && (managerKey in team.manager)) {
                manager = team.manager[managerKey];
                if (team.formHeaders) managerFormHeaders = team.formHeaders;
            } else {
                manager = await getManager(axios, request, user.manager.userId, fromDate, toDate, locale);

                manager.directReports = manager.directReports.filter((user) => {
                    if (user.empInfo && user.empInfo.jobInfoNav) {
                        const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
                        const emplStatus = (jobInfo && jobInfo.emplStatusNav) ? jobInfo.emplStatusNav.externalCode : null;
                        return emplStatus == "A";
                    }
                    return false;
                });
            }

            user.teamAverages = getTeamPersonAverages(utils.getTeamAverages(manager, toDate), user, toDate);
            user.teamStructures = getTeamPersonStructures(utils.getTeamStructures(manager, toDate, locale), user, toDate, locale);
            user.teamPerformances = getTeamPersonPerformances(await utils.getTeamPerformances(manager, axios, request, year, toDate, payCompsByGroup, payComponentGroup, convert, locale, managerFormHeaders),
                                                                user, formHeaders, year, toDate, payCompsByGroup, payComponentGroup, convert, locale);

            user.teamAverages = user.teamAverages.map(fkMapper)
            user.teamStructures = user.teamStructures.map(fkMapper)
            user.teamPerformances = user.teamPerformances.map(fkMapper)
        }

        user.year = year;
        user.target = target;
        user.currency = currency;
        user.entireYear = entireYear;
        user.payComponentGroup = payComponentGroup;

        user.employeeOverview = user.employeeOverview.map(fkMapper)
        user.employeeAverage = user.employeeAverage.map(fkMapper)
        user.payComponents = user.payComponents.map(fkMapper)
        user.payComponentSum = [user.payComponentSum].map(fkMapper)[0]

        return user;
    },

    readEmployee: async (axios, request) => {
        const { userId, year, target, currency, entireYear, payComponentGroup } = request.params[0];
        const keyYear = new Date().getFullYear();
        const entireYearTF = (keyYear != year || entireYear.toString() == "true");
        const fromDate = year + "-01-01";
        const toDate = entireYearTF ? (year + "-12-31") : utils.formatDate(new Date());

        let employee = await getEmployee(axios, request, userId, fromDate, toDate);
        let manager = await getManager(axios, request, employee.manager.userId, fromDate, toDate);

        //const payCompsByGroup = await utils.getPayComponentsByGroup(axios, request, toDate);

        employee.teamAverages = utils.getTeamAverages(manager, toDate);
        //employee.teamStructures = utils.getTeamStructures(manager, toDate);
        //employee.teamPerformances = await utils.getTeamPerformances(manager, axios, request, year, payCompsByGroup, payComponentGroup);

        return employee;
    },

    readTeamMember: async (axios, request, managerId, year, entireYear) => {
        const keyYear = new Date().getFullYear();
        const entireYearTF = (keyYear != year || entireYear.toString() == "true");
        const toDate = entireYearTF ? (year + "-12-31") : utils.formatDate(new Date());

        if (!auth.validateManager(request.user.id, managerId)) {
            return [];
        }

        const url = "/User('" + managerId + "')?$expand=directReports/empInfo/jobInfoNav/emplStatusNav";
        const managerResponse = await axios.get(url);

        return managerResponse.data.directReports.filter((user) => {
            if (user.empInfo && user.empInfo.jobInfoNav) {
                const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
                const emplStatus = (jobInfo && jobInfo.emplStatusNav) ? jobInfo.emplStatusNav.externalCode : null;
                return emplStatus == "A";
            }
            return false;
        });
    }
};

async function getUser(axios, request, userId, fromDate, toDate, includeManager, locale) {
    const userExpands = [
        "empInfo/personNav/personalInfoNav",
        fnNavProp ? "empInfo/jobInfoNav/" + fnNavProp : null,
        "empInfo/jobInfoNav/customString16Nav/picklistLabels",
        "empInfo/jobInfoNav/jobCodeNav",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/descriptionTranslationNav",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/frequencyCodeNav",
        "empInfo/empPayCompNonRecurringNav/payComponentCodeNav/nameTranslationNav",
        "empInfo/compInfoNav/empCompensationCalculatedNav",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav",
        includeManager ? "manager" : null,
        "personKeyNav"
    ].filter(expand => expand !== null).join(",");
    const userSelects = [
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/externalCode",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_" + locale,
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_en_US",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav/annualizationFactor",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_" + locale,
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_en_US",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/payComponentType",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/target",
        "empInfo/compInfoNav/empPayCompRecurringNav/calculatedAmount",
        "empInfo/compInfoNav/empPayCompRecurringNav/currencyCode",
        "empInfo/compInfoNav/empPayCompRecurringNav/payComponent",
        "empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
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
        fnNavProp ? "empInfo/jobInfoNav/" + fnNavProp + "/name_" + locale : null,
        fnNavProp ? "empInfo/jobInfoNav/" + fnNavProp + "/name_en_US" : null,
        "empInfo/jobInfoNav/endDate",
        "empInfo/jobInfoNav/fte",
        "empInfo/jobInfoNav/jobCodeNav/name_" + locale,
        "empInfo/jobInfoNav/jobCodeNav/name_en_US",
        "empInfo/jobInfoNav/jobTitle",
        "empInfo/jobInfoNav/payGrade",
        "empInfo/jobInfoNav/position",
        "empInfo/jobInfoNav/seqNumber",
        "empInfo/jobInfoNav/startDate",
        "empInfo/personNav/personalInfoNav/firstName",
        "empInfo/personNav/personalInfoNav/gender",
        "empInfo/personNav/personalInfoNav/lastName",
        "empInfo/personNav/personalInfoNav/endDate",
        "empInfo/personNav/personalInfoNav/startDate",
        "empInfo/startDate",
        includeManager ? "manager/userId" : null,
        "personKeyNav/personIdExternal",
        "userId"
    ].filter(select => select !== null).join(",");
    const userUrl = "/User(" + userId + ")?fromDate=" + fromDate + "&toDate=" + toDate + "&$expand=" + userExpands + "&$select=" + userSelects;
    const userResponse = await axios.get(userUrl);

    return userResponse.data;
}

async function getManager(axios, request, userId, fromDate, toDate, locale) {
    const managerExpands = [
        //"empInfo/personNav/personalInfoNav",
        //"empInfo/jobInfoNav/customString4Nav",
        //"empInfo/jobInfoNav/customString16Nav/picklistLabels",
        //"empInfo/jobInfoNav/jobCodeNav",
        //"empInfo/empPayCompNonRecurringNav/payComponentCodeNav/frequencyCodeNav",
        //"empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav",
        "directReports/empInfo/compInfoNav/empCompensationCalculatedNav",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav",
        "directReports/empInfo/empPayCompNonRecurringNav/payComponentCodeNav/frequencyCodeNav",
        fnNavProp ? "directReports/empInfo/jobInfoNav/" + fnNavProp : null,
        "directReports/empInfo/jobInfoNav/emplStatusNav",
        "directReports/empInfo/jobInfoNav/jobCodeNav",
        "directReports/empInfo/jobInfoNav/positionNav",
        "directReports/empInfo/personNav/personalInfoNav",
        "directReports/personKeyNav",
        //"personKeyNav"
    ].filter(expand => expand !== null).join(",");
    const managerSelects = [
        ////"empInfo/empPayCompNonRecurringNav/payComponentCodeNav/frequencyCodeNav",
        ////"empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav",
        //"empInfo/compInfoNav/endDate",
        //"empInfo/compInfoNav/startDate",
        ////"empInfo/jobInfoNav/customString4Nav",
        ////"empInfo/jobInfoNav/customString16Nav/picklistLabels",
        //"empInfo/jobInfoNav/endDate",
        //"empInfo/jobInfoNav/fte",
        //"empInfo/jobInfoNav/jobCodeNav/name_en_US",
        //"empInfo/jobInfoNav/seqNumber",
        //"empInfo/jobInfoNav/startDate",
        //"empInfo/personNav/dateOfBirth",
        //"empInfo/personNav/personalInfoNav/endDate",
        //"empInfo/personNav/personalInfoNav/gender",
        //"empInfo/personNav/personalInfoNav/startDate",
        //"empInfo/startDate",
        "directReports/empInfo/compInfoNav/empCompensationCalculatedNav/rangePenetration",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/externalCode",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_" + locale,
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/descriptionTranslationNav/value_en_US",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/frequencyCodeNav/annualizationFactor",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_" + locale,
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/nameTranslationNav/value_en_US",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/payComponentType",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponentNav/target",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/calculatedAmount",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/currencyCode",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/payComponent",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/paycompvalue",
        "directReports/empInfo/compInfoNav/empPayCompRecurringNav/seqNumber",
        "directReports/empInfo/compInfoNav/endDate",
        "directReports/empInfo/compInfoNav/startDate",
        fnNavProp ? "directReports/empInfo/jobInfoNav/" + fnNavProp + "/name_" + locale : null,
        fnNavProp ? "directReports/empInfo/jobInfoNav/" + fnNavProp + "/name_en_US" : null,
        "directReports/empInfo/jobInfoNav/emplStatusNav/externalCode",
        "directReports/empInfo/jobInfoNav/endDate",
        "directReports/empInfo/jobInfoNav/fte",
        "directReports/empInfo/jobInfoNav/jobCodeNav/name_" + locale,
        "directReports/empInfo/jobInfoNav/jobCodeNav/name_en_US",
        //"directReports/empInfo/jobInfoNav/positionNav",
        "directReports/empInfo/jobInfoNav/seqNumber",
        "directReports/empInfo/jobInfoNav/startDate",
        "directReports/empInfo/personNav/dateOfBirth",
        "directReports/empInfo/personNav/personalInfoNav/endDate",
        "directReports/empInfo/personNav/personalInfoNav/gender",
        "directReports/empInfo/personNav/personalInfoNav/startDate",
        "directReports/empInfo/startDate",
        "directReports/personKeyNav/personIdExternal",
        "directReports/userId",
        ////"personKeyNav"
    ].filter(select => select !== null).join(",");
    const managerUrl = "/User(" + userId + ")?fromDate=" + fromDate + "&toDate=" + toDate + "&$expand=" + managerExpands + "&$select=" + managerSelects;
    const managerResponse = await axios.get(managerUrl);

    return managerResponse.data;
}

async function getEmployeeOverview(axios, request, locale, user, formHeaders, year, toDate, payCompsByGroup, payComponentGroup, convert) {
    const jobInfoNav = user.empInfo.jobInfoNav.sort(utils.startDateSeqNumComparator);
    const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
    const personalInfo = utils.getCurrentRecord(user.empInfo.personNav.personalInfoNav, utils.startDateComparator, toDate);

    const salaryIncrease = utils.getSalaryIncrease(user.empInfo.compInfoNav, payCompsByGroup, payComponentGroup, convert, locale);
    const currentFormHeaders = formHeaders.filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year);
    const lastYearFormHeaders = formHeaders.filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year - 1);

    return await _getEmployeeOverview(axios, request, locale, user, personalInfo, jobInfoNav, jobInfo, currentFormHeaders, lastYearFormHeaders, salaryIncrease);
    //return _getEmployeeOverviewOld(user, jobInfo, currentFormHeaders, salaryIncrease);
}

async function _getEmployeeOverview(axios, request, locale, user, personalInfo, jobInfoNav, jobInfo, currentFormHeaders, lastYearFormHeaders, salaryIncrease) {
    const latestPosition = jobInfo ? jobInfo.position : null;
    let lastPositionChange = jobInfoNav.reduce((result, record) => {
        if (!result.assigned && record.position != latestPosition) {
            result.date = utils.parseDate(record.startDate);
            result.assigned = true;
        }
        return result;
    }, {
        date: new Date(new Date().toDateString()),
        assigned: false
    });

    jobInfoNav = jobInfoNav.sort(utils.startDateSeqNumComparator);

    if (!lastPositionChange.assigned && jobInfoNav.length > 0) {
        lastPositionChange.date = utils.parseDate(jobInfoNav[0].startDate);
        lastPositionChange.assigned = true;
    }

    return [
        {
            displayOrder: 1,
            metric: "tabEmpOverTxtName",
            value: personalInfo ? (personalInfo.firstName + " " + personalInfo.lastName) : null
        },
        {
            displayOrder: 2,
            metric: "tabEmpOverTxtYearsPos",
            value: lastPositionChange.assigned ? utils.yearsFromToday(lastPositionChange.date) : null
        },
        {
            displayOrder: 3,
            metric: "tabEmpOverTxtYearsComp",
            value: utils.yearsFromToday(utils.parseDate(user.empInfo.startDate))
        },
        {
            displayOrder: 4,
            metric: "tabEmpOverTxtCurrFunc",
            value: await utils.getJobFamily(jobInfo, locale)
        },
        {
            displayOrder: 5,
            metric: "tabEmpOverTxtCarrPathStr",
            value: ((jobInfo && jobInfo.jobCodeNav)
                ? (jobInfo.jobCodeNav["name_" + locale]
                    ? jobInfo.jobCodeNav["name_" + locale]
                    : jobInfo.jobCodeNav["name_en_US"])
                : null)
        },
        {
            displayOrder: 6,
            metric: "tabEmpOverTxtCurrJob",
            value: jobInfo ? jobInfo.jobTitle : null
        },
        {
            displayOrder: 7,
            metric: "tabEmpOverTxtGrade",
            value: jobInfo ? jobInfo.payGrade : null
        },
        {
            displayOrder: 8,
            metric: "tabEmpOverTxtFTE",
            value: jobInfo ? jobInfo.fte : null
        },
        {
            displayOrder: 9,
            metric: "tabEmpOverTxtCurrPerf",
            value: currentFormHeaders[0] ? currentFormHeaders[0].rating : null
        },
        {
            displayOrder: 10,
            metric: "tabEmpOverTxtLastPerf",
            value: lastYearFormHeaders[0] ? lastYearFormHeaders[0].rating : null
        },
        {
            displayOrder: 11,
            metric: "tabEmpOverTxtLastSalInc",
            value: salaryIncrease ? salaryIncrease.toString() : null
        },
    ];
}

function _getEmployeeOverviewOld(user, jobInfo, currentFormHeaders, salaryIncrease) {
    const riskTakerLabels = (jobInfo && jobInfo.customString16Nav) ? jobInfo.customString16Nav.picklistLabels.filter(label => label.locale == "en_US") : [];
    const latestPayGrade = jobInfo ? jobInfo.payGrade : null;
    const lastPayGradeChange = jobInfoNav.reduce((result, record) => {
        if (!result.assigned && record.payGrade != latestPayGrade) {
            result.date = utils.parseDate(record.startDate);
            result.assigned = true;
        }
        return result;
    }, {
        date: new Date(new Date().toDateString()),
        assigned: false
    }).date;

    return [
        {
            displayOrder: 1,
            metric: "Risk taker",
            value: riskTakerLabels[0] ? riskTakerLabels[0].label : null
        },
        {
            displayOrder: 2,
            metric: "Years with company",
            value: utils.yearsFromToday(utils.parseDate(user.empInfo.startDate))
        },
        {
            displayOrder: 3,
            metric: "Years within grade",
            value: utils.yearsFromToday(lastPayGradeChange)
        },
        {
            displayOrder: 4,
            metric: "Performance rating",
            value: currentFormHeaders[0] ? currentFormHeaders[0].rating : null
        },
        {
            displayOrder: 5,
            metric: "Salary increase",
            value: salaryIncrease ? salaryIncrease.toString() : null
        },
        {
            displayOrder: 6,
            metric: "Global grade",
            value: jobInfo ? jobInfo.payGrade : null
        },
        {
            displayOrder: 7,
            metric: "Career path/stream",
            value: null // TODO: field has to be provided in EC
        },
        {
            displayOrder: 8,
            metric: "Current job title",
            value: jobInfo ? jobInfo.jobTitle : null
        },
        {
            displayOrder: 9,
            metric: "FTE",
            value: jobInfo ? jobInfo.fte : null
        },
        {
            displayOrder: 10,
            metric: "Current function",
            value: null // TODO: field has to be provided in EC
        }
    ];
}

function getEmployeeAverage(user, formHeaders, year) {
    const formHeadersLast3Years = formHeaders.filter(item => {
        const formHeaderYear = utils.parseDate(item.formReviewStartDate).getFullYear();
        return (formHeaderYear == year || formHeaderYear == year - 1 || formHeaderYear == year - 2)
    });

    return [
        {
            displayOrder: 1,
            metric: "tabEmpAverageTxtAvgPerf",
            value: formHeadersLast3Years.length > 0 ? formHeadersLast3Years.reduce((sum, item) => {
                return sum + (isNaN(parseFloat(item.rating)) ? 0.0 : parseFloat(item.rating));
            }, 0.0) / formHeadersLast3Years.filter(item => !isNaN(item.rating)).length : null
        }/*,
        {
            displayOrder: 2,
            metric: "Average performance achievement",
            value: null // XXX: TBD
        }*/
    ];
}

function getPayComponents(select, user, year, entireYear, target, convert, locale) {
    const where = select.where;
    const orderBy = select.orderBy;

    const payComponents = utils.getPayComponentsRec(user.empInfo.compInfoNav, null, null, year, entireYear, false, convert, locale);
    const payTargets = utils.getPayComponentsRec(user.empInfo.compInfoNav, null, null, year, entireYear, true, convert, locale);
    const bonuses = utils.getPayComponentsNonRec(user.empInfo.empPayCompNonRecurringNav, year, entireYear, target, convert, locale);

    let sorts = orderBy ? utils.parseSorts(orderBy, false) : [];
    const filters = where ? utils.parseFilters(where) : {};
    const nameFilter = filters.name ? filters.name : null;

    let results = Object.keys(payComponents).reduce((partialResults, code) => {
        let payComponent = payComponents[code];
        if (payComponent.description.toLowerCase() == "benefit") { // FIXME: this is only a workaround as requested
            payComponent.displayOrder = 4;
            payComponent.category = "ben";
        }
        else {
            payComponent.displayOrder = 1;
            payComponent.category = "fix";
        }
        payComponent.code = code;
        if (!nameFilter || nameFilter == payComponent.name) partialResults.push(payComponent);
        return partialResults;
    }, []);
    results = Object.keys(payTargets).reduce((partialResults, code) => {
        let payTarget = payTargets[code];
        payTarget.displayOrder = 2;
        payTarget.category = target.toString() == "false" ? "varact" : "vartar";
        payTarget.code = code;
        if (!nameFilter || nameFilter == payTarget.name) {
            if ((target.toString() == "false" && payTarget.type == "AMOUNT") || (target.toString() == "true" && payTarget.type == "PERCENTAGE")) {
                partialResults.push(payTarget);
            }
        }
        return partialResults;
    }, results);
    results = Object.keys(bonuses).reduce((partialResults, code) => {
        let bonus = bonuses[code];
        bonus.displayOrder = 3;
        bonus.category = "ben";
        bonus.code = code;
        if (!nameFilter || nameFilter == bonus.name) partialResults.push(bonus);
        return partialResults;
    }, results);

    sorts = sorts.filter(orderPart => orderPart.property != "code");
    return sorts.length > 0 ? utils.orderWith(results, utils.createComparator(sorts)) : results;
}

function getTeamPersonAverages(teamAverages, user, toDate) {
    const personInfo = user.empInfo.personNav;
    const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);

    const fte = (jobInfo && jobInfo.fte) ? parseFloat(jobInfo.fte) : 0.0;
    const age = (personInfo && personInfo.dateOfBirth) ? utils.currentAge(utils.parseDate(personInfo.dateOfBirth)) : 0.0;
    const tenure = utils.yearsFromToday(utils.parseDate(user.empInfo.startDate));

    return teamAverages.map((teamAverage) => {
        switch (teamAverage.information) {
            case "tabTeamInfFTE":
                teamAverage.self = fte;
                break;
            case "tabTeamInfAge":
                teamAverage.self = age;
                break;
            case "tabTeamInfTenure":
                teamAverage.self = tenure;
                break;
        }

        return teamAverage;
    });
}

function getTeamPersonStructures(teamStructures, user, toDate, locale) {
    const personalInfo = utils.getCurrentRecord(user.empInfo.personNav.personalInfoNav, utils.startDateComparator, toDate);
    const jobInfo = utils.getCurrentRecord(user.empInfo.jobInfoNav, utils.startDateSeqNumComparator, toDate);
    const careerPathStream = ((jobInfo && jobInfo[fnNavProp])
        ? (jobInfo[fnNavProp]["name_" + locale]
            ? jobInfo[fnNavProp]["name_" + locale]
            : jobInfo[fnNavProp]["name_en_US"])
        : null);
    const gender = personalInfo ? personalInfo.gender : null;

    let i = 1

    return teamStructures.map((teamStructure) => {
        teamStructure.self = null;

        switch (teamStructure.information) {
            case "tabTeamStructMale":
                if (gender == "M") teamStructure.self = "X";
                break;
            case "tabTeamStructFemale":
                if (gender == "F") teamStructure.self = "X";
                break;
            case "tabTeamStructDiverse":
                if (["U", "D", "O"].includes(gender)) teamStructure.self = "X";
                break;
        }

        if (teamStructure.information == careerPathStream) teamStructure.self = "X";

        return teamStructure;
    });
}

function getTeamPersonPerformances(teamPerformances, user, formHeaders, year, toDate, payCompsByGroup, payComponentGroup, convert, locale) {
    const currentFormHeaders = formHeaders.filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year);
    const lastYearFormHeaders = formHeaders.filter(item => utils.parseDate(item.formReviewStartDate).getFullYear() == year - 1);
    const compInfoNav = user.empInfo.compInfoNav;
    const compInfo = utils.getCurrentRecord(compInfoNav, utils.startDateComparator, toDate);
    const salaryIncrease = utils.getSalaryIncrease(compInfoNav, payCompsByGroup, payComponentGroup, convert, locale);
    const rangePenetration = (compInfo && compInfo.empCompensationCalculatedNav) ? parseFloat(compInfo.empCompensationCalculatedNav.rangePenetration) : null;

    return teamPerformances.map((teamPerformance) => {
        teamPerformance.self = null;

        switch (teamPerformance.information) {
            case "tabTeamPerfAvgCurrPerf":
                teamPerformance.self = (currentFormHeaders[0] ? parseFloat(currentFormHeaders[0].rating) : null);
                break;
            case "tabTeamPerfAvgLastPerf":
                teamPerformance.self = (lastYearFormHeaders[0] ? parseFloat(lastYearFormHeaders[0].rating) : null);
                break;
            case "tabTeamPerfAvgLastSalInc":
                teamPerformance.self = salaryIncrease;
                break;
            case "tabTeamPerfBaseSalPen":
                teamPerformance.self = rangePenetration;
                break;
        }

        return teamPerformance;
    });
}