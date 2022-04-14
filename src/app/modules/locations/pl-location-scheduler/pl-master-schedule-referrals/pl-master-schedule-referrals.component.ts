import {
    Input,
    Output,
    Component,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
// RxJs
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { selectReferralsState } from '@common/store';
import { selectCurrentLocationId, PLClearReferralSchedule } from '../../store';
// Common
import { referralIntervalOptions } from '@common/services/pl-client-referral';
import { PLReferralFiltersFields } from '@common/components';
import {
    PL_GROUPING,
    PL_INTERVAL,
    PLReferral,
    PLReferralFilters,
    PLProviderProfile,
} from '@common/interfaces';
import { PL_REFERRAL_STATE } from '@common/enums';
// Services
import { PLLocationSchedulerService } from '../../services';

import { PLProviderSession } from '../../models';
import {
    PLModalService,
    PLConfirmDialogService,
} from '@root/src/lib-components';

import { PLClientReferralMatchComponent } from '../../../client-referrals/pl-client-referral-match/pl-client-referral-match.component';
import { PLUpdateReferral } from '@root/src/app/common/store/common.store';

@Component({
    selector: 'pl-master-schedule-referrals',
    templateUrl: './pl-master-schedule-referrals.component.html',
    styleUrls: ['./pl-master-schedule-referrals.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLMasterScheduleReferralsComponent implements OnChanges {

    private grades: string[] = [
        'Before Pre-K',
        'Pre-K',
        'Kindergarten',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        'Adult',
    ];

    private grouping =  false;
    readonly meterColor = '#85d4f8';
    readonly meterBackgroundColor = 'white';
    readonly storeKeys = {
        referrals: 'PL_LOCATION_SCHEDULER_SelectedReferrals',
    };
    readonly loading$ = this.store$.select(selectReferralsState)
        .pipe(map(({ loading }) => loading));
    readonly referrals$ = this.store$.select(selectReferralsState)
        .pipe(map(({ results }) => results));
    // Hack for update referrals on Providers Changed
    readonly sort$: BehaviorSubject<void> = new BehaviorSubject(null);
    readonly list$ = combineLatest([
        this.referrals$,
        this.sort$,
    ]).pipe(
        map(([referrals]) => this.sortReferrals(referrals)));

    referralFilters$: Observable<PLReferralFilters> = this.store$.select(selectCurrentLocationId)
        .pipe(
            // Selected School Year is taken directly from the store
            map(clientLocationId_In => ({
                clientLocationId_In,
                state_In: this.providerView ?
                    `${PL_REFERRAL_STATE.Converted},${PL_REFERRAL_STATE.Matched}` :
                    `${PL_REFERRAL_STATE.Converted},${PL_REFERRAL_STATE.Matched},${PL_REFERRAL_STATE.Unmatched},${PL_REFERRAL_STATE.Open},${PL_REFERRAL_STATE.Proposed}`,
                productTypeCode_In: 'direct_service',
            })),
        );

    @Input() disabled = false;
    @Input() providerView = false;
    @Input() mayEdit = true;
    @Input() selection: PLReferral[] = [];
    @Input() filterBy: PLReferralFiltersFields[] = [];
    @Input() calendar: PLProviderSession[] = [];
    @Input() providers: PLProviderProfile[] = [];
    @Output() readonly selectionChange: EventEmitter<PLReferral[]> = new EventEmitter();

    constructor(
        private store$: Store<AppStore>,
        private plModal: PLModalService,
        private plConfirm: PLConfirmDialogService,
        private plLocationScheduler: PLLocationSchedulerService) {
    }

    ngOnInit() {
        this.referrals$
            // .pipe(takeUntil())
            .subscribe((referrals) => {
                const storedReferrals = sessionStorage.getItem(this.storeKeys.referrals);
                if (storedReferrals) {
                    const selectedProviders: string[] = JSON.parse(storedReferrals);
                    this.setSelection(referrals.filter(r => selectedProviders.includes(r.id)), true);
                }
            });
    }

    ngOnChanges(changes: SimpleChanges) {
        const { disabled, providers } = changes;
        if (disabled && this.disabled) {
            this.clearSelection();
        }
        if (providers && !providers.firstChange) {
            this.sort$.next();
        }
    }

    private setSelection(value: PLReferral[], sort = false) {
        this.selection = value;
        sessionStorage.setItem(this.storeKeys.referrals, JSON.stringify(value.map(r => r.id)));
        this.selectionChange.emit(this.selection);
    }

    private openProviderMatch(referral: PLReferral, wiilDelete = false): void {
        const params: any = {
            referral,
            client: referral.client,
        };
        this.plModal.create(PLClientReferralMatchComponent, params).subscribe((modalReference: any) => {
            const modal = modalReference.instance;
            const afterUpdate = (newReferral: PLReferral) => {
                this.store$.dispatch(PLUpdateReferral({ referral: newReferral }));
                if (wiilDelete) {
                    this.store$.dispatch(PLClearReferralSchedule({ referralId: referral.id }));
                }
                modal.destroy();
            };
            modal.match.subscribe(({ referral: newReferral }: { referral: PLReferral }) => {
                // const message = `Match confirmed. ${this.providerName(newReferral)} has been notified`;
                // this.toast.success(message, 'Confirmed', this.toastrOptionsDefault);
                afterUpdate(newReferral);
            });

            modal.proposeMatch.subscribe(({ referral: newReferral }: { referral: PLReferral }) => {
                const clientName = `${newReferral.client.firstName} ${newReferral.client.lastName}`;
                // const message = `${this.providerName(newReferral)} has been proposed as a match for ${clientName}.`;
                // this.toast.success(message, 'Proposed Match', this.toastrOptionsDefault);
                afterUpdate(newReferral);
            });
            modal.cancel.subscribe(() => modal.destroy());
        });
    }

    intervalMapper(interval: PL_INTERVAL) {
        const mapper = {
            [PL_INTERVAL.Annual]: 'Annual',
            [PL_INTERVAL.Quarter]: 'Quarter',
            [PL_INTERVAL.Month]: 'Month',
            [PL_INTERVAL.Week]: 'Week',
            [PL_INTERVAL.Day]: 'Day',
            [PL_INTERVAL.Semester]: 'Per Semester',
            [PL_INTERVAL.Every2Weeks]: 'Every 2 weeks',
            [PL_INTERVAL.Every3Weeks]: 'Every 3 weeks',
            [PL_INTERVAL.Every4Weeks]: 'Every 4 weeks',
            [PL_INTERVAL.Every5Weeks]: 'Every 5 weeks',
            [PL_INTERVAL.Every6Weeks]: 'Every 6 weeks',
            [PL_INTERVAL.Every7Weeks]: 'Every 7 weeks',
            [PL_INTERVAL.Every8Weeks]: 'Every 8 weeks',
            [PL_INTERVAL.Every9Weeks]: 'Every 9 weeks',
            [PL_INTERVAL.Every10Weeks]: 'Every 10 weeks',
            [PL_INTERVAL.Every11Weeks]: 'Every 11 weeks',
        };
        const intervalOpt = referralIntervalOptions
            .find(({ value }) => value === interval);
        return mapper[interval] ||
            (intervalOpt ? intervalOpt.label : interval);
    }

    stateMapper(state: PL_REFERRAL_STATE) {
        const mapper = {
            [PL_REFERRAL_STATE.Converted]: 'Converted',
            [PL_REFERRAL_STATE.Matched]: 'Matched',
            [PL_REFERRAL_STATE.Proposed]: 'Proposed',
            [PL_REFERRAL_STATE.Unmatched]: 'Unmatched',
            [PL_REFERRAL_STATE.Open]: 'Open',
        };
        return mapper[state];
    }

    gradeName(grade: any) {
        if (isNaN(grade)) {
            return grade;
        }
        const ordinalNames = {
            1: 'st',
            2: 'nd',
            3: 'rd',
        };
        const ordinalName = ordinalNames[grade] || 'th';
        return `${grade}${ordinalName} Grade`;
    }

    editReferralProvider(referral: PLReferral) {
        const sessions = this.calendar.filter(c => c.referralIds.includes(referral.id));
        if (sessions.length > 0) {
            this.plConfirm.show({
                header: 'Warning',
                content: `Referrals scheduled with the current provider will be deleted.<br/>Do you want to continue?`,
                primaryLabel: 'Yes',
                secondaryLabel: 'No',
                primaryCallback: () => this.openProviderMatch(referral, true),
            });
        } else {
            this.openProviderMatch(referral);
        }
    }

    sortReferrals(list: PLReferral[]): PLReferral[] {
        if (!list) {
            return [];
        }
        let _list = list;
        if (this.providerView) {
            _list = _list.filter(r => r.state !== PL_REFERRAL_STATE.Proposed);
        }
        _list = ([..._list]).sort((A, B) => {
            const { client: cA, provider: pA, grade: gA, isMissingInformation: miA } = A;
            const { client: cB, provider: pB, grade: gB, isMissingInformation: miB } = B;
            const rAProvider = pA ? `${pA.lastName} ${pA.firstName}` : '';
            const rBProvider = pB ? `${pB.lastName} ${pB.firstName}` : '';
            const rAClient = `${cA.lastName} ${cA.firstName}`;
            const rBClient = `${cB.lastName} ${cB.firstName}`;
            const gAIdx = this.grades.indexOf(gA) + 1;
            const gBIdx = this.grades.indexOf(gB) + 1;
            return rAProvider.localeCompare(rBProvider)
                || (miA === miB ? 0 : miA ? 1 : -1)
                || (gAIdx - gBIdx)
                || rAClient.localeCompare(rBClient);
        });
        const providerIds = this.providers.map(({ user }) => user.id);
        const _noProviders = _list.filter(({ provider }) => !provider);
        _list = _list.filter(({ provider }) => !!provider);
        const providerSelected = _list.filter(({ provider }) => providerIds.includes(provider.id));
        return [
            ...providerSelected.filter(({ id }) => !!this.selection.find(s => s.id === id)),
            ...providerSelected.filter(({ id }) => !this.selection.find(s => s.id === id)),
            ..._list.filter(({ provider }) => !providerIds.includes(provider.id)),
            ..._noProviders,
        ];
    }

    getFullfillment(referral: PLReferral): { scheduledTime: number; expectedTime: number; } {
        const blockIntervals = [
            PL_INTERVAL.Quarter,
            PL_INTERVAL.Annual,
            PL_INTERVAL.Semester,
            PL_INTERVAL.Every2Weeks,
            PL_INTERVAL.Every3Weeks,
            PL_INTERVAL.Every4Weeks,
            PL_INTERVAL.Every5Weeks,
            PL_INTERVAL.Every6Weeks,
            PL_INTERVAL.Every7Weeks,
            PL_INTERVAL.Every8Weeks,
            PL_INTERVAL.Every9Weeks,
            PL_INTERVAL.Every10Weeks,
            PL_INTERVAL.Every11Weeks,
        ];
        return referral.isMissingInformation || blockIntervals.includes(referral.interval) ? null :
            this.plLocationScheduler.referralFullfillment(referral,
                this.calendar.filter(c => c.referralIds.includes(referral.id)));
    }

    isSelected(referral: PLReferral): boolean {
        return !!this.selection.find(({ id }) => referral.id === id);
    }

    isReferralDisabled(referral: PLReferral): boolean {
        // TODO: Optimize
        let disabled = this.disabled ||
            referral.isMissingInformation ||
            !this.providers.find(p => referral.provider ? p.user.id === referral.provider.id : false);
        if (!disabled && !this.isSelected(referral)) {
            const providerType = this.selection.length > 0 ?
                this.selection[0].providerType.shortName : null;
            disabled = this.selection.length > 0 ?
                this.grouping ?
                    referral.grouping === PL_GROUPING.Individual || providerType !== referral.providerType.shortName :
                    !referral.active
                : false;
        }
        return disabled;
    }

    toggleSelection(value: PLReferral, checked: any) {
        let selection = this.selection.filter(r => r.id !== value.id);
        if (checked) {
            this.grouping = value.grouping !== PL_GROUPING.Individual;
            selection = [...selection, value];
        }
        this.setSelection(selection, true);
    }

    clearSelection() {
        this.grouping = false;
        this.setSelection([]);
    }
}
