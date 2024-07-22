using { pwc.psc.ecs.workflow as wf } from '../db/schema';
@path: 'service/pwcAdmin'
//@requires: 'authenticated-user'
service PwCAdminService {
    entity Config as projection on wf.Config;
    entity TechParams as projection on wf.TechnicalParams;
}

/*
annotate PwCAdminService.Config with @(restrict: [
    { grant: '*', to: ['PwCAdminWF', 'AppAdminWF'] }
]);
annotate PwCAdminService.TechParams with @(restrict: [
    { grant: '*', to: ['PwCAdminWF', 'AppAdminWF'] }
]);
*/