import {
    Input,
    Component,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { trigger, style, state, transition, animate } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { PLFetchReferrals, selectProviderTypesShort } from '@common/store';
// Common
import { PLReferralFilters, Option } from '@common/interfaces';
import { PL_REFERRAL_STATE } from '@common/enums';
import { PLDestroyComponent } from '../pl-destroy.component';

export enum PLReferralFiltersFields {
    State = 'state_In',
    Provider = 'providerId',
    NotScheduled = 'notScheduled',
    MissingInfo = 'isMissingInformation',
    ProviderType = 'providerTypeCode_In',
    ProductType = 'productTypeCode_In',
}

@Component({
    selector: 'pl-referral-filters',
    templateUrl: './pl-referral-filters.component.html',
    styleUrls: ['./pl-referral-filters.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('collapsed', [
            state('true', style({
                height: 0,
                overflow: 'hidden',
            })),
            transition('true <=> false', [
                animate('0.5s'),
            ]),
        ]),
    ],
})
export class PLReferralFiltersComponent extends PLDestroyComponent implements OnInit, OnChanges, OnDestroy {

    private readonly emptyFilters: PLReferralFilters = {
        isScheduled: true,
    };

    private readonly allStates: Option[] = [
        { value: PL_REFERRAL_STATE.Converted, label: 'Converted' },
        { value: PL_REFERRAL_STATE.Matched, label: 'Matched' },
        { value: PL_REFERRAL_STATE.Proposed, label: 'Proposed' },
        { value: PL_REFERRAL_STATE.Unmatched, label: 'Unmatched' },
        { value: PL_REFERRAL_STATE.Open, label: 'Open' },
    ];

    get notScheduled() { return !this.activeFilters.isScheduled; }
    set notScheduled(value: boolean) { this.activeFilters.isScheduled = !value; }

    activeFilters: PLReferralFilters = this.emptyFilters;
    stateOtps: Option[] = this.allStates;
    providerTypeOtps$: Observable<Option[]> = this.store$.select(selectProviderTypesShort);

    @Input() collapsed = true;
    @Input() prefix = '';
    @Input() clearFiltersButtonLabel = 'Clear All Filters';
    @Input() filters: PLReferralFilters = {};
    // TODO: Set what filter you want to dispaly
    @Input() fields: string[] = [
        PLReferralFiltersFields.NotScheduled,
        PLReferralFiltersFields.MissingInfo,
        PLReferralFiltersFields.ProviderType,
        PLReferralFiltersFields.State,
    ];

    constructor(
        private router: Router,
        private store$: Store<AppStore>,
        private activatedRoute: ActivatedRoute) {
        super();
    }

    ngOnInit() {
        this.activatedRoute.queryParams.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(({
            [`${this.prefix}isScheduled`]: isScheduled,
            [`${this.prefix}isMissingInformation`]: isMissingInformation,
            [`${this.prefix}providerTypeCode_In`]: providerTypeCode_In,
            [`${this.prefix}state_In`]: state_In,
            [`${this.prefix}providerId`]: providerId,
        }) => {
            this.activeFilters = {
                ...this.activeFilters,
                providerId,
                isScheduled: isScheduled ? isScheduled === 'true' : true,
                isMissingInformation: isMissingInformation === 'true',
                providerTypeCode_In: providerTypeCode_In ? providerTypeCode_In.split(',') : [],
                state_In: state_In ? state_In.split(',') : [],
            };
            this.store$.dispatch(PLFetchReferrals({ filters: {
                ...this.filters,
                ...this.query(),
            }}));
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        const { filters } = changes;
        if (filters) {
            const { state_In } = this.filters;
            if (state_In) {
                const allowStates = (<string>state_In).split(',');
                this.stateOtps = this.allStates
                    .filter(({ value }) => allowStates.includes(<string>value));
            }
        }
    }

    private prefixObj(obj: any, prefix: string): any {
        const nObj = {};
        Object.keys(obj).forEach(key => nObj[`${prefix}${key}`] = obj[key]);
        return nObj;
    }

    private query(): PLReferralFilters {
        const {
            state_In,
            providerId,
            isScheduled,
            productTypeCode_In,
            providerTypeCode_In,
            isMissingInformation,
        } = this.activeFilters;
        const query: PLReferralFilters = { };
        if (providerId) {
            query.providerId = providerId;
        }
        if (!isScheduled) {
            query.isScheduled = false;
        }
        if (isMissingInformation) {
            query.isMissingInformation = true;
        }
        if (providerTypeCode_In && providerTypeCode_In.length > 0) {
            query.providerTypeCode_In = (<string[]>providerTypeCode_In).join(',');
        }
        if (productTypeCode_In && productTypeCode_In.length > 0) {
            query.productTypeCode_In = (<string[]>productTypeCode_In).join(',');
        }
        if (state_In && state_In.length > 0) {
            query.state_In = (<string[]>state_In).join(',');
        }
        return query;
    }

    clear() {
        this.activeFilters = this.emptyFilters;
        this.filter();
    }

    filter() {
        this.router.navigate([], {
            queryParams: this.prefixObj(this.query(), this.prefix),
            relativeTo: this.activatedRoute,
        });
    }
}
