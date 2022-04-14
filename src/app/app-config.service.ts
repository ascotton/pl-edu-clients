declare var _envFileConfig: any;

import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Store } from '@ngrx/store';

import { PLUrlsService, PLHttpErrorService, PLClientStudentDisplayService } from '@root/index';
import { environment } from '@environments/environment';
import { AppStore } from './appstore.model';
import { User } from './modules/user/user.model';

@Injectable()
export class AppConfigService {
    apps: any = environment.apps;

    showAppNav = true;
    showNavHeader = false;
    currentUser: User;
    genericErrorMessage =
        'Oops, something went wrong. Please try again. If the problem persists, please contact us for support.';

    constructor(
        private plUrls: PLUrlsService,
        private plHttpError: PLHttpErrorService,
        private router: Router,
        private store: Store<AppStore>,
    ) {
        this.store.select('currentUser').subscribe((user: any) => {
            this.currentUser = user;
            this.setErrorMessages();
        });
        this.checkForConfig();
        this.formUrls(this.apps);

        this.router.events.subscribe((event: any) => {
            if (event instanceof NavigationStart) {
                this.showAppNav = true;
                this.showNavHeader = false;
            }
        });
    }

    checkForConfig() {
        if (typeof _envFileConfig !== 'undefined' && _envFileConfig.apps) {
            this.apps = Object.assign(this.apps, _envFileConfig.apps);
            console.log('Using envConfigFile, apps:', this.apps);
            this.formUrls(this.apps);
        }
    }

    formUrls(apps1: any = null) {
        let urls = {};
        if (!apps1) {
            // tslint:disable-next-line: no-parameter-reassignment
            apps1 = this.apps;
        }
        if (apps1) {
            let apps = [
                'auth',
                'apiWorkplace',
                'platform',
                'techcheck',
                'admin',
                'lightyear',
                'toychest',
                'hamm',
                'rex',
                'woody',
                'eduClients',
                'landing',
            ];
            apps = apps.concat(['socket']);
            apps = apps.concat(['apollo']);
            const appUrls: any = {};
            apps.forEach((app: any) => {
                appUrls[app] = apps1[app] && apps1[app].url ? apps1[app].url : '';
            });
            const cookieDomain = environment.cookie_domain;
            const isLowerEnv = cookieDomain.includes('localhost') || cookieDomain.includes('presencestag');
            const plEnvOverride = localStorage.getItem('PL_ENV');

            if (isLowerEnv && plEnvOverride) {
                const authContextStart = appUrls.auth.indexOf('//') + 2;
                const authContextEnd = appUrls.auth.indexOf('.');
                const authContext = appUrls.auth.substring(authContextStart, authContextEnd);
                environment.apps.auth.url = appUrls.auth = appUrls.auth.replace(authContext, plEnvOverride);
                environment.apps.apiWorkplace.url = appUrls.apiWorkplace = appUrls.apiWorkplace.replace(
                    authContext,
                    plEnvOverride,
                );
                environment.apps.apollo.url = appUrls.apollo = appUrls.apollo.replace(authContext, plEnvOverride);
                environment.apps.apps.url = environment.apps.apps.url.replace(authContext, plEnvOverride);
            }

            urls = {
                socket: `${appUrls.socket}`,

                apollo: `${appUrls.apollo}`,

                assumeLogin: `${appUrls.auth}/hijack/email/`,
                login: `${appUrls.auth}/login/`,
                logout: `${appUrls.auth}/logout/`,
                releaseLogin: `${appUrls.auth}/hijack/release-hijack/`,
                status: `${appUrls.auth}/api/v1/status/`,

                accounts: `${appUrls.auth}/api/v1/accounts/`,
                accountDocuments: `${appUrls.apiWorkplace}/api/v3/accountdocuments/`,
                accountDocumentTypes: `${appUrls.apiWorkplace}/api/v3/accountdocumentstype/`,
                activities: `${appUrls.apiWorkplace}/api/v1/activities/`,
                agreements: `${appUrls.apiWorkplace}/api/v1/agreements/`,
                appointments: `${appUrls.apiWorkplace}/api/v3/appointments/`,
                assignmentProposals: `${appUrls.apiWorkplace}/api/v1/assignmentproposals/`,
                assignments: `${appUrls.auth}/api/v1/assignments/`,
                assignmentPreferences: `${appUrls.apiWorkplace}/api/v1/assignment-preferences/`,
                areasOfConcern: `${appUrls.apiWorkplace}/api/v1/areas-of-concern/`,
                assessments: `${appUrls.apiWorkplace}/api/v1/assessments/`,
                availabilitySettings: `${appUrls.apiWorkplace}/api/v1/availability/preferences/`,
                billingCodes: `${appUrls.apiWorkplace}/api/v1/billing_codes/`,
                clients: `${appUrls.apiWorkplace}/api/v1/clients/`,
                clientServices: `${appUrls.apiWorkplace}/api/v2/client-services/`,
                contactTypes: `${appUrls.apiWorkplace}/api/v1/contact-types/`,
                contacts: `${appUrls.apiWorkplace}/api/v1/contacts/`,
                dateState: `${appUrls.apiWorkplace}/api/v1/date-state/`,
                demand: `${appUrls.apiWorkplace}/api/v1/demand/`,
                directServices: `${appUrls.apiWorkplace}/api/v1/direct-services/`,
                documentTypes: `${appUrls.apiWorkplace}/api/v1/document-types/`,
                documents: `${appUrls.apiWorkplace}/api/v1/documents/`,
                ethnicities: `${appUrls.apiWorkplace}/api/v1/ethnicities/`,
                evaluations: `${appUrls.apiWorkplace}/api/v3/evaluations/`,
                evaluationActivities: `${appUrls.apiWorkplace}/api/v3/evaluations/:evaluation_uuid/activities/`,
                events: `${appUrls.apiWorkplace}/api/v2/events/`,
                handbookSection: `${appUrls.apiWorkplace}/api/v1/handbooksection/`,
                isas: `${appUrls.apiWorkplace}/api/v1/isa-info/`,
                invoices: `${appUrls.apiWorkplace}/api/v3/invoices/`,
                invoicesPreview: `${appUrls.apiWorkplace}/api/v3/invoices/preview/`,
                jumbotron: `${appUrls.apiWorkplace}/api/v1/jumbotron/`,
                jumbotronItems: `${appUrls.apiWorkplace}/api/v1/jumbotron/:jumbotron_uuid/items/`,
                languages: `${appUrls.apiWorkplace}/api/v1/languages/`,
                locations: `${appUrls.apiWorkplace}/api/v1/locations/`,
                locationMentionableUsers: `${appUrls.apiWorkplace}/api/v1/locations/:location_uuid/mentionable_users/`,
                metrics: `${appUrls.apiWorkplace}/api/v1/metrics/`,
                metricsPoints: `${appUrls.apiWorkplace}/api/v1/metrics-points/`,
                noms: `${appUrls.apiWorkplace}/api/v1/noms/`,
                nomsEntry: `${appUrls.apiWorkplace}/api/v1/noms-entry/`,
                notesSchemas: `${appUrls.apiWorkplace}/api/v1/notes/schemas/`,
                notesExports: `${appUrls.apiWorkplace}/api/v1/notes/exports/`,
                notesExportsOrganizations: `${appUrls.apiWorkplace}/api/v1/notes/exports/organizations/`,
                organizations: `${appUrls.apiWorkplace}/api/v1/organizations/`,
                preagreements: `${appUrls.apiWorkplace}/api/v1/preagreements/`,
                preagreementW2s: `${appUrls.apiWorkplace}/api/v1/preagreementw2s/`,
                preagreementW2sList: `${appUrls.apiWorkplace}/api/v1/preagreementw2slist/`,
                privatePractice: `${appUrls.apiWorkplace}/api/v1/private-practice/`,
                providerTypes: `${appUrls.apiWorkplace}/api/v1/provider-types/`,
                providers: `${appUrls.apiWorkplace}/api/v1/providers/`,
                providerPool: `${appUrls.apiWorkplace}/api/v1/provider-pool`,
                providerAgreements: `${appUrls.apiWorkplace}/api/v1/provider-agreements/`,
                races: `${appUrls.apiWorkplace}/api/v1/races/`,
                records: `${appUrls.apiWorkplace}/api/v1/records/`,
                recording: `${appUrls.platform}/api/v3/recording/`,
                referralNotes: `${appUrls.apiWorkplace}/api/v1/referrals/:referral_uuid/notes/`,
                services: `${appUrls.apiWorkplace}/api/v1/services/`,
                serviceTypes: `${appUrls.apiWorkplace}/api/v1/service-types/`,
                timesheet: `${appUrls.apiWorkplace}/api/v1/timesheet/`,
                timesheetPreview: `${appUrls.apiWorkplace}/api/v1/timesheet/preview/`,
                timesheetAmendments: `${appUrls.apiWorkplace}/api/v1/timesheet-amendments/`,
                upload: `${appUrls.apiWorkplace}/api/v1/upload/`,
                user: `${appUrls.auth}/api/v1/user/`,
                qualifications: `${appUrls.apiWorkplace}/api/v1/sfproviderqualifications/`,
                users: `${appUrls.auth}/api/v2/users/`,

                jiraIdea: `${appUrls.platform}/api/v3/jira/idea/`,
                room: `${appUrls.platform}/api/v1/room/`,
                roomResetWhiteboard: `${appUrls.platform}/api/v1/room/reset_whiteboard/`,

                permissions: `${appUrls.auth}/api/v1/permissions/`,
                workplacePermissions: `${appUrls.apiWorkplace}/api/v1/permissions/`,
                coassembleRegistration: `${appUrls.apiWorkplace}/api/v1/third-party/coassemble/register/`,
                zoomMeetings: `${appUrls.apiWorkplace}/api/v1/zoom/meetings/`,
                zoomMeetingRegistrations: `${appUrls.apiWorkplace}/api/v1/zoom/meetings/registrations/`,
                ssp: `${appUrls.apiWorkplace}/api/v1/school_staff_provider/`,
                usage: `${appUrls.platform}/api/v1/usage/`,
                platform_ssp: `${appUrls.platform}/api/v1/school_staff_providers/`,
                coassemble: `${appUrls.apiWorkplace}/api/v1/coassemble/`,
                license: `${appUrls.apiWorkplace}/api/v1/license/`,
                accountLicense: `${appUrls.apiWorkplace}/api/v1/account-license/`,
                userLicense: `${appUrls.apiWorkplace}/api/v1/user-license/`,

                // homeFE: `${appUrls.platform}`,
                homeFE: `${appUrls.landing}`,
                platformFE: `${appUrls.platform}`,
                techcheckFE: `${appUrls.techcheck}`,
                changePasswordFE: `${appUrls.auth}/password/change`,
                helpDocsFE: `https://presencelearning.helpjuice.com`,
                trainingFaqFE: `https://www.presencelearning.com/welcome-to-the-presencelearning-environment/`,
                copyrightFE: `https://www.presencelearning.com/about/copyright-policy/`,
                codeOfConductFE: `https://www.presencelearning.com/about/code-of-conduct/`,
                adminFE: `${appUrls.admin}`,
                roomFE: `${appUrls.lightyear}`,
                libraryFE: `${appUrls.toychest}`,
                billingFE: `${appUrls.hamm}`,
                clientsFE: `${appUrls.rex}`,
                scheduleFE: `${appUrls.woody}`,
                eduClientsFE: `${appUrls.eduClients}`,
                landingFE: `${appUrls.landing}`,
            };
        }

        this.plUrls.setUrlsDefaults(urls);
        this.plUrls.formUrls();
    }

    setErrorMessages() {
        const clientStudentText = PLClientStudentDisplayService.get(this.currentUser);
        const messages = {
            clients: [{ code: 401, msg: `You do not have access to these ${clientStudentText}s` }],
            'evaluations/:uuid': [
                {
                    code: 400,
                    status: 'The evaluation can\'t be completed because it has appointments in the future',
                    msg: 'The evaluation can\'t be completed because it has appointments in the future',
                },
            ],
            'invoices/:uuid/retract': [
                { code: 403, msg: 'This invoice has already been processed and cannot be retracted.' },
            ],
            'clients/:uuid/providers': (err: any) => {
                if (err && err.error && err.error.length) {
                    return '* ' + err.error[0];
                }
                return this.genericErrorMessage;
            },
        };
        this.plHttpError.setMessages(messages);
    }
}
