using {pwc.psc.ecs.workflow as wf} from '../db/schema';
@path     : 'service/employee'
@requires : 'authenticated-user'

service EmployeeService {
    @cds.query.limit : {max : 30} //retur max 30 employee in a single call
    entity Employees        as projection on wf.Employees;
    entity EmpOverview      as projection on wf.EmployeeDetails;
    @cds.query.limit : {max : 30} //retur max 30 employee in a single call
    //entity ApproverItems as projection on wf.EmployeeView;
    entity EmployeesHistory as projection on wf.EmployeeView;

    entity ApproverItemsView { // This view is used in a Master Appprover view
        key userId         : String;
        key seqNumber      : String;
        key itemName       : String;
            firstName      : String;
            lastName       : String;
            hiringDate     : String;
            lastNameMan    : String;
            firstNameMan   : String;
            extCodeLegEnt  : String;
            legalEntity    : String;
            empClass       : String;
            countryCd      : String;
            noteAdmin      : String;
            statusApprover : String;
            assignedTo     : String;
            processedBy    : String
    }

    function fetchNewHired(userId : Integer) returns String;
}

annotate employee.Employees with @(requires : [{
    grant : '*',
    to    : ['HRAdminWF']
}]);


annotate employee.EmpOverview with @(requires : [{
    grant : '*',
    to    : ['HRAdminWF']
}]);


annotate employee.EmployeesHistory with @(requires : [{
    grant : '*',
    to    : [
        'HRAdminWF',
        'ApproverWF'
    ]
}]);

annotate employee.ApproverItemsView with @(requires : [{
    grant : '*',
    to    : ['ApproverWF']
}]);

