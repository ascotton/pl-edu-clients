import { Component, Input } from '@angular/core';

import { first } from 'rxjs/operators';

import { PLSchoolYearsService, PLAccountsService } from '@common/services/';

import { PLModalService } from '@root/index';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';

// rg todo: move to account service
import { PLCustomerDashboardService } from '../../customer-dashboard/pl-customer-dashboard.service';

import { PLAccountSchoolYearDatesFormComponent } from '../pl-account-school-year-dates-form/pl-account-school-year-dates-form.component';
import { PLAccountBlackoutDatesFormComponent } from '../pl-account-blackout-dates-form/pl-account-blackout-dates-form.component';

@Component({
    selector: 'pl-account-overview',
    templateUrl: './pl-account-overview.component.html',
    styleUrls: ['../../../common/less/app/card-section.less', './pl-account-overview.component.less'],
})
export class PLAccountOverviewComponent {
    @Input() account: any;
    @Input() organization: any;
    @Input() canEditDates: boolean;
    @Input() clientStats: any;

    loading: any = { stats: true, keyDates: true, blackoutDates: true };
    contactData: any = {};
    selectedSchoolYearCode: string;
    selectedSchoolYear: any = null;
    studentStats: any;
    canEditSchoolYearDates = false;
    canEditBlackoutDates = false;
    flatKeyDates: any;
    blackoutDates: any[];
    flatBlackoutDates: any[];

    private keyDates: any;
    private userPerms: any;

    constructor(
        private dashboardService: PLCustomerDashboardService,
        private schoolYearService: PLSchoolYearsService,
        private plModal: PLModalService,
        private plAccountsService: PLAccountsService,
        private toastr: ToastrService,
    ) {}

    ngOnInit(): void {
        const owner = this.account.accountOwner;
        const cqm = this.organization.accountCqm;

        this.contactData = {
            accountOwnerEmail: (owner && owner.email) || '',
            accountOwnerName: (owner && `${owner.firstName} ${owner.lastName}`) || '',
            accountOwnerPhone: (owner && owner.profile && owner.profile.primaryPhone) || '',
            accountCqmEmail: (cqm && cqm.email) || '',
            accountCqmName: (cqm && `${cqm.firstName} ${cqm.lastName}`) || '',
            accountCqmPhone: (cqm && cqm.profile && cqm.profile.primaryPhone) || '',
        };

        this.schoolYearService
            .getCurrentSchoolYearCode()
            .pipe(first())
            .subscribe((code: string) => {
                this.selectedSchoolYear = this.schoolYearService.getYearForCode(code);
                this.loadData(code);
            });

        if (this.canEditDates) {
            this.plAccountsService
                .getAccountPermissions(this.organization.sfAccountId, [
                    permissionsMap.MODIFY_KEYDATES,
                    permissionsMap.MODIFY_BLACKOUTDATES,
                ])
                .pipe(first())
                .subscribe((res: any) => {
                    this.userPerms = res;

                    this.canEditSchoolYearDates = this.userPerms[this.organization.sfAccountId].includes(
                        permissionsMap.MODIFY_KEYDATES,
                    );
                    this.canEditBlackoutDates = this.userPerms[this.organization.sfAccountId].includes(
                        permissionsMap.MODIFY_BLACKOUTDATES,
                    );
                });
        }
    }

    onYearSelected(evt: any): void {
        if (this.isDebug()) {
            console.log('-- onYearSelected', { evt, code: this.selectedSchoolYearCode, STATE: this });
        }
        this.selectedSchoolYear = this.schoolYearService.getYearForCode(this.selectedSchoolYearCode);
        this.loadData(evt.model);
    }

    onEditSchoolYearDates() {
        let modalRef: any;

        const params: any = {
            dates: this.getFlatKeyDates(),
            onSave: () => {
                this.plAccountsService
                    .setKeyDates(this.organization.id, this.keyDates)
                    .pipe(first())
                    .subscribe((res: any) => {
                        modalRef._component.destroy();

                        this.flatKeyDates = this.getFlatKeyDates();

                        this.toastr.success('School year dates saved!', 'Complete', {
                            positionClass: 'toast-bottom-right',
                        });
                    }, (error: any) => {
                        console.error(error);

                        this.toastr.error(error.error.detail, 'Error', {
                            positionClass: 'toast-bottom-right',
                        });
                    });
            },
        };

        this.plModal.create(PLAccountSchoolYearDatesFormComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }

    onEditBlackoutDates() {
        let modalRef: any;

        const params: any = {
            year: this.selectedSchoolYear.startYear,
            dates: this.blackoutDates,
            onSave: () => {
                this.plAccountsService
                    .setBlackoutDates(this.organization.id, this.selectedSchoolYear.id, this.blackoutDates)
                    .pipe(first())
                    .subscribe(
                        (res: any) => {
                            modalRef._component.destroy();

                            this.flatBlackoutDates = this.getFlatBlackoutDates();

                            this.toastr.success('Non-service dates saved!', 'Complete', {
                                positionClass: 'toast-bottom-right',
                            });
                        },
                        (error: any) => {
                            console.error(error);

                            Object.keys(error.error).forEach((k: any) => {
                                this.toastr.error(`${k.toUpperCase()}: ${error.error[k]}`, 'Error', {
                                    positionClass: 'toast-bottom-right',
                                });
                            });
                        },
                    );
            },
        };

        this.plModal.create(PLAccountBlackoutDatesFormComponent, params).subscribe((ref: any) => {
            modalRef = ref;
        });
    }

    // --------------------------
    // private methods
    // --------------------------
    private loadData(yearCode: any) {
        const vars = {
            schoolYearCode: this.selectedSchoolYear.code,
            id: this.account.id,
            isLocation: this.account.isLocation,
        };

        this.loading.stats = true;
        this.dashboardService.getStatsServices$(vars, null)
            .subscribe((res: any) => {
                this.loading.stats = false;
                this.studentStats = res.statsServices.statusCounts;
            });

        this.loading.keyDates = true;
        this.plAccountsService
            .getKeyDates(this.organization.id, this.selectedSchoolYear.id)
            .pipe(first())
            .subscribe((res: any) => {
                this.loading.keyDates = false;
                this.keyDates = res;
                this.flatKeyDates = this.getFlatKeyDates();
            });

        this.loading.blackoutDates = true;
        this.plAccountsService
            .getBlackoutDates(this.organization.id, this.selectedSchoolYear.id)
            .pipe(first())
            .subscribe((res: any) => {
                this.loading.blackoutDates = false;
                this.blackoutDates = res;
                this.flatBlackoutDates = this.getFlatBlackoutDates();
            });
    }

    private getFlatKeyDates(): any {
        const dates = {
            start: this.keyDates.find((r: any) => r.type === 'school_year_start'),
            end: this.keyDates.find((r: any) => r.type === 'school_year_end'),
            esyStart: this.keyDates.find((r: any) => r.type === 'ext_school_year_start'),
            esyEnd: this.keyDates.find((r: any) => r.type === 'ext_school_year_end'),
        };

        for (const o of [dates.start, dates.end, dates.esyStart, dates.esyEnd]) {
            o.formattedDate = (o.date)
                ? moment(o.date, 'YYYY-MM-DD HH:mm:ss').format('MM/DD/YYYY')
                : '';
        }

        return dates;
    }

    private getFlatBlackoutDates(): any {
        return Object.keys(this.blackoutDates)
            .filter((k: any) => this.blackoutDates[k].length)
            .map((k: any) => ({ month: k, value: this.blackoutDates[k] }))
            .sort((a: any, b: any) => this.getMonthValue(a.month) - this.getMonthValue(b.month))
        ;
    }

    private getMonthValue(month: any): number {
        switch (month) {
                case 'january':
                    return 7;
                case 'february':
                    return 8;
                case 'march':
                    return 9;
                case 'april':
                    return 10;
                case 'may':
                    return 11;
                case 'june':
                    return 12;
                case 'july':
                    return 1;
                case 'august':
                    return 2;
                case 'september':
                    return 3;
                case 'october':
                    return 4;
                case 'november':
                    return 5;
                case 'december':
                    return 6;
        }
    }

    isDebug() {
        return localStorage.getItem('PL_DEBUG_ACCOUNT_OVERVIEW');
    }
}

const permissionsMap = {
    MODIFY_KEYDATES: 'organization.change_keydate',
    MODIFY_BLACKOUTDATES: 'billing.change_fteblackoutday',
};
