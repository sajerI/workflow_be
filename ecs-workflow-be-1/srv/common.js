const utils = require("./utils");
const server = require("./server");
const nodemailer = require('nodemailer');
const { default: axios } = require("axios");

module.exports = {
    readLegalEntityList: async (axios, request) => {
        /*         const { year, entireYear } = request.params[0];
        
                const where = request.query.SELECT.where;
        
                //const url = "/FOCompany?asOfDate=" + toDate;
                */
        const url = "/FOCompany";
        const legalEntityResponse = await axios.get(url);

        return legalEntityResponse.data.filter(entity => entity.status == "A").sort((c1, c2) => {
            if (c1.name < c2.name) return -1;
            if (c1.name > c2.name) return 1;
            return 0;
        });
    },

    //readUsersList
    readUsersList: async (axios, request) => {
        /*         const { year, entireYear } = request.params[0];
        
                const where = request.query.SELECT.where;
                */
        const url = "/User?$filter=status in 't','T','e'&$select=userId,firstName,lastName";
        const userResponse = await axios.get(url);

        return userResponse.data.sort((c1, c2) => {
            if (c1.lastName < c2.lastName) return -1;
            if (c1.lastName > c2.lastName) return 1;
            return 0;
        }).filter(entity =>   //filtering only for test purpose
            entity.userId == 'pwcadminIS' ||
            entity.userId == 'pwcadminDUK' ||
            entity.userId == 'pwcadminMJA' ||
            entity.userId == 'pwcadminAE' ||
            entity.userId == 'pwcadminPTS' ||
            entity.userId == 'pwcadminPTS' ||
            entity.userId == 'pwcadminJH' ||
            entity.userId == 'pwcadminPF' ||
            entity.userId == 'pwcadminEH' ||
            entity.userId == 'pwcadminTK' ||
            entity.userId == 'pwcadminRK' ||
            entity.userId == 'pwcadminJHO' ||
            entity.userId == 'pwcadminPE');
        //aFilter = newHiredEmp.data.filter(entity => entity.createdBy == 'pwcadminIS' || entity.createdBy == 'pwcadminDUK' || entity.createdBy == 'pwcadminMJA') //only for test purposes in T2 instance

    },
    readLanguages: async (axios, request) => {
        const url = "/Picklist('language')?$expand=picklistOptions,picklistOptions/picklistLabels&$filter=picklistOptions/status eq 'ACTIVE'&$format=json"
        const languages = await axios.get(url)
        await languages.data.picklistOptions.sort((c1, c2) => {
            if (c1.externalCode < c2.externalCode) return -1;
            if (c1.externalCode > c2.externalCode) return 1;
            return 0;
        });

        return aLanguages = languages.data.picklistOptions.map(language => {
            let oResult = {
                code: language.externalCode,
                name: ''

            }
            let oLabel = language.picklistLabels.find((element) => element.optionId === language.id);
            oResult.name = oLabel != undefined ? oLabel.label : ''

            return oResult
        })

    },

    readCountries: async (axios, request) => {
        const url = "/Country?$filter=status eq 'A'&$format=json"
        const countries = await axios.get(url)
        return countries.data.sort((c1, c2) => {
            if (c1.externalName_localized < c2.externalName_localized) return -1;
            if (c1.externalName_localized > c2.externalName_localized) return 1;
            return 0;
        }).map(country => {
            let oResult = {
                code: country.code,
                name: country.externalName_localized
            }
            return oResult
        });
    },
    sendEmail: async (to, emailId, userId, seqNumber, itemName, axios) => {
        const db = await cds.connect.to("db")
        const { EmailTemplate, Employees } = db.entities("pwc.psc.ecs.workflow")

        const url = "/User('" + to + "')?$select=email,firstName,lastName,defaultLocale";
        const userResponse = await axios.get(url);
        if (typeof userResponse == 'undefined') {
            return
        }
        const sReceiver = userResponse.data.email
        let parts = userResponse.data.defaultLocale.split("_")
        const slang = parts[0]

        let oEntity = await db.run(SELECT.one.from(EmailTemplate).where`ID = ${emailId} and lang = ${slang}`)
        if (typeof oEntity == 'undefined') {
            oEntity = await db.run(SELECT.one.from(EmailTemplate).where`ID = ${emailId} and lang = 'en'`)
        }

        //let oUserDetails = await db.run(SELECT.one.from(Employees).where`userId = ${userId} and seqNumber = ${seqNumber}`)

        let oUserDetails = await db.run(SELECT.one.from(Employees).where`userId = ${userId} and seqNumber = ${seqNumber}`)

        if (oUserDetails == null) {
            return
        }

        sSubject = oEntity.subject
            sHTML = await utils.replaceVariables(oEntity.longHTMLText, userResponse.data.firstName, userResponse.data.lastName,
                oUserDetails.firstName, oUserDetails.lastName, userId, seqNumber, itemName)

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            //service: 'gmail',
            auth: {
                user: 'workflowteam7@gmail.com',
                pass: 'vxrgopajactunzfw'//'gmeylnkpgdajysgj'//'Spr!ng23'
            }
        });

        let mailOptions = {
            from: 'workflowteam7@gmail.com',
            to: sReceiver,
            subject: sSubject,
            //text: 'text'
            html: sHTML
        };
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent', info.messageId)

    },
    
    sendRemindersToApprovers: async () => {
        //const cron = require('node-cron');
        const axios = server.axios;
        const aInClauseParams = ['DONE', 'REJECTED'];
        const db = await cds.connect.to("db")
        const currentDate = new Date();
        const { EmployeeView } = db.entities("pwc.psc.ecs.workflow")
        const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in one day
        let differenceinMS, differenceinDays, roundedDays


        try {
            const aItems = await db.run(
                SELECT.from(EmployeeView).where`statusApprover NOT IN ${aInClauseParams}`
            );
            for (const item of aItems) {
                let hiringDateToDate = new Date(item.hiringDate)

                differenceinMS = hiringDateToDate - currentDate
                differenceinDays = differenceinMS / oneDay
                roundedDays = Math.round(differenceinDays)
                
                if (roundedDays === 3 || roundedDays === 7) {   //send email notification when 3 or 7 days are remaining betweehn the hire date
                    module.exports.sendEmail(item.processedBy, '5', item.userId, item.seqNumber, item.itemName, axios)
                }
                
            }

        } catch (error) {
            console.error('Error executing email reminder job:', error);
        }
    },

    sendRemindersToHRadmin: async () => {
        //const cron = require('node-cron');
        const axios = server.axios;
        const aInClauseParams = ['DONE'];
        const db = await cds.connect.to("db")
        const currentDate = new Date();
        const { EmployeeView } = db.entities("pwc.psc.ecs.workflow")
        const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in one day
        let differenceinMS, differenceinDays, roundedDays


        try {
            const aItems = await db.run(
                SELECT.from(EmployeeView).where`statusHRAdmin NOT IN ${aInClauseParams}`
            );
            for (const item of aItems) {
                let hiringDateToDate = new Date(item.hiringDate)

                differenceinMS = hiringDateToDate - currentDate
                differenceinDays = differenceinMS / oneDay
                roundedDays = Math.round(differenceinDays)
                
                if (roundedDays === 3 || roundedDays === 7) {   //send email notification when 3 or 7 days are remaining betweehn the hire date
                    module.exports.sendEmail(item.hiringAdmin, '6', item.userId, item.seqNumber, item.itemName, axios)
                }
                
            }

        } catch (error) {
            console.error('Error executing email reminder job:', error);
        }
    },

    exportAllItems: async (request,res) => {
        //body
        const db = await cds.connect.to("db")
        const { EmployeeView } = db.entities("pwc.psc.ecs.workflow")
        const excel = require('exceljs');
        const stream = require('stream');
        const workbook = new excel.Workbook()
        const worksheet = workbook.addWorksheet('Employees');

        try {
            //aItems = await db.run(SELECT.from(EmployeeView).where`assignedTo LIKE ${'%' + personIdExternal + '%'} AND statusApprover IN ${aInClauseParams}`) //Find items for logged user
            var aItems = await db.run(
                SELECT.from(EmployeeView)
            );
            //return aItems
        } catch (error) {
            console.error(err);
        }

        worksheet.columns = [
            { header: 'userId', key: 'userId' },
            { header: 'seqNumber', key: 'seqNumber' },
            { header: 'itemName', key: 'itemName' },
            { header: 'firstName', key: 'firstName' },
            { header: 'lastName', key: 'lastName' },
            { header: 'hiringDate', key: 'hiringDate' },
            { header: 'lastNameMan', key: 'lastNameMan' },
            { header: 'firstNameMan', key: 'firstNameMan' },
            { header: 'extCodeLegEnt', key: 'extCodeLegEnt' },
            { header: 'legalEntity', key: 'legalEntity' },
            { header: 'empClass', key: 'empClass' },
            { header: 'countryCd', key: 'countryCd' },
            { header: 'noteAdmin', key: 'noteAdmin' },
            { header: 'statusApprover', key: 'statusApprover' },
            { header: 'assignedTo', key: 'assignedTo' },
            { header: 'processedBy', key: 'processedBy' },
            // Add more headers as needed
          ];

          aItems.forEach((employee) => {
            worksheet.addRow({ userId: employee.userId, 
                               seqNumber: employee.seqNumber,
                               seqNumber: employee.seqNumber, 
                               firstName: employee.firstName, 
                               lastName: employee.lastName, 
                               hiringDate: employee.hiringDate, 
                               lastNameMan: employee.lastNameMan, 
                               firstNameMan: employee.firstNameMan, 
                               extCodeLegEnt: employee.extCodeLegEnt,
                               legalEntity: employee.legalEntity,  
                               empClass: employee.empClass,  
                               countryCd: employee.countryCd,
                               noteAdmin: employee.noteAdmin, 
                               statusApprover: employee.statusApprover, 
                               assignedTo: employee.assignedTo, 
                               processedBy: employee.processedBy                     
                            });
            // Add more rows with relevant data
          });
          
          const response = await workbook.xlsx.writeBuffer();
          const excelBase64 = response.toString('base64');
          return { excelBase64 };

    }
};
