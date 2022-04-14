import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { orderBy } from 'lodash';

import {
    PLGraphQLService,
    PLHttpService,
    PLUrlsService,
    PLToastService,
    PLMayService,
    PLAssumeLoginService,
    PLModalService,
} from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLProviderService } from '../pl-provider.service';
import { ToastrService } from 'ngx-toastr';
import { PLProviderLanguagesComponent } from './pl-provider-languages.component';
import { PLProviderAreasOfSpecialtyComponent } from './pl-provider-areas-of-specialty.component';
import { PLProviderNotificationPreferencesComponent } from './pl-provider-notification-preferences.component';
import { PLProviderProfileService } from '@root/src/app/common/services';

// tslint:disable-next-line: no-require-imports
const providerTasksQuery = require('./../queries/provider-tasks.graphql');

@Component({
    selector: 'pl-provider-account-settings',
    templateUrl: './pl-provider-account-settings.component.html',
    styleUrls: ['../../../common/less/app/card-section.less', './pl-provider-account-settings.component.less'],
})
export class PLProviderAccountSettingsComponent {
    @Input() provider: any = {};

    user: User;
    urls: any = {};
    mayGenerateRoom = false;
    mayResetWhiteboard = false;
    mayViewSchedule = false;
    mayViewRoom = false;
    mayObserve = false;
    mayViewProvider = false;
    mayViewPersonnel = false;
    isSelfProvider = false;
    isAdmin = false;
    private loading: any = {
        newRoom: false,
        resetWhiteboard: false,
    };
    private newRoomConfirmVisible = false;
    agreements: any[] = [];
    onboardingTasks: any[] = [];
    showTips = {
        status: false,
    };
    showAgreements = true;
    rateLabelDisplay = '';

    constructor(
        private plHttp: PLHttpService,
        private store: Store<AppStore>,
        private plUrls: PLUrlsService,
        private plToast: PLToastService,
        private plMay: PLMayService,
        private plProvider: PLProviderService,
        private plGraphQL: PLGraphQLService,
        private assumeLoginService: PLAssumeLoginService,
        private plModal: PLModalService,
        private toastr: ToastrService,
        private plProviderProfileService: PLProviderProfileService,
    ) {
        store.select('currentUser')
            .subscribe((user) => {
                this.user = user;
                this.checkPrivileges();
                this.getAgreements();
            });
    }

    ngOnInit() {
        this.provider = {};
        this.plProvider.getFromRoute()
            .subscribe((res: any) => {
                // Provider may be old, so check and compare id first.
                const url = window.location.href;
                if (url.includes(res.provider.user.id) && this.provider.id !== res.provider.id) {
                    this.provider = res.provider;
                    this.formProviderInfo();
                    this.checkPrivileges();
                    this.getOnboardingTasks();
                    this.getAgreements();
                    this.setNotificationPreferences();
                }
            });
        this.setUrls();
    }

    setUrls() {
        this.urls.room = this.plUrls.urls.roomFE;
        this.urls.schedule = this.plUrls.urls.scheduleFE;
    }

    checkPrivileges() {
        this.mayViewPersonnel = false;
        if (this.user && this.user.uuid) {
            this.isAdmin = this.plMay.isAdminType(this.user);
            this.mayGenerateRoom = this.isAdmin || this.plMay.generateNewRoom(this.user);
            this.mayResetWhiteboard = this.isAdmin || this.plMay.resetRoomWhiteboard(this.user);
            this.mayObserve = this.user.xEnabledUiFlags &&
                this.user.xEnabledUiFlags.includes('room-observe-session');
            this.mayViewRoom = this.user.xEnabledUiFlags &&
                this.user.xEnabledUiFlags.includes('room-view-room-url');
            this.mayViewPersonnel =
                (this.user.xGlobalPermissions && this.user.xGlobalPermissions.viewPersonnel) ? true : false;
        }
        if (this.provider && this.provider.user) {
            this.mayViewSchedule = this.plMay.viewSchedule(this.provider);
        }
        // Reset.
        this.isSelfProvider = false;
        if (this.provider && this.provider.user && this.user) {
            this.mayViewProvider = (this.provider.user.id === this.user.uuid || this.plMay.isAdminType(this.user) ||
                (this.user.xGlobalPermissions && this.user.xGlobalPermissions.viewPersonnel)) ?
                true : false;
            this.isSelfProvider = this.provider.user.id === this.user.uuid;
        }
    }

    resetWhiteboard() {
        this.loading.resetWhiteboard = true;
        this.plHttp.put('roomResetWhiteboard', { user_uuid: this.provider.user.id })
            .subscribe((res: any) => {
                this.plToast.show('success', 'Whiteboard reset.', 2000, true);
                this.loading.resetWhiteboard = false;
            }, (err: any) => {
                this.loading.resetWhiteboard = false;
            });
    }

    toggleNewRoomConfirm() {
        this.newRoomConfirmVisible = !this.newRoomConfirmVisible;
    }

    newRoom() {
        this.loading.newRoom = true;
        this.plHttp.save('room', { user_uuid: this.provider.user.id })
            .subscribe((res: any) => {
                this.plToast.show('success', 'New room generated.', 2000, true);
                this.loading.newRoom = false;
                this.toggleNewRoomConfirm();
            }, (err: any) => {
                this.loading.newRoom = false;
                this.toggleNewRoomConfirm();
            });
    }

    formProviderInfo() {
        const provider = { ...this.provider };
        provider.xMailing = this.provider.billingAddress.street ?
            `${provider.billingAddress.street},
            ${provider.billingAddress.city},
            ${provider.billingAddress.state},
            ${provider.billingAddress.postalCode}` :
            `${provider.billingAddress.state}`;

        if (provider.areasOfSpecialty) {
            provider.areasOfSpecialty =
                provider.areasOfSpecialty.sort((a: any, b: any) => a.name.localeCompare(b.name));
        }

        if (provider.languages) {
            provider.languages =
                provider.languages.sort((a: any, b: any) => a.name.localeCompare(b.name));
        }

        provider.x = {};
        const dateFields = ['readyForPlacementDate', 'firstSession', 'lastSession', 'separationDate', 'techCheckCompletionDate'];
        dateFields.forEach((field) => {
            provider.x[field] = (provider[field] !== null) ?
                moment(this.provider[field]).format('M/D/YYYY') : '';
        });
        this.provider = provider;

        if (this.provider.adjustedHourlyRate) {
            this.rateLabelDisplay = `(All rates for assignments that commence after July 1, ${moment().format('YYYY')})`;
        }
    }

    getOnboardingTasks() {
        const vars = {
            id: this.provider.user.id,
            code: 'onboarding',
        };
        this.plGraphQL.query(providerTasksQuery, vars, {})
            .pipe(first()).subscribe((res: any) => {
                this.onboardingTasks = this.formatTasks(res.providerTasks);
            });
    }

    formatTasks(tasks: any[]) {
        const onboardingMap = {
            'onboarding-npin': {
                order: 10,
                name: 'Submitted NPI Number',
            },
            'onboarding-w9-tax-form': {
                order: 20,
                name: 'Submitted Tax Information',
            },
            // "onboarding-contractor-status": 3,
            'onboarding-liability-insurance': {
                order: 40,
                name: 'Submitted Professional Liability Insurance Information',
            },
            'onboarding-driver-license': {
                order: 50,
                name: 'Submitted Driver License',
            },
            'onboarding-orientation': {
                order: 1,
                name: 'Attended Provider Onboarding Orientation',
            },
            'onboarding-provider-lounge': {
                order: 70,
                name: 'Visited Provider Lounge',
            },
            'onboarding-telehealth-institute-prime': {
                order: 5,
                name: 'Completed Telehealth Institute Prime',
            },
            'onboarding-assignment-readiness-check': {
                order: 7,
                name: 'Prepared for Assignment Readiness Check',
            },
            'onboarding-documentation-and-billing': {
                order: 100,
                name: 'Reviewed Billing Instructions',
            },
            // 'onboarding-best-practices': 11,
        };
        const onboardingTasks: any[] = [
            // Fake an onboarding wizard complete task.
            {
                id: 'wizardDone',
                xSort: 0,
                xIsComplete: this.provider.isOnboardingWizardComplete,
                xName: 'Completed Onboarding Wizard',
            },
        ];
        tasks.forEach((task: any) => {
            if (task.taskType.code.includes('onboarding-')) {
                // Get owner for this user id since isComplete is in there.
                let isComplete = false;
                for (let ii = 0; ii < task.owners.length; ii++) {
                    if (task.owners[ii].user.id === this.provider.user.id) {
                        isComplete = task.owners[ii].isComplete;
                        break;
                    }
                }
                onboardingTasks.push(
                    Object.assign(task, {
                        xSort: onboardingMap[task.taskType.code].order || 100,
                        xIsComplete: isComplete,
                        xName: onboardingMap[task.taskType.code].name,
                    }),
                );
            }
        });
        return orderBy(onboardingTasks, ['xSort'], ['asc']);
    }

    getAgreements() {
        if (this.provider && this.provider.user && (this.isSelfProvider ||
            (this.user.xGlobalPermissions && this.user.xGlobalPermissions.viewPersonnel))) {
            this.showAgreements = true;
            const params = {
                provider_uuid: this.provider.user.id,
            };
            const params2 = {
                provider_uuid: this.provider.user.id,
            };
            this.plHttp.get('providerAgreements', params)
                .subscribe((res: any) => {
                    this.plHttp
                        .get('preagreementW2sList', params2)
                        .subscribe((res2: any) => {
                            res2.forEach((agreement: any) => {
                                agreement.document_url = agreement.document_url.replace('/sign', '/status');
                            });
                            this.agreements = this.formatAgreements(res.concat(res2));
                        });
                });
        } else {
            this.showAgreements = false;
        }
    }

    formatAgreements(agreements: any[]) {
        const dateFields = ['as_of_date', 'end_date', 'agreed_on'];
        agreements.forEach((agreement: any) => {
            agreement.x = {};
            dateFields.forEach((field) => {
                if (agreement[field]) {
                    agreement.x[field] = (agreement[field] !== null && agreement[field] !== undefined) ?
                        moment(agreement[field], 'YYYY-MM-DD').format('M/D/YYYY') : '';
                }
            });
        });
        return agreements.sort((a: any, b: any) => a.x.agreed_on.localeCompare(b.x.agreed_on));
    }

    assumeUser() {
        this.assumeLoginService.assume(this.provider.email);
    }

    toggleShowTips(key: string) {
        this.showTips[key] = !this.showTips[key];
    }

    onEditLanguages() {
        let modalRef: any;

        const params: any = {
            userId: this.provider.user.id,
            selectedLanguages: this.provider.languages,
            onSave: (languages: any) => {
                this.provider.languages = languages;
                this.toastr.success('Languages saved!', 'Complete', {
                    positionClass: 'toast-bottom-right',
                });
                modalRef._component.destroy();
            },
        };

        this.plModal.create(PLProviderLanguagesComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }

    onEditAreasOfSpecialty() {
        let modalRef: any;

        const params: any = {
            userId: this.provider.user.id,
            selectedAreas: this.provider.areasOfSpecialty,
            onSave: (areas: any) => {
                this.provider.areasOfSpecialty = areas;
                this.toastr.success('Areas of Specialty saved!', 'Complete', {
                    positionClass: 'toast-bottom-right',
                });

                modalRef._component.destroy();
            },
        };

        this.plModal.create(PLProviderAreasOfSpecialtyComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }

    setNotificationPreferences() {
        // Email notifications will be always on for all providers
        if (!this.provider.notificationPreference.includes('EMAIL')) {
            this.provider.notificationPreference = [
                'EMAIL',
                ...this.provider.notificationPreference,
            ];
        }
        this.provider.notificationPreference = this.provider.notificationPreference.filter((n: string) => n.length);
    }

    getNotificationPreferencesText(notificationType: string) {
        const notification = this.plProviderProfileService.getNotificationPreferences()
            .find(n => notificationType === n.value);
        return notification && notification.label;
    }

    onEditNotificationPreferences() {
        let modalRef: any;

        const params: any = {
            userId: this.provider.user.id,
            selectedNotificationPreferences: this.provider.notificationPreference,
            onSave: (notifications: any) => {
                this.provider.notificationPreference = notifications;
                this.toastr.success('Notification Preferences saved!', 'Complete', {
                    positionClass: 'toast-bottom-right',
                });

                modalRef._component.destroy();
            },
        };

        this.plModal.create(PLProviderNotificationPreferencesComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }
}
