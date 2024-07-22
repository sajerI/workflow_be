@requires: 'authenticated-user'
service TeamService {

    @readonly
    entity Employment {
        key userId : String;
        key year : Integer;
        key target : Boolean;
        key currency : String;
        key entireYear : Boolean;
        key payComponentGroup : String;
    }

    @readonly
    entity Manager {
        key userId : String;
        key year : Integer;
        key target : Boolean;
        key currency : String;
        key entireYear : Boolean;
        key payComponentGroup : String;
        teamAverages : Association to many TeamAverage on teamAverages.manager = $self;
        teamStructures : Association to many TeamStructure on teamStructures.manager = $self;
        teamPerformances : Association to many TeamPerformance on teamPerformances.manager = $self;
        teamPayComponents : Association to many TeamPayComponent on teamPayComponents.manager = $self;
        teamPayComponentsDetail : Association to many TeamPayComponentDetail on teamPayComponentsDetail.manager = $self;
        teamPayComponentsSum : Association to one TeamPayComponentSum on teamPayComponentsSum.manager = $self;
        userPayComponents : Association to many UserPayComponent on userPayComponents.manager = $self;
        teamGrades : Association to many TeamGrade on teamGrades.manager = $self;
        teamCategories : Association to many TeamCategory on teamCategories.manager = $self;
        teamJobs : Association to many TeamJob on teamJobs.manager = $self;
        teamAgeGroups : Association to many TeamAgeGroup on teamAgeGroups.manager = $self;
        gradeGenderDeviations : Association to many GradeGenderDeviation on gradeGenderDeviations.manager = $self;
        gradeAverageDeviations : Association to many GradeAverageDeviation on gradeAverageDeviations.manager = $self;
        salaryRangePenetrations : Association to many SalaryRangePenetration on salaryRangePenetrations.manager = $self;
        performanceHeatMap : Association to many PerformanceHeatMap on performanceHeatMap.manager = $self;
        teamStructuresByCareerTeam : Association to many TeamStructureByCareerTeam on teamStructuresByCareerTeam.manager = $self;
        performanceCounts : Association to many PerformanceCount on performanceCounts.manager = $self;
        performanceSalaryIncreases : Association to many PerformanceSalaryIncrease on performanceSalaryIncreases.manager = $self;
    }

    @readonly
    entity TeamAverage {
        key manager : Association to Manager;
        key displayOrder : Integer;
        information : String;
        average : Decimal;
    }

    @readonly
    entity TeamStructure {
        key manager : Association to Manager;
        key displayOrder : Integer;
        information : String;
        average : Decimal;
        percentage : Decimal;
    }

    @readonly
    entity TeamPerformance {
        key manager : Association to Manager;
        key displayOrder : Integer;
        information : String;
        average : Decimal;
        percentage : Decimal;
    }

    @readonly
    entity TeamPayComponent {
        key manager : Association to Manager;
        key code : String;
        name : String;
        uniqueName : String;
        value : Decimal;
    }

    @readonly
    entity TeamPayComponentDetail {
        key manager : Association to Manager;
        key code : String;
        category : String;
        displayOrder : Integer;
        name : String;
        uniqueName : String;
        value : Decimal;
    }

    @readonly
    entity TeamPayComponentSum {
        key manager : Association to Manager;
        value : Decimal;
    }

    @readonly
    entity UserPayComponent {
        key manager : Association to Manager;
        key userId : String;
        key code : String;
        displayOrder : Integer;
        name : String;
        uniqueName : String;
        firstName : String;
        value : Decimal;
        sum : Decimal;
    }

    @readonly
    entity TeamGrade {
        key manager : Association to Manager;
        key grade : String;
    }

    @readonly
    entity TeamCategory {
        key manager : Association to Manager;
        key category : String;
    }

    @readonly
    entity TeamJob {
        key manager : Association to Manager;
        key job : String;
    }

    @readonly
    entity TeamAgeGroup {
        key manager : Association to Manager;
        key ageGroup : String;
    }

    @readonly
    entity GradeGenderDeviation {
        key manager : Association to Manager;
        key selectedDimension : String;
        key dimension : String;
        key gender : String;
        value : Decimal;
        details : Association to one GradeGenderDeviationDetails on details.gradeGenderDeviation = $self;
    }

    @readonly
    entity GradeGenderDeviationDetails {
        key gradeGenderDeviation : Association to GradeGenderDeviation;
        fte : Decimal;
        headcount : Integer;
    }

    @readonly
    entity GradeAverageDeviation {
        key manager : Association to Manager;
        key userId : String;
        firstName : String;
        deviation : Decimal;
    }

    @readonly
    entity SalaryRangePenetration {
        key manager : Association to Manager;
        key userId : String;
        firstName : String;
        penetration : Decimal;
    }

    @readonly
    entity PerformanceHeatMap {
        key manager : Association to Manager;
        key compaRatioRange : String;
        key rating : String;
        employeeCount : Integer;
        employees : Association to many PerformanceHeatMapEmployee on employees.performanceHeatMap = $self;
    }

    @readonly
    entity PerformanceHeatMapEmployee {
        key performanceHeatMap : Association to PerformanceHeatMap;
        key userId : String;
        firstName : String;
        lastName : String;
    }

    @readonly
    entity TeamStructureByCareerTeam {
        key manager : Association to Manager;
        key selectedDimension : String;
        key dimension : String;
        amount : Decimal;
    }

    @readonly
    entity PerformanceCount {
        key manager : Association to Manager;
        key rating : String;
        employeeCount : Integer;
    }

    @readonly
    entity PerformanceSalaryIncrease {
        key manager : Association to Manager;
        key rating : String;
        salaryIncrease : Decimal;
    }

}

annotate TeamService.Employment with @(requires: ['Admin', 'User']);
annotate TeamService.Manager with @(requires: ['Admin', 'User']);
annotate TeamService.TeamAverage with @(requires: ['Admin', 'User']);
annotate TeamService.TeamStructure with @(requires: ['Admin', 'User']);
annotate TeamService.TeamPerformance with @(requires: ['Admin', 'User']);
annotate TeamService.TeamPayComponent with @(requires: ['Admin', 'User']);
annotate TeamService.TeamPayComponentDetail with @(requires: ['Admin', 'User']);
annotate TeamService.TeamPayComponentSum with @(requires: ['Admin', 'User']);
annotate TeamService.UserPayComponent with @(requires: ['Admin', 'User']);
annotate TeamService.TeamGrade with @(requires: ['Admin', 'User']);
annotate TeamService.TeamCategory with @(requires: ['Admin', 'User']);
annotate TeamService.TeamJob with @(requires: ['Admin', 'User']);
annotate TeamService.TeamAgeGroup with @(requires: ['Admin', 'User']);
annotate TeamService.GradeGenderDeviation with @(requires: ['Admin', 'User']);
annotate TeamService.GradeGenderDeviationDetails with @(requires: ['Admin', 'User']);
annotate TeamService.GradeAverageDeviation with @(requires: ['Admin', 'User']);
annotate TeamService.SalaryRangePenetration with @(requires: ['Admin', 'User']);
annotate TeamService.PerformanceHeatMap with @(requires: ['Admin', 'User']);
annotate TeamService.PerformanceHeatMapEmployee with @(requires: ['Admin', 'User']);
annotate TeamService.TeamStructureByCareerTeam with @(requires: ['Admin', 'User']);
annotate TeamService.PerformanceCount with @(requires: ['Admin', 'User']);
annotate TeamService.PerformanceSalaryIncrease with @(requires: ['Admin', 'User']);