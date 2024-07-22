const { axios } = require("./server");
const utils = require("./utils");
const cds = require('@sap/cds')

//const { Rules } = cds.entities ('sap.capire.bookshop')

module.exports = {
    fetchNewHired: async (axios, request) => {
        const db = await cds.connect.to("db")
        const { Employees, RulesComposition, Config } = db.entities("pwc.psc.ecs.workflow")
        console.log(Employees)

        let aFilter = []
        const sSelect = "userId,seqNumber,employmentNav/personIdExternal,createdBy,jobTitle,createdOn,company,jobCode,managerId,position,positionNav/externalName_localized,positionNav/parentPosition/code,positionNav/positionMatrixRelationship/relatedPosition,startDate,event,eventReason,companyNav/externalCode,companyNav/name,departmentNav/description"
        const sExpand = 'companyNav,departmentNav,userNav,positionNav,positionNav/parentPosition,positionNav/positionMatrixRelationship,employmentNav'
        const sOrderBy = 'createdOn Desc'
        /* NOTE */
        /*THERE IS AN ERROR IN SAP SUCCESS FACTORS MAPPING BETWEEN ONBOARDING AND EC => When user is create with status NEW hired in Onboarding there is an error with mapping on EC side and
        value on EmpJob is Rehired
        61255 = New Hired, Rehired = 61258.*/

        const sFilter = "event in '61255','61258' and startDate gt '" + utils.getLastDayOfMonth() + "'"

        const url = "/EmpJob?fromDate=" + utils.getLastDayOfMonth() + "&$select=" + sSelect + "&$orderBy=" + sOrderBy + "&$expand=" + sExpand + "&$filter=" + sFilter
        const newHiredEmp = await axios.get(url);  //get new Hired from SF

        //Filter Values
        //aFilter = newHiredEmp.data.filter(entity => entity.createdBy == 'pwcadminIS' || entity.createdBy == 'pwcadminDUK' || entity.createdBy == 'pwcadminMJA' || entity.createdBy == 'pwcadminBVM') //only for test purposes in T2 instance
        let aEmployee = await SELECT.distinct`userId`.from(Employees)// .where('userId=',element.userId)
        aNewEntries = await utils.findNewEntriesOnly(newHiredEmp.data, aEmployee);

        //var test = utils.getPersonalInfoURL()
        var aEmpInfo = await axios.get(utils.getPersonalInfoURL());

        let oEntity = await db.run(SELECT.one.from(Config).orderBy`createdAt desc`)
        if (oEntity) {
            var sSelectedEntity = oEntity.selectedEntity
        } else {
            var error = new Error("You cannot run this application if global settings are not defined by PwC admin");
            error.statusCode = 400; // Set an appropriate status code for the error
            return Promise.reject(error); 
            //"You cannot run this application if global settings is not defined"
        }

        let aRules = await db.run(SELECT.distinct.from(RulesComposition)) //.where(`legalEntity=`,element.name)

        let aEntriesEmp = aNewEntries.map(utils.createNewEmp)

        /***   START  $01   Definition of the HRBP/Manager for item assighment  */
        const promises = [];
        for (const oEntriesEmp of aEntriesEmp) {
            if (oEntriesEmp.positionCd != null) {
                const sParentPosition = oEntriesEmp.positionNav.parentPosition.code;
                const sRelatedPosition = oEntriesEmp.positionNav.positionMatrixRelationship[0].relatedPosition;
                const sURL = utils.getManagerInfoURL(oEntriesEmp, aRules, sSelectedEntity, sParentPosition, sRelatedPosition);
                const promise = axios.get(sURL).then(response => {
                    //oEntriesEmp.hiringAdmin = response.data[0].userNav.userId;
                    oEntriesEmp.hiringAdmin = response.data[0].employmentNav.personIdExternal;
                }).catch(error => {
                    console.error(error);
                });
                promises.push(promise);

            } else {
                oEntriesEmp.hiringAdmin = oEntriesEmp.hiringManager;
            }
        }
        await Promise.all(promises);
        console.log(aEntriesEmp);
        /***   END  $01   Definition of the HRBP/Manager in  */

        //clear data before inserting into DB
        aEntriesEmp.forEach(oEntriesEmp => {
            delete oEntriesEmp.positionNav;
        });

        if (aEntriesEmp.length > 0) {
            await utils.assignMissingPersonalData(aEntriesEmp, aEmpInfo)
            await utils.assignMissingPersonalDataManager(aEntriesEmp, aEmpInfo)  //manager
            try {
                const insertServicesResult = await db.run(INSERT.into(`Employees`).entries(aEntriesEmp))
            } catch (error) {
                console.log(error)
            }

            let aRulesToInsert = await utils.createEmpOverview(aEntriesEmp, aRules, sSelectedEntity)  //prepare data for insert Into EmployeeRules table
            if (aRulesToInsert.length > 0) {
                try {
                    await db.run(INSERT.into(`EmployeeDetails`).entries(aRulesToInsert))
                } catch (error) {
                    console.log(error)
                }
            }
        }
    },
    getEmployeesForApprover: async (axios, request) => {
        const db = await cds.connect.to("db")
        const { EmployeeView } = db.entities("pwc.psc.ecs.workflow")
        const sLoggedUser = request.user.id
        const filterURI = request.query.SELECT.where 
        const orderbyURI = request.query.SELECT.orderBy 
        //const reqKeys = request.data   
        let resultFilter

        const searchUrl = "/UserAccount?$select=personIdExternal,username,email,defaultLocale";
        const userAccountsResponse = await axios.get(searchUrl);
        let username, personIdExternal, defaultLocale
        const userAccounts = userAccountsResponse.data.filter(userAccount => userAccount.email == sLoggedUser);
        personIdExternal = userAccounts.length > 0 ? userAccounts[0].personIdExternal : null;

        resultFilter = utils.parseFilters(filterURI)
        const aInClauseParams = resultFilter.map(val => val.statusApprover)
        const sOrderBy = 'userId'

        try {
            //aItems = await db.run(SELECT.from(EmployeeView).where`assignedTo LIKE ${'%' + personIdExternal + '%'} AND statusApprover IN ${aInClauseParams}`) //Find items for logged user
            var aItems = await db.run(
                SELECT.from(EmployeeView)
                    .where`assignedTo LIKE ${'%' + personIdExternal + '%'} AND statusApprover IN ${aInClauseParams}`
                    .orderBy(orderbyURI)  //orderbyURI   //{ [sOrderBy]: 'desc' }
            );
            //return aItems
        } catch (error) {
            console.error(err);
        }

        aItems.forEach(item => {
            if (item.processedBy != '' && item.processedBy != personIdExternal) { // If the item is already in a process,  display it to user who is processing it only
                item.userId = 'DEL'
            }
        })

        const aResult = aItems.filter(item => item.userId != 'DEL')
        return aResult       
    },
    
    checkHRadminStaus: async (axios,request) => {
        const db = await cds.connect.to("db")
        const { EmployeeDetails, Employees} = db.entities("pwc.psc.ecs.workflow")
        let userId,seqNumber
        let aInClauseParams = ['NEW']
        let sStatus = 'NEW'

        userId = request.userId
        seqNumber = request.seqNumber

        try {
            let count = await db.run(SELECT.one.from(EmployeeDetails).where`userId = ${userId} and seqNumber = ${seqNumber} and statusHRAdmin = ${sStatus}`)

            if (count === null) {
                try {
                    await db.run(
                        UPDATE(Employees)
                          .set({ status: 'DONE' })
                          .where({ userId: userId, seqNumber: seqNumber })
                      );
                    
                } catch (error) {
                    console.log("Error when udpating status in EMployees table",error)
                }
                
            } else {
                try {
                    await db.run(
                        UPDATE(Employees)
                          .set({ status: 'IN_PROGRESS' })
                          .where({ userId: userId, seqNumber: seqNumber })
                      );
                    //await db.run(INSERT.into(`EmployeeDetails`).entries(aRulesToInsert))
                    
                } catch (error) {
                    console.log("Error when udpating status in EMployees table",error)
                    
                }
                
            }
            
        } catch (error) {
            console.log(error)
        }
    }
};