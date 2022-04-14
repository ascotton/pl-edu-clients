declare var require: any;

// tslint:disable-next-line: import-name
import { orderBy } from 'lodash';

import { environment } from '@environments/environment';

import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

// import { AppConfigService } from '@app/app-config.service';

import { AppStore } from '@app/appstore.model';
import { CurrentUserService } from '@modules/user/current-user.service';
import {
    PLHttpService,
    PLUrlsService,
    PLMayService,
    PLApiBillingCodesService,
    PLTimezoneService,
    PLGraphQLService,
    PLConfirmDialogService,
    PLModalService,
} from '@root/index';
import { PLUtilService, PLTasksService } from '@common/services';

import { PLGenericModalComponent } from '@root/src/app/common/components';

// tslint:disable: no-require-imports
const updateTaskOwnerQuery = require('./queries/update-task-owner.graphql');
const updateTaskOwnerCompleteQuery = require('./queries/update-task-owner-complete.graphql');

import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { defaultIfEmpty } from 'rxjs/operators';
import { PLPrivatePracticeModalComponent } from '../pl-private-practice-modal/pl-private-practice-modal.component';

/**
 * This is the Provider Landing page.
 * (aka provider home, provider dashboard)
 */
@Component({
    selector: 'pl-dashboard',
    templateUrl: './pl-dashboard.component.html',
    styleUrls: ['./pl-dashboard.component.less'],
})
export class PLDashboardComponent {
    @ViewChild('content') contentEle: ElementRef;
    @ViewChild('footer') footerEle: ElementRef;

    pageInitialized = false;
    socialLinks: any[] = [];
    showFTE = false;
    supportEmail: String = environment.support_email;
    supportPhone: String = environment.support_phone;

    currentUser: any = {};
    fullName = '';
    salesforceId = '';
    apps: any[] = [];
    roomUrl: String;
    private copied = false;
    private loadingEvents = true;
    private today: String;
    scheduleUrl: String;
    private billingCodes: any[] = [];
    private events: any[] = [];
    private tasks: any[] = [];
    tasksOnboarding: any[] = [];
    tasksOnboardingCheckboxVals = {};
    tasksOnboardingAllComplete = false;
    private loadingTasks = true;
    private newCount = 0;
    private colorClasses: any = {
        Absent: 'student_absence',
        'Work with Clients': 'clients',
        'Documentation and Planning': 'documentation_planning',
        Cancelled: 'cancellation',
        Personal: 'personal',
        Other: 'other',
        'Contract Services': 'contract_services',
    };
    private tasksSubscription: any;

    availability = {
        totalHours: 26,
        projectedHours: 0,
        remainingHours: 20,
    };
    showTips = {
        onboarding: false,
        tasks: false,
        availability: false,
        schedule: false,
        room: false,
    };
    alertTask: any = null;
    alertsToShow = {
        task: '',
    };

    equipmentOrderUrl = '';
    goalWritingSampleUrl = '';

    isW2 = false;
    isSchoolPsych = false;

    constructor(
        private store: Store<AppStore>,
        private plUrls: PLUrlsService,
        private plMay: PLMayService,
        private plHttp: PLHttpService,
        private plBillingCodes: PLApiBillingCodesService,
        private plGraphQL: PLGraphQLService,
        private Element: ElementRef,
        private router: Router,
        private util: PLUtilService,
        // private appConfig: AppConfigService,
        private plConfirm: PLConfirmDialogService,
        private plTasksService: PLTasksService,
        private plModal: PLModalService,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser').subscribe((user: any) => {
            if (user.uuid) {
                this.fullName = `${user.first_name} ${user.last_name}`;
                this.currentUser = user;
                if (user.uuid && user.xProvider && user.xProvider.salesforce_id) {
                    this.salesforceId = user.xProvider.salesforce_id;
                }
                this.setApps();
                if (user.xProvider) {
                    if (!user.xProvider.is_onboarding_wizard_complete &&
                        user.xProvider.providerSubStatus === 'Onboarding'
                    ) {
                        this.router.navigate(['provider-onboarding']);
                        this.alertsToShow.task = 'no';
                    } else {
                        this.alertsToShow.task = 'yes';
                    }
                    this.isW2 = user.xProvider.isW2;
                    this.isSchoolPsych =
                        user.xProvider.providerTypes &&
                        user.xProvider.providerTypes.some((x: any) => x.code === 'pa');
                }
                this.checkShowAlerts();

                if (user.xProvider) {
                    this.goalWritingSampleUrl =
                        `https://www.tfaforms.com/4863882?tfa_56=${encodeURIComponent(user.xProvider.providerTypeCode).toUpperCase()}` +
                        `&eid=${encodeURIComponent(user.email)}`;
                }
            }

            if (user.groups) {
                console.log('--- user from provider landing', user);

                if (!this.plMay.canAccessProviderLanding(user)) {
                    this.router.navigateByUrl('/not-found', { skipLocationChange: true });
                }

                this.plBillingCodes.get().subscribe((res: any) => {
                    this.billingCodes = res;
                    this.setSchedule();
                });

                this.setTasks();
                this.setSocialLinks();
                this.pageInitialized = true;

                this.equipmentOrderUrl = `https://www.tfaforms.com/4846346?email=${encodeURIComponent(user.email)}`;
            }
        });
    }

    ngOnDestroy() {
        if (this.tasksSubscription) this.tasksSubscription.unsubscribe();
    }

    toggleShowTips(key: string) {
        this.showTips[key] = !this.showTips[key];
    }

    setApps() {
        const apps: any[] = [
            {
                href: `/provider/${this.currentUser.uuid}`,
                icon: 'user',
                label: 'Profile',
                description: 'See your profile.',
                cssClass: 'pl-dashboard-resource-ml',
            },
            {
                hrefAbsolute: 'http://mail.presencelearning.com/',
                icon: 'email-outline',
                label: 'PL Mail',
                description: 'Check your PresenceLearning email.',
                cssClass: 'pl-dashboard-resource-ml',
            },
            {
                hrefAbsolute: 'https://presencelearning.helpjuice.com/',
                icon: 'people-question',
                label: 'Help Center',
                description: 'Get the help you need.',
                cssClass: 'pl-dashboard-resource-fl',
            },
            {
                href: `/landing/launch-coassemble`,
                isNewWindow: true,
                icon: 'graduation-hat',
                label: 'Telehealth Institute',
                description: 'Access and complete your training courses.',
                cssClass: 'pl-dashboard-resource-fl',
            },
            {
                hrefAbsolute: 'https://presencelearning.com/lounge',
                icon: 'lounge',
                label: 'Lounge',
                description: 'Communicate with the PL Clinician community.',
                cssClass: 'pl-dashboard-resource-ml',
            },
            {
                hrefAbsolute: 'https://flightdeck.dgportals.com/Saml/LoginViaIdp?companyId=1706',
                icon: 'online-store',
                label: 'Online Store',
                description: 'PresenceLearning Store.',
                cssClass: 'pl-dashboard-resource-sl',
            },
        ];
        this.apps = apps;
        this.roomUrl = `${this.plUrls.urls.roomFE}/${this.currentUser.username}`;
    }

    setSocialLinks() {
        const socialLinks = [
            { icon: 'facebook', hrefAbsolute: 'https://www.facebook.com/PresenceLearning' },
            { icon: 'twitter', hrefAbsolute: 'https://twitter.com/telepractice' },
            { icon: 'youtube', hrefAbsolute: 'https://www.youtube.com/user/PresenceLearning' },
            { icon: 'linked-in', hrefAbsolute: 'https://www.linkedin.com/company/presencelearning' },
        ];
        this.socialLinks = socialLinks;
    }

    tasksOnboardingCompleteTask(task: any) {
        let id = '';
        task.owners.forEach((owner: any) => {
            if (owner.user.id === this.currentUser.uuid) {
                id = owner.id;
            }
        });
        // read is apparently a required field so just set it to false.
        this.plGraphQL
            .mutate(updateTaskOwnerCompleteQuery, { id, isComplete: true, read: false }, {})
            .subscribe(() => {
                this.plTasksService.refresh();
            });
        task.xIsComplete = true;
        task.xHidden = true;
        this.checkAllOnboardingTasksComplete();
    }

    tasksOnboardingToggleHidden(task: any) {
        task.xHidden = !task.xHidden;
    }

    setTasks() {
        this.tasksSubscription =
            this.plTasksService
                .getTasks()
                .pipe()
                .subscribe((res: any) => {
                    const taskGroups = this.filterTasksIntoGroupsAndCheckProirity(res.tasks);
                    this.tasksOnboarding = orderBy(taskGroups['onboarding'], ['xSort'], ['asc']);
                    this.checkAllOnboardingTasksComplete();

                    const list = orderBy(
                        taskGroups['normal'],
                        ['severity', 'age', 'message'],
                        ['asc', 'desc', 'asc'],
                    );
                    this.tasks = list;
                    this.newCount = 0;
                    list.forEach((t: any) => {
                        t.owners.forEach((o: any) => {
                            if (o.user.id === this.currentUser.uuid) {
                                if (!o.read) {
                                    t.isRead = false;
                                    this.newCount++;
                                } else {
                                    t.isRead = true;
                                }
                            }
                        });
                    });
                    this.loadingTasks = false;
                });

        this.plTasksService.refresh();
    }

    filterTasksIntoGroupsAndCheckProirity(tasks: any[]) {
        let lowestPriorityValue = -1;
        let priorityTask = {};
        const groups: any = {
            normal: [],
            onboarding: [],
        };
        const onboardingOrderMap = {
            'onboarding-npin': 10,
            'onboarding-w9-tax-form': 20,
            // "onboarding-contractor-status": 30,
            'onboarding-liability-insurance': 40,
            'onboarding-driver-license': 50,
            'onboarding-orientation': 1,
            'onboarding-provider-lounge': 70,
            'onboarding-telehealth-institute-prime': 5,
            'onboarding-assignment-readiness-check': 7,
            'onboarding-documentation-and-billing': 100,
            // 'onboarding-best-practices': 110,
        };
        tasks.forEach((task: any) => {
            if (task.taskType.code.includes('onboarding-')) {
                // Get owner for this user id since isComplete is in there.
                let isComplete = false;
                for (let ii = 0; ii < task.owners.length; ii++) {
                    if (task.owners[ii].user.id === this.currentUser.uuid) {
                        isComplete = task.owners[ii].isComplete;
                        break;
                    }
                }
                groups.onboarding.push(
                    Object.assign(task, {
                        xSort: onboardingOrderMap[task.taskType.code] || 100,
                        xIsComplete: isComplete,
                        xHidden: isComplete,
                    }),
                );
            } else {
                groups.normal.push(task);
            }
            if (lowestPriorityValue === -1 || task.priority < lowestPriorityValue) {
                lowestPriorityValue = task.priority;
                priorityTask = task;
            }
        });
        if (lowestPriorityValue >= 0 && lowestPriorityValue < 3) {
            this.alertTask = priorityTask;
            // Do not want to show alert if redirecting.
            if (this.currentUser.uuid) {
                this.checkShowAlerts();
            }
        }
        return groups;
    }

    showPriorityAlert(task: any) {
        const secondaryLabel = task.priority === 2 ? 'Later' : null;
        this.plConfirm.show({
            secondaryLabel,
            header: 'Important Task To Complete',
            content: `<div>${task.message}</div>`,
            primaryLabel: 'Continue',
            primaryCallback: () => {
                window.location.href = task.actionUrl;
            },
            secondaryCallback: () => {
                if (task.priority < 2) {
                    window.location.href = task.actionUrl;
                }
            },
            closeCallback: () => {
                if (task.priority < 2) {
                    window.location.href = task.actionUrl;
                }
            },
        });
    }

    checkAllOnboardingTasksComplete() {
        let allComplete = true;
        for (let ii = 0; ii < this.tasksOnboarding.length; ii++) {
            if (!this.tasksOnboarding[ii].xIsComplete) {
                allComplete = false;
                break;
            }
        }
        this.tasksOnboardingAllComplete = allComplete;
    }

    handleTask(t: any) {
        const mutations = t.owners
            .filter((o: any) => o.user.id === this.currentUser.uuid && !o.read)
            .map((o: any) => this.plGraphQL.mutate(updateTaskOwnerQuery, { id: o.id, read: true }, {}));

        forkJoin(mutations)
            .pipe(defaultIfEmpty([]))
            .subscribe((res) => {
                console.log('----- debug newness', res);
                window.location.href = t.actionUrl;
                // window.open(t.actionUrl, '_blank');
            });
    }

    setSchedule() {
        if (this.currentUser.xProvider && this.currentUser.xProvider.timezone) {
            const tz = this.currentUser.xProvider.timezone;
            console.log('--- current user', {
                currentUser: this.currentUser,
                timezone: tz,
            });
            // get today in local timezone representation
            const now = moment();
            const nowLocal = now.tz(tz);

            // get the display string for today in local time
            this.today = nowLocal.format('dddd, MMM D');

            // get the start of today... still in local time
            // NOTE: startOf() mutates the moment object, so must use a clone!
            const startOfToday = nowLocal.clone().startOf('day');

            // get the UTC conversions to use as query start/end date range.
            const schedQueryStart = moment
                .utc(startOfToday)
                .add(1, 'seconds')
                .format('YYYY-MM-DDTHH:mm:ss');
            const schedQueryEnd = moment
                .utc(startOfToday)
                .add(1, 'days')
                .format('YYYY-MM-DDTHH:mm:ss');

            this.plHttp
                .get('appointments', {
                    event_type__in: 'BILLING',
                    provider: this.currentUser.uuid,
                    calendar_view: true,
                    start: schedQueryStart,
                    end: schedQueryEnd,
                })
                .subscribe((res: any) => {
                    const results = res.results;
                    results.forEach((e: any) => {
                        e.billing_expanded = this.plBillingCodes.getFromKey('uuid', e.billing_code);
                        // PL-514: adjust appt display time for repeating event DST crossover
                        const apptInfo = this.util.computeAppointmentLocalDateTimes(e, tz);
                        const localStart = (e.start = apptInfo.apptStart);
                        const localEnd = (e.end = apptInfo.apptEnd);
                        e.time = `${localStart.format('h:mma')}-${localEnd.format('h:mma')}`;

                        // generate lists of comma-separated names and/or locations to avoid extra weight in rendering
                        e.clientList = e.clients.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ');
                        e.locationList = e.locations.map((l: any) => `${l.name}`).join(', ');
                        // add isPast flag to style past appointments
                        if (
                            moment.utc(moment.tz(e.original_start, tz)).isBefore(moment.utc(moment.tz(new Date(), tz)))
                        ) {
                            e.isPast = true;
                        }
                    });
                    results.sort((a: any, b: any) => {
                        return (
                            moment.utc(moment.tz(a.start, tz)).valueOf() - moment.utc(moment.tz(b.start, tz)).valueOf()
                        );
                    });
                    // find and mark last past appointment
                    const i =
                        results.length -
                        1 -
                        results
                            .slice()
                            .reverse()
                            .findIndex((e: any) => e.isPast === true);
                    if (i >= 0 && results[i]) {
                        results[i].lastPast = true;
                    }
                    this.events = results;
                    console.log('----- debug schedule', {
                        todayNowLocal: nowLocal.format(),
                        startOfTodayLocal: startOfToday.format(),
                        queryStartUTC: schedQueryStart,
                        queryEndUTC: schedQueryEnd,
                        timezone: tz,
                        events: this.events,
                    });
                    this.loadingEvents = false;
                    // scroll last past appointment into view with a slight delay to allow for availability
                    setTimeout(() => {
                        const lP = this.Element.nativeElement.querySelector('.past.last');
                        if (lP) {
                            // use scrollTop instead of scrollIntoView because of parent scrolling behavior
                            lP.parentNode.parentNode.scrollTop = lP.offsetTop - lP.parentNode.parentNode.offsetTop;
                        }
                    }, 100);
                });
        } else {
            this.events = [];
            this.loadingEvents = false;
        }
    }

    getColorClass(e: any) {
        if (e.billing_expanded && e.billing_expanded.event_category) {
            return this.colorClasses[e.billing_expanded.event_category.name];
        }
        return 'other';
    }

    copyRoomUrl() {
        const el = document.getElementById('room-url') as HTMLInputElement;
        el.select();
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        this.copied = true;
        window.setTimeout(() => {
            this.copied = false;
        }, 3000);
    }

    isCopied = function() {
        return this.copied;
    };

    onClickSupportChat() {
        const liveagent = window['liveagent'];
        const plLiveAgent = window['plLiveAgent'];
        if (plLiveAgent) {
            console.log(`[plLiveAgent]`, plLiveAgent);
        }
        if (liveagent && plLiveAgent && plLiveAgent.chatAvailable) {
            liveagent.startChat(plLiveAgent.buttonId);
        }
    }

    checkShowAlerts() {
        if (this.alertsToShow.task !== '') {
            if (this.alertsToShow.task === 'yes' && this.alertTask !== null) {
                this.showPriorityAlert(this.alertTask);
            }
        }
    }

    onClickShowPrivatePracticeDetails() {
        let modalRef: any;
        const params = {
            onCancel: () => {
                modalRef._component.destroy();
            },
        };
        this.plModal.create(PLPrivatePracticeModalComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }
}
