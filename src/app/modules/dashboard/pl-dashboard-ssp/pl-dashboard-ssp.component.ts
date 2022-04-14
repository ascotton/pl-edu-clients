import { Component } from '@angular/core';

import { first } from 'rxjs/operators';

import { User } from '@modules/user/user.model';
import {
    PLHttpService,
    PLUrlsService,
    PLConfirmDialogService,
    PLModalService,
    PLApiUsStatesService,
} from '@root/index';

import { PLUserAssignment } from '@common/services';
import { PLUserService } from '../../users/pl-user.service';

import { PLOrganizationsService } from '../../organizations/pl-organizations.service';

import { ToastrService } from 'ngx-toastr';

import { PLMeetingsListComponent } from '../pl-meetings-list/pl-meetings-list.component';

import { FormGroup } from '@angular/forms';

import * as moment from 'moment-timezone';
import { PLUserGuidingService } from '@common/services/pl-user-guiding.service';

@Component({
    selector: 'pl-dashboard-ssp',
    templateUrl: './pl-dashboard-ssp.component.html',
    styleUrls: ['./pl-dashboard-ssp.component.less'],
})
export class PLDashboardSSPComponent {
    currentUser: any;

    apps: any[];
    roomUrl = '';
    copied = false;
    equipmentOrderUrl = '';

    liveTrainings: {};
    workshops: {};
    hasWorkshops = false;
    loading = true;

    assignments: PLUserAssignment[] = [];

    showSchoolStaffProvider = false;
    showPrivatePracticeProvider = false;
    showPrivatePracticeProviderAssessments = false;
    licenseInfoIsNeeded = false;
    licenseInfoIsSaving = false;
    licenseInfo = {};
    licenseInfoFormGroup: FormGroup = new FormGroup({});
    stateSelectOpts: any[] = [];
    readonly licenseTypeSPSelectOpts: any[] = [
        { value: 'Certified Psychologist', label: 'Certified Psychologist' },
        { value: 'Educational Diagnostician', label: 'Educational Diagnostician' },
        { value: 'Licensed Psychologist', label: 'Licensed Psychologist' },
        { value: 'Psychological Examiner', label: 'Psychological Examiner' },
        { value: 'School Psychologist', label: 'School Psychologist' },
        { value: 'Psychiatrist', label: 'Psychiatrist' },
    ];
    readonly licenseTypeSLPSelectOpts: any[] = [
        { value: 'Speech-Language Pathologist', label: 'Speech-Language Pathologist' },
        { value: 'Audiologist', label: 'Audiologist' },
    ];
    licenseTypeSelectOpts: any[];

    TYPE_REGISTRATION = TYPE_REGISTRATION;
    TYPE_UPCOMING = TYPE_UPCOMING;

    constructor(
        private plUrls: PLUrlsService,
        private plHttp: PLHttpService,
        private plConfirm: PLConfirmDialogService,
        private toastr: ToastrService,
        private plModal: PLModalService,
        private plUserService: PLUserService,
        private plOrganizationsService: PLOrganizationsService,
        private plStates: PLApiUsStatesService,
        private userGuiding: PLUserGuidingService,
    ) {
    }

    ngOnInit() {
        // hide navigation until we're ready for it
        this.setNav(false);
        const user$ = this.userGuiding.facade.getCurrentUser();

        this.userGuiding.addUserGuiding('491585731ID');
        user$.subscribe((u: User) => {
            this.currentUser = u;
            this.setApps();
            const isSSP = this.isSchoolStaffProvider();
            const isPPP = this.isPrivatePracticeProvider();
            if (isSSP && !isPPP) {
                this.setNav(true);
                this.refreshData();
                this.getUserAssignments(u);
                this.showSchoolStaffProvider = true;
            } else {
                if (this.isSLPAssessmentsUser() || this.isSPAssessmentsUser()) {
                    this.showPrivatePracticeProviderAssessments = true;

                    if (this.isSLPAssessmentsUser()) {
                        this.licenseTypeSelectOpts = this.licenseTypeSLPSelectOpts;
                    } else {
                        this.licenseTypeSelectOpts = this.licenseTypeSPSelectOpts;
                    }

                    this.plHttp.get('privatePractice').subscribe((res: any) => {
                        const credentials_data = res.results && res.results.length > 0 && res.results[0]['credentials_data'];
                        if (res.results && res.results.length > 0 && !credentials_data) {
                            this.licenseInfoIsNeeded = true;
                            this.stateSelectOpts = this.plStates.getOpts();
                        } else {
                            this.setPrivatePracticeProvider();
                        }
                    });
                } else {
                    this.setPrivatePracticeProvider();
                }
            }
        });
    }

    private setNav(show: boolean) {
        const elements = document.getElementsByClassName('pl-app-nav-links') as HTMLCollectionOf<HTMLElement>;
        if (elements && elements.length > 0) elements[0].style.display = (show) ? 'block' : 'none';
    }

    private setPrivatePracticeProvider() {
        this.showPrivatePracticeProvider = true;
        this.setNav(true);

        let planType = '';
        if (this.isSLPAssessmentsUser()) {
            planType = 'SLP';
        } else if (this.isSPAssessmentsUser()) {
            planType = 'SP';
        } else {
            planType = 'Basic';
        }
        this.userGuiding.runScript(`userGuiding.track("segment", { private_practice_plan: '${planType}', }); setTimeout(function() { userGuiding.previewGuide(32032, { checkHistory: true, }); }, 1000);`);
    }

    refreshData() {
        this.loading = true;
        this.liveTrainings = {};
        this.workshops = {};
        this.hasWorkshops = false;

        const params: any = {};

        const tz = moment().tz(moment.tz.guess()).format('z');

        // first get registered
        this.plHttp
            .get('', params, this.plUrls.urls.zoomMeetingRegistrations)
            .pipe(first())
            .subscribe((res: any) => {
                for (const r of res.results) {
                    const i = r.meeting_instance;
                    const m = r.meeting_instance.meeting;

                    // simulate attended or about to start
                    //  r.attended = true
                    //  i.start_time = moment()

                    const obj = {
                        uuid: r.uuid,
                        formattedTime: '',
                        joinUrl: '',
                        attended: r.attended,
                        canCancel: false,
                        waitUntilTomorrow: false,
                    };

                    // convert to local time
                    const d = moment(i.start_time);

                    obj.formattedTime = `${d.format('dddd, M/D/YYYY h:mmA')} - ${d.clone().add(i.duration, 'minute').format('h:mmA')} ${tz}`;

                    // get time until meeting; "-60" means one hour in the future
                    const minutesAgo = moment().diff(d, 'minute');

                    // show the join url if we're close to meeting time
                    if (-15 <= minutesAgo && minutesAgo < i.duration) {
                        obj.joinUrl = r.join_url;
                    }

                    // show cancel if it's far enough in the future
                    if (!obj.attended && minutesAgo < -15) {
                        obj.canCancel = true;
                    }

                    const isWorkshop = (m.topic.indexOf(CLINICAL_WORKSHOP) !== -1);
                    const regDict = (isWorkshop) ? this.workshops : this.liveTrainings;

                    if (!regDict[m.topic]) {
                        regDict[m.topic] = {
                            title: m.topic,
                            TYPE_REGISTRATION: [],
                            TYPE_UPCOMING: [],
                        };
                    }
                    regDict[m.topic][TYPE_REGISTRATION].push(obj);
                }

                this.plHttp
                    .get('', params, this.plUrls.urls.zoomMeetings)
                    .pipe(first())
                    .subscribe((res2: any) => {
                        this.loading = false;

                        for (const r of res2.results) {
                            const m = r.meeting;

                            const obj = {
                                uuid: r.uuid,
                                formattedTime: '',
                            };

                            // convert to local time
                            const d = moment(r.start_time);
                            obj.formattedTime = `${d.format('dddd, M/D/YYYY h:mmA')} - ${d.add(r.duration, 'minute').format('h:mmA')} ${tz}`;

                            const isWorkshop = (m.topic.indexOf(CLINICAL_WORKSHOP) !== -1);
                            const upcomingDict = (isWorkshop) ? this.workshops : this.liveTrainings;

                            if (!upcomingDict[m.topic]) {
                                upcomingDict[m.topic] = {
                                    title: m.topic,
                                    TYPE_REGISTRATION: [],
                                    TYPE_UPCOMING: [],
                                };
                            }

                            if (isWorkshop) this.hasWorkshops = true;

                            // add to upcoming if we're not already registered for it
                            if (!upcomingDict[m.topic][TYPE_REGISTRATION].some(
                                (x: any) => x.formattedTime === obj.formattedTime)) {

                                upcomingDict[m.topic][TYPE_UPCOMING].push(obj);
                            }
                        }
                    });
            });
    }

    onShowMeetings(title: any, items: any, isWorkshop: boolean) {
        let modalRef: any;

        const subtitle = (isWorkshop) ? CLINCIAL_WORKSHOP_SUBTITLE : TRAINING_SUBTITLE;

        const params: any = {
            items,
            title,
            subtitle,
            onSelect: (item: any) => {
                this.onRegister(item);

                modalRef._component.destroy();
            },
        };

        this.plModal.create(PLMeetingsListComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }

    onRegister(item: any) {
        this.plConfirm.show({
            header: 'Confirm Selection',
            content: `You have selected:<br /><br /><b>${item.formattedTime}</b><br /><br />Is this correct?`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => {
                const data = {
                    meeting_instance_uuid: item.uuid,
                };

                item.saving = true;

                this.plHttp
                    .save('', data, this.plUrls.urls.zoomMeetingRegistrations)
                    .pipe(first())
                    .subscribe((res: any) => {
                        item.saving = false;
                        this.toastr.success('You\'re all set!', 'Registration Complete', {
                            positionClass: 'toast-bottom-right',
                        });

                        this.refreshData();
                    });
            },
            secondaryCallback: () => { },
            closeCallback: () => { },
        });
    }

    onCancel(m: any) {
        this.plConfirm.show({
            header: 'Confirm Cancellation',
            content: `Are you sure you want to cancel this registration?<br /><br /><b>${m.formattedTime}</b>`,
            primaryLabel: 'Yes',
            secondaryLabel: 'No',
            primaryCallback: () => {
                const data = {
                    status: 'cancel',
                };

                this.loading = true;

                this.plHttp
                    .put('', data, `${this.plUrls.urls.zoomMeetingRegistrations}${m.uuid}/`)
                    .pipe(first())
                    .subscribe((res: any) => {
                        this.toastr.success('Your registration has been cancelled.', 'Cancellation Complete', {
                            positionClass: 'toast-bottom-right',
                        });

                        this.refreshData();
                    });
            },
            secondaryCallback: () => { },
            closeCallback: () => { },
        });
    }

    setApps() {
        const apps: any[] = [{
            hrefAbsolute: 'https://presencelearning.helpjuice.com/',
            icon: 'people-question',
            label: 'Help Center',
            description: 'Get the help you need.',
        }];

        // if (this.isSchoolStaffProvider() && !this.isPrivatePracticeProvider()) {
        apps.push({
            href: `/landing/launch-coassemble`,
            isNewWindow: true,
            icon: 'graduation-hat',
            label: 'Telehealth Institute',
            description: 'Access and complete your training courses.',
        });
        // }

        this.apps = apps;
        this.roomUrl = `${this.plUrls.urls.roomFE}/${this.currentUser.username}`;
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

    canClickSaveLicenseInfo() {
        return this.licenseInfoFormGroup.valid && !this.licenseInfoIsSaving;
    }

    onClickSaveLicenseInfo() {
        this.licenseInfoIsSaving = true;

        const data = {
            credentials_data: JSON.stringify(this.licenseInfo),
        };
        this.plHttp.save('privatePractice', data).subscribe((res: any) => {
            this.licenseInfoIsNeeded = false;
            this.setPrivatePracticeProvider();
        });
    }

    private isSchoolStaffProvider() {
        const user = this.currentUser;
        return user && user.groups && user.groups.some((g: any) => g.indexOf('School Staff Providers') > -1);
    }

    private isPrivatePracticeProvider() {
        const user = this.currentUser;
        return user && user.groups && user.groups.some((g: any) => g.indexOf('Private Practice') > -1);
    }

    private isSLPAssessmentsUser() {
        const user = this.currentUser;
        return user && user.groups && user.groups.some((g: any) => g.indexOf('Private Practice - SLP') > -1);
    }

    private isSPAssessmentsUser() {
        const user = this.currentUser;
        return user && user.groups && user.groups.some((g: any) => g.indexOf('Private Practice - SP') > -1);
    }

    private getUserAssignments(user: User) {
        this.plUserService.getUserOnce(user.uuid).subscribe({
            next: (account: { assignments: PLUserAssignment[] }) => {
                if (account.assignments.length === 0) return;

                const orgId = account.assignments[0].orgID;

                if (orgId) {
                    this.plOrganizationsService.orgOverviewById(orgId).pipe().subscribe((org: any) => {
                        this.equipmentOrderUrl =
                            `https://www.tfaforms.com/4851548?tfa_1=${encodeURIComponent(user.first_name)}` +
                            `&tfa_2797=${encodeURIComponent(user.last_name)}` +
                            `&tfa_2=${encodeURIComponent(user.email)}` +
                            `&tfa_2826=${org.salesforceId}`;
                    });
                }
            },
        });
    }
}

const CLINICAL_WORKSHOP = 'Office Hours';
const CLINCIAL_WORKSHOP_SUBTITLE = 'Get quick access and answers to your questions from experienced teletherapists.';
const TRAINING_SUBTITLE = 'Learn to apply web-based training and leverage interactive tools in this LIVE training.';
const TYPE_REGISTRATION = 'TYPE_REGISTRATION';
const TYPE_UPCOMING = 'TYPE_UPCOMING';
