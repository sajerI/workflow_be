using {managed} from '@sap/cds/common';

namespace pwc.psc.ecs.workflow;

//Global setting for PwC admin
type AdminType : String enum {
    HRBusinessPartner;
    Manager;
}

entity TechnicalParams : managed {
    key parName : String;
        value1  : String;
        value2  : String;
        value3  : String;
        value4  : String;
        value5  : String;
}

entity EmailTemplate {
    key ID           : String;
    key lang         : String;
        name         : String;
        shortDesc    : String;
        subject      : String;
        longHTMLText : String
}

entity Config : managed {
    key ID             : UUID @(Core.Computed : true);
        //sfInstance : String @assert.format : '^(|https?:\/\/[A-Za-z0-9\-_~]+\.(successfactors\.eu|sapsf\.eu|successfactors\.com|sapsf\.com|sapsf\.cn)\/?)$';
        selectedEntity : String;
}

//Default settings of rules
type Assignment : String enum {
    Group;
    Person;
}

type HRStatusDetail : String enum {
    NEW;
    SUBMITTED;
    REJECTED
}

type ApproverStatus : String enum {
    NEW; //RULE submitted by HR/Manager and sent to approver
    PROCESSING; // Someone from the assigned people start processing this item
    DONE; // Itim is ready
    REJECTED //Iitem rejected by Approver, notification email sent to HR person
}

type HRStatusOverall : String enum {
    NEW;
    IN_PROGRESS; 
    DONE; 
}

entity RulesDefault : managed {
    key id                : String @title : 'Program ID'; //> Readable key
        //legalEntities: Composition of many Rules_LegalEnt on legalEntities.parent=$self;
        values            : String; //There could be multiple values selected on the front end, values are separated by a comma(e.g. CZE,GER,DEN)
        responsibleType   : AdminType;
        responsiblePerson : String; // person responsible for items assignment
        groups            : Composition of many Groups
                                on groups.parent = $self;
        items             : Composition of many Rules_Items
                                on items.parent = $self;
//assignedTo: Composition of many Rules_AssignedTo on assignedTo.parent=$self;
}

entity Rules_Items {
        //key id: Association to RulesDefault;
    key parent       : Association to RulesDefault;
    key name         : String;
        approverType : Assignment;
        groupName    : String;
        assignedTo   : String
}

//Groups defined in Admin view
entity Groups {
    key parent : Association to RulesDefault;
    key id     : UUID;
    key name   : String;
        //assignedTo: Association to many PeoplePool
        values : String //list of userIDs
}

/*
entity PeoplePool {
    key id        : Association to Groups;
    key userId    : String;
        firstName : String;
        lastName  : String
}
*/


// The view is created and then read inside fetchNewHired method
view RulesComposition as
    select from RulesDefault {
        id,
        RulesDefault.values,
        responsibleType,
        responsiblePerson,
        items.name,
        items.approverType,
        items.groupName,
        items.assignedTo,
    };


//List of employees visible in Admin View
entity Employees : managed {
    key userId           : String;
    key seqNumber        : String;
        //codeLegal: String;
        legalEntity      : String;
        firstName        : String;
        lastName         : String;
        firstNameMan     : String;
        lastNameMan      : String;
        hiringManager    : String; //This is a manager of the employee
        hiringAdmin      : String; //This is a person responsible for item assignment
        hiringDate       : String; //Date saved as string in form of yyy-mm-dd
        extCodeLegEnt    : String;
        countryCd        : String;
        empClass         : String;
        status           : HRStatusOverall; //Overall status for all items related to new hired employee - NEW/IN PROGRESS/DONE 
        personIdExternal : String;
        positionCd       : String;


}

/*
Items assigned to particular employee. We need to have two entities for rules -
one for default RulesDef  and this one because Manager/HR Business Partner can add new values for particular user
*/
entity EmployeeDetails : managed {
    key userId         : String;
    key seqNumber      : String;
    key itemName       : String;
        statusHRAdmin  : HRStatusDetail; //values  NEW, SUBMITTED, REJECTED
        //rejectedByAdmin: Boolean default false;
        statusApprover : ApproverStatus;
        assignedTo     : String; //Item is assigned to person or the group of people
        processedBy    : String; // There is one approver who is currently working on the rule
        noteApprover   : String;
        approverType   : String; //Is the item assigned to person or group?
        groupName      : String;
        defaultPrgId   : String;
        noteAdmin      : String;
//employee: Association to Employees
}

view EmployeeView as
    select from Employees
    inner join EmployeeDetails
        on  Employees.userId    = EmployeeDetails.userId
        and Employees.seqNumber = EmployeeDetails.seqNumber
    {
        key EmployeeDetails.userId,
        key EmployeeDetails.seqNumber,
        key EmployeeDetails.itemName,
            Employees.firstName,
            Employees.lastName,
            Employees.hiringDate,
            Employees.lastNameMan,
            Employees.firstNameMan,
            Employees.extCodeLegEnt,
            Employees.legalEntity,
            Employees.empClass,
            Employees.countryCd,
            Employees.hiringAdmin,
            EmployeeDetails.noteAdmin,
            EmployeeDetails.statusHRAdmin,
            EmployeeDetails.statusApprover,
            EmployeeDetails.assignedTo,
            EmployeeDetails.processedBy
    };
    /*
    where
    EmployeeDetails.statusApprover <> '';
    */
        
