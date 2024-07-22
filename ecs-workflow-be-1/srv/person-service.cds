@requires: 'authenticated-user'
service PersonService {

    @readonly
    entity Employment {
        key userId : String;
        username : String;
        lang : String;
        pwcAdmin : Boolean;
        admin : Boolean;
        manager : Boolean;
        user : Boolean;
    }

    @readonly
    entity Person {
        key userId : String;
        key year : Integer;
        key target : Boolean;
        key currency : String;
        key entireYear : Boolean;
        key payComponentGroup : String;
        employeeOverview : Association to many EmployeeOverview on employeeOverview.person = $self;
        employeeAverage : Association to many EmployeeAverage on employeeAverage.person = $self;
        payComponents : Association to many PayComponent on payComponents.person = $self;
        payComponentSum : Association to PayComponentSum on payComponentSum.person = $self;
        deferralBonus : Association to DeferralBonus on deferralBonus.person = $self;
        teamAverages : Association to many TeamAverage on teamAverages.person = $self;
        teamStructures : Association to many TeamStructure on teamStructures.person = $self;
        teamPerformances : Association to many TeamPerformance on teamPerformances.person = $self;
    }

    @readonly
    entity EmployeeOverview {
        key person : Association to Person;
        key displayOrder : Integer;
        metric : String;
        value : String;
    }

    @readonly
    entity EmployeeAverage {
        key person : Association to Person;
        key displayOrder : Integer;
        metric : String;
        value : String;
    }

    @readonly
    entity PayComponent {
        key person : Association to Person;
        key code : String;
        displayOrder : Integer;
        category : String;
        name : String;
        uniqueName : String;
        description : String;
        value : Decimal;
    }

    @readonly
    entity PayComponentSum {
        key person : Association to Person;
        value : Decimal;
    }

    @readonly
    entity DeferralBonus {
        key person : Association to Person;
        year : Integer;
        name : String;
        value : Decimal;
    }

    @readonly
    entity TeamAverage {
        key person : Association to Person;
        key displayOrder : Integer;
        information : String;
        average : Decimal;
        self : Decimal;
    }

    @readonly
    entity TeamStructure {
        key person : Association to Person;
        key displayOrder : Integer;
        information : String;
        average : Decimal;
        percentage : Decimal;
        self : String;
    }

    @readonly
    entity TeamPerformance {
        key person : Association to Person;
        key displayOrder : Integer;
        information : String;
        average : Decimal;
        percentage : Decimal;
        self : Decimal;
    }

    @readonly
    entity TeamMember {
        key userId : String;
        key year : Integer;
        key entireYear : Boolean;
        firstName : String;
        managerId : String;
    }

}

annotate PersonService.Employment with @(requires: ['PwCAdmin', 'Admin', 'User']);
annotate PersonService.Person with @(requires: ['Admin', 'User']);
annotate PersonService.EmployeeOverview with @(requires: ['Admin', 'User']);
annotate PersonService.EmployeeAverage with @(requires: ['Admin', 'User']);
annotate PersonService.PayComponent with @(requires: ['Admin', 'User']);
annotate PersonService.PayComponentSum with @(requires: ['Admin', 'User']);
annotate PersonService.TeamAverage with @(requires: ['Admin', 'User']);
annotate PersonService.TeamStructure with @(requires: ['Admin', 'User']);
annotate PersonService.TeamPerformance with @(requires: ['Admin', 'User']);
annotate PersonService.TeamMember with @(requires: ['Admin', 'User']);