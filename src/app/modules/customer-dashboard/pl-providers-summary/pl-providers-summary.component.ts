import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { first } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import { PLUtilService, PLComponentStateInterface } from '@common/services';

// tslint:disable-next-line: no-require-imports
const providerStatisticsQuery = require('../queries/provider-statistics.graphql');

@Component({
    selector: 'pl-providers-summary',
    templateUrl: './pl-providers-summary.component.html',
    styleUrls: ['./pl-providers-summary.component.less'],
})
export class PLProvidersSummaryComponent implements OnInit, OnDestroy {
    @Input() organizationId: any;
    @Input() locationId: any;

    componentName = 'PLProvidersSummaryComponent';
    _state: any;

    providersByType: any[] = [];
    providersTotalText = '';

    constructor(private plGraphQL: PLGraphQLService, private util: PLUtilService) {}

    // --------------------------
    // lifecycle methods
    // --------------------------
    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.componentName,
            params: {
                flags: {
                    // COMPONENT_INIT: 1,
                    // RUN_TEST: 1,
                },
                mocks: [],
            },
            afterDoneFn: (state: PLComponentStateInterface) => {
                state.init = true;
            },
            fn: (state: PLComponentStateInterface, done) => {
                state.asyncCount = 1;

                this.getStats(state, done);
            },
        });
    }

    ngOnDestroy(): void {
        this.util.destroyComponent(this._state);
    }

    // tslint:disable-next-line: use-life-cycle-interface
    ngOnChanges(changes: any) {
        if (!this._state || !this._state.init) return;

        this.getStats(this._state, () => {});
    }

    private getStats(state: PLComponentStateInterface, done: any) {
        const vars: any = {};

        if (this.locationId) vars.locationId = this.locationId;
        else vars.organizationId = this.organizationId;

        this.plGraphQL
            .query(providerStatisticsQuery, vars, {})
            .pipe(first())
            .subscribe((res: any) => {
                state.model.data.providerProfiles = res.providerProfiles;
                let total = res.providerProfiles.totalCount;
                const providersByType: any[] = [];
                if (res.providerProfiles.statistics && res.providerProfiles.statistics.providerTypes) {
                    res.providerProfiles.statistics.providerTypes.forEach((providerType: any) => {
                        // Do NOT want to include sped. Not this assumes sped is not also another provider type,
                        // in which case we may show a total less than we want.
                        // TODO - filter out from backend.

                        // rg: huh? //

                        const type = providerType.providerType;
                        if (type.code === 'sped') {
                            total = total - providerType.count;
                        } else {
                            providersByType.push({
                                count: providerType.count,
                                label: this.util.flag(state, 'PROVIDER_TYPE_SHORT_NAME') ? type.code : type.longName,
                            });
                        }
                    });
                    this.providersByType = state.providersByType = providersByType;
                    this.providersTotalText = state.providersTotal = `${total}`;
                }

                done();
            });
    }
}
