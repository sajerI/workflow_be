const server = require("./server");

const fnNavProp = server.fnNavProp;
const fnProp = server.fnProp;

const cds = require('@sap/cds')

var that = this
module.exports = {
    parseDate: (timestamp) => {
        return eval('new ' + timestamp.replace(/\//g, ''));
    },

    formatDate: (date) => {
        return (date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0"));
    },

    yearsFromToday: (date) => {
        return new Date(new Date() - date).getFullYear() - 1970;
    },

    formatJSONDate: (date) => {
        const dateString = date;
        const timestamp = parseInt(dateString.substring(6, 19)); // extract timestamp from the string
        const dateObject = new Date(timestamp); // create a new Date object from the timestamp
        const year = dateObject.getFullYear();
        const month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
        const day = dateObject.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`; // format the date as yyyy-mm-dd
        return formattedDate
    },


    parseFilters: (where) => {
        const filters = where.filter(obj => typeof (obj) !== "string").map(obj => {
            if (obj.ref) obj.ref = obj.ref[0]
            return obj;
        });
        //return filters
        let lastProp = undefined;
        let aFilterFormatted = filters.map(filter => {
            let results = {}
            if (filter.ref) {
                lastProp = filter.ref;
                //results[filter.ref] = null;
            }
            if (filter.val && lastProp) {
                results[lastProp] = filter.val;
                //lastProp = undefined;
                return results;
            }
        })

        return aFilterFormatted.filter(obj => obj != undefined)
    },


    parseSorts: (orderBy, includeFKs) => {
        return orderBy.reduce((results, orderPart) => {
            results.push({
                property: orderPart.ref[0],
                direction: orderPart.sort
            });
            if (!includeFKs) results = results.filter(result => !result.property.includes("_"));
            return results;
        }, []);
    },
    getLastDayOfMonth: () => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const year = lastDay.getFullYear();
        const month = String(lastDay.getMonth() + 1).padStart(2, '0');
        const day = String(lastDay.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;

    },

    getStartOfMonth: () => {
        const oDate = new Date();
        /*
        //const skeyYear = okeyYear.toString()+"-" + '01-01'
        const firstDayOfMonth = new Date(oDate.getFullYear(), oDate.getMonth(), 1);
        const sFirstDayOfMonth = firstDayOfMonth.toString()
        */
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // add 1 to get 1-indexed month
        const sfirstDayOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`
        return sfirstDayOfMonth
    },

    getStartOfYear: () => {
        const okeyYear = new Date().getFullYear();
        const skeyYear = okeyYear.toString() + "-" + '01-01'
        return skeyYear

    },
    getPersonalInfoURL: ((userId) => {
        let year = module.exports.getStartOfYear()
        //let sFirstDayOfMonth = module.exports.getStartOfMonth()
        let sUserInfo = "/PerPersonal?fromDate=" + year + "&$select=personIdExternal,firstName,lastName"
        //let EmpInfo = undefined;
        return sUserInfo
    }),
    getManagerInfoURL: ((newEmp, aRules, sSelectedEntity, sParentPosition, sRelatedPosition) => {
        let oProgram
        oProgram = module.exports.getResponsibleType(newEmp, aRules, sSelectedEntity)
        if (typeof oProgram == 'undefined') {
            oProgram = {
                responsibleType: 'Manager'
            }
        }
        //let oEntity = await db.run(SELECT.one.from(RulesDefault).where`id = ${ruleId} and lang = ${slang}`)
        let sPositionId
        if (oProgram.responsibleType === 'HRBusinessPartner') {
            sPositionId = sRelatedPosition
        } else {
            sPositionId = sParentPosition

        }

        //let sURL = "/EmpJob?$filter=position eq '" + sPositionId + "'&$expand=userNav&$select=userNav/userId"
        let sURL = "/EmpJob?$filter=position eq '" + sPositionId + "'&$expand=employmentNav&$select=employmentNav/personIdExternal"
        return sURL

    }),

    assignMissingPersonalData: ((aEntriesEmp, aEmpInfo) => {
        //aEntriesEmp.some(item => aEmpInfo)
        for (var i = 0; i < aEntriesEmp.length; i++) {
            const sEmpUser = aEntriesEmp[i].userId
            for (let j = 0; j < aEmpInfo.data.length; j++) {
                let sEmpInfoPerPerson = aEmpInfo.data[j].personIdExternal;
                if (sEmpUser == sEmpInfoPerPerson) {
                    aEntriesEmp[i].firstName = aEmpInfo.data[j].firstName;
                    aEntriesEmp[i].lastName = aEmpInfo.data[j].lastName
                    continue
                }
            }
            /*
            if (kind == 'User') {
                for (let j = 0; j < aEmpInfo.data.length; j++) {
                    let sEmpInfoPerPerson = aEmpInfo.data[j].personIdExternal;
                    if (sEmpUser == sEmpInfoPerPerson) {
                        aEntriesEmp[i].firstName = aEmpInfo.data[j].firstName;
                        aEntriesEmp[i].lastName = aEmpInfo.data[j].lastName
                        continue
                    }
                }

            } else {
                for (let j = 0; j < aEmpInfo.data.length; j++) {
                    let sEmpInfoPerPerson = aEmpInfo.data[j].personIdExternal;
                    if (sEmpManager == sEmpInfoPerPerson) {
                        aEntriesEmp[i].firstNameMan = aEmpInfo.data[j].firstName;
                        aEntriesEmp[i].lastNameMan = aEmpInfo.data[j].lastName
                    }
                }
            }
            */
        }
    }),


    assignMissingPersonalDataManager: ((aEntriesEmp, aEmpInfo) => {
        //aEntriesEmp.some(item => aEmpInfo)
        for (var i = 0; i < aEntriesEmp.length; i++) {
            const sEmpManager = aEntriesEmp[i].hiringManager
            for (let j = 0; j < aEmpInfo.data.length; j++) {
                let sEmpInfoPerPerson = aEmpInfo.data[j].personIdExternal;
                if (sEmpManager == sEmpInfoPerPerson) {
                    aEntriesEmp[i].firstNameMan = aEmpInfo.data[j].firstName;
                    aEntriesEmp[i].lastNameMan = aEmpInfo.data[j].lastName
                }
            }
        }
    }),


    findNewEntriesOnly: ((a1, a2) => {
        const result = [];

        // Loop through each object in a1 array
        for (let i = 0; i < a1.length; i++) {
            let found = false;

            // Check if the userid from a1 exists in a2 array
            for (let j = 0; j < a2.length; j++) {
                if (a1[i].userId === a2[j].userId) {
                    found = true;
                    break;
                }
            }

            // If the userid from a1 does not exist in a2, add it to the result array
            if (!found) {
                result.push(a1[i]);
            }
        }

        return result;
    }),

    getResponsibleType: (oEmployee, aRules, sEntity) => {
        let keyValue
        switch (sEntity) {
            case "Legal Entity":
                keyValue = "extCodeLegEnt"
                break;
            case "Country":
                keyValue = 'countryCd'
                break;
            case "Employee Class":
                keyValue = 'empClass'
            default:
                break;
        }

        for (const rule of aRules) {
            //const keyValue = "extCodeLegEnt"
            //var test = entry[keyValue]
            if (rule.values.includes(oEmployee[keyValue])) {
                return rule

            }
        }

        /*
        let oObject =  aRules.find(rule => {
            rule.values.includes(oEmployee[keyValue])
        })
        console.log(oObject)
        */
    },

    createEmpOverview: function (aEntries, aRules, sEntity) {

        let keyValue
        switch (sEntity) {
            case "Legal Entity":
                keyValue = "extCodeLegEnt"
                break;
            case "Country":
                keyValue = 'countryCd'
                break;
            case "Employee Class":
                keyValue = 'empClass'
            default:
                break;
        }
        const newArray = [];
        for (const entry of aEntries) {
            let userId = entry.userId
            let seqNumber = entry.seqNumber
            for (const rule of aRules) {
                //const keyValue = "extCodeLegEnt"
                //var test = entry[keyValue]
                if (rule.values.includes(entry[keyValue])) {
                    const oEmployeeRules = {
                        userId: userId,
                        seqNumber: seqNumber,
                        itemName: rule.name,
                        statusHRAdmin: 'NEW',
                        statusApprover: "",
                        assignedTo: rule.assignedTo,
                        processedBy: '',
                        noteApprover: '',
                        approverType: rule.approverType,
                        groupName: rule.groupName,
                        defaultPrgId: rule.id,
                        noteAdmin: ''
                    };
                    newArray.push(oEmployeeRules);
                }
            }
        }
        return newArray;
    },

    replaceVariables: (sHTML, firstNameReceiver, lastNameReceiver, firstNameHired, lastNameHired, userId, seqNumber, itemName) => {
        const placeholders = [
            { placeholder: /\[FirstName\]/g, value: firstNameReceiver },
            { placeholder: /\[LastName\]/g, value: lastNameReceiver },
            { placeholder: /\[FirstNameUser\]/g, value: firstNameHired },
            { placeholder: /\[LastNameUser\]/g, value: lastNameHired },
            { placeholder: /UserId/g, value: userId },
            { placeholder: /SeqNumber/g, value: seqNumber },
            { placeholder: /ItemName/g, value: itemName },
            //{ placeholder: /www.google.com/g, value: sURL }
        ];

        let result = sHTML;
        placeholders.forEach(({ placeholder, value }) => {
            result = result.replace(placeholder, value);
        });

        return result;
    },

    createComparator: (sorts) => {
        const sortsCopy = JSON.parse(JSON.stringify(sorts));
        if (sortsCopy.length === 0) {
            //console.log(module.exports.i++ + "with result: 0")
            return (item1, item2) => 0;
        }
        const { property, direction } = sortsCopy.shift();
        return (item1, item2) => {
            //console.log(module.exports.i++ + "sorting: " + JSON.stringify(item1) + " AND " + JSON.stringify(item2))
            //console.log(module.exports.i++ + "by: " + property + "/" + direction)
            if (item1[property] < item2[property]) {
                //console.log(module.exports.i++ + "with result: " + (direction == "asc" ? -1 : 1))
                return (direction == "asc" ? -1 : 1);
            }
            if (item1[property] > item2[property]) {
                //console.log(module.exports.i++ + "with result: " + (direction == "asc" ? 1 : -1))
                return (direction == "asc" ? 1 : -1);
            }
            return module.exports.createComparator(sortsCopy)(item1, item2);
        }
    },

    orderWith: (items, comparator) => {
        return items.sort(comparator);
    },
    createNewEmp: (newEmp) => {
        let sManagerID, sHRBPID
        let oInsertEmp = {}
        oInsertEmp.firstNameMan = ""
        oInsertEmp.lastNameMan = ""
        oInsertEmp.userId = newEmp.userId
        oInsertEmp.seqNumber = newEmp.seqNumber
        oInsertEmp.firstName = ""
        oInsertEmp.lastName = ""
        oInsertEmp.seqNumber = newEmp.seqNumber
        oInsertEmp.extCodeLegEnt = newEmp.companyNav.externalCode
        oInsertEmp.legalEntity = newEmp.companyNav.name
        oInsertEmp.countryCd = ''   //will be implemented later
        oInsertEmp.empClass = ''    //will be implemented later
        oInsertEmp.hiringDate = module.exports.formatJSONDate(newEmp.startDate)
        oInsertEmp.hiringManager = newEmp.managerId
        oInsertEmp.hiringAdmin = '' //HIRING ADMIM DEFINITION IS DONE IN '$01' in a employee.js function
        oInsertEmp.status = 'NEW'
        oInsertEmp.personIdExternal = newEmp.employmentNav.personIdExternal
        oInsertEmp.positionCd = newEmp.position
        oInsertEmp.positionNav = newEmp.positionNav
        return oInsertEmp
    },

    fkMapper: (fkPrefix, keys) => {
        return oRecord => {
            for (const [key, value] of Object.entries(keys)) {
                oRecord[fkPrefix + "_" + key] = value;
            }
            return oRecord;
        };
    },

    /*

    startDateComparator: (record1, record2) => {
        if (module.exports.parseDate(record1.startDate) < module.exports.parseDate(record2.startDate)) return -1;
        if (module.exports.parseDate(record1.startDate) > module.exports.parseDate(record2.startDate)) return 1;
        if (module.exports.parseDate(record1.startDate) == module.exports.parseDate(record2.startDate)) return 0;
    },

    startDateSeqNumComparator: (record1, record2) => {
        if (module.exports.parseDate(record1.startDate) < module.exports.parseDate(record2.startDate)) return -1;
        if (module.exports.parseDate(record1.startDate) > module.exports.parseDate(record2.startDate)) return 1;
        if (module.exports.parseDate(record1.startDate) == module.exports.parseDate(record2.startDate)) {
            if (record1.seqNumber < record2.seqNumber) return -1;
            if (record1.seqNumber > record2.seqNumber) return 1;
            return 0;
        }
    },

    getCurrentRecord: (records, comparator, toDate) => {
        const sortedRecords = records.sort(comparator).reverse();
        const keyDate = new Date(...toDate.split("-").map((part, index) => {
            if (index === 1) return parseInt(part) - 1;
            return parseInt(part);
        }));

        return sortedRecords.reduce((result, record) => {
            if (!result.assigned && keyDate >= module.exports.parseDate(record.startDate) && keyDate <= module.exports.parseDate(record.endDate)) {
                result.result = record;
                result.assigned = true;
            }
            return result;
        }, {
            result: null,
            assigned: false
        }).result;
    }

    */
};