using {pwc.psc.ecs.workflow as wf} from '../db/schema';

@path     : 'service/appAdmin'
@requires : 'authenticated-user'

service AppAdminService {
    entity Rules         as projection on wf.RulesDefault;
    entity Groups        as projection on wf.Groups;
    entity Rules_Items   as projection on wf.Rules_Items;

    entity RulesOverview as
        select from Rules distinct {
            id as programID,
            values
        };
}

annotate appAdmin.Rules with @(requires : [{
    grant : '*',
    to    : [
        'AppAdminWF',
        'PwCAdminWF',
        'HRAdminWF'
    ]
}]);

annotate appAdmin.Groups with @(requires : [{
    grant : '*',
    to    : [
        'AppAdminWF',
        'PwCAdminWF',
        'HRAdminWF'
    ]
}

]);

annotate appAdmin.Rules_Items with @(requires : [{
    grant : '*',
    to    : [
        'AppAdminWF',
        'PwCAdminWF',
        'HRAdminWF'
    ]
}]);

annotate appAdmin.RulesOverview with @(requires : [{
    grant : '*',
    to    : [
        'AppAdminWF',
        'PwCAdminWF',
        'HRAdminWF'
    ]
}]);
