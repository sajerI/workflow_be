using { pwc.psc.ecs.workflow as wf } from '../db/schema';
@path : 'service/common'
service CommonService {

    @readonly
    entity LegalEntity {
        key externalCode : String;
        key name    : String;
    }

    @readonly
    entity Countries {
        key code : String;
        key name    : String;
    }

    @readonly
    entity EmployeeClass {
        key code : String;
        key name    : String;
    }

    @readonly
    entity Languages {
        key code : String;
        key name    : String;
    }

    @readonly
    entity Users {
        key userId    : String;
            username  : String;
            firstName : String;
            lastName  : String;
            email     : String
    }
    @readonly
    entity Roles {
        key userId : String;
        username : String;
        email: String;
        lang : String;
        pwcAdmin : Boolean;
        appAdmin: Boolean;
        adminHR : Boolean;
        approver : Boolean;
    }

    
    entity Export {   
        excelBase64: LargeString
    }

    /*
            key userId: String;
        key seqNumber: String;
        key itemName: String;
            firstName: String;
            lastName: String;
            hiringDate: String;
            lastNameMan: String;
            firstNameMan: String;
            extCodeLegEnt: String;
            legalEntity: String;
            empClass: String;
            countryCd: String;
            noteAdmin: String;
            statusApprover:String;
            assignedTo:String;
            processedBy: String

    */

    entity EmailTemplates as projection on wf.EmailTemplate;
    function sendEmail (to : String, emailId:String,userId:String,seqNumber:String,itemName:String) returns String;

    action sendRemindersToApprovers(); //Scheduled jobs sening the reminders to respective people
    action sendRemindersToHRadmin() //Scheduled jobs sening the reminders to respective people

}
