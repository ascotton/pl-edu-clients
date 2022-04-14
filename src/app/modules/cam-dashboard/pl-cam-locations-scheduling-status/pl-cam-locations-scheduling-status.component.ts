import { Component } from '@angular/core';

import { first } from 'rxjs/operators';

import { PLGraphQLService } from '@root/index';
import { PLSchoolYearsService } from '@root/src/app/common/services';
import { ActivatedRoute } from '@angular/router';
import { PLCamDashboardTabsService } from '../pl-cam-dashboard-tabs.service';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-cam-locations-scheduling-status',
    templateUrl: './pl-cam-locations-scheduling-status.component.html',
    styleUrls: ['./pl-cam-locations-scheduling-status.component.less'],
})
export class PLCamLocationsSchedulingStatusComponent {
    totalCount = 0;
    loading = false;
    locations: any[] = [];
    selectedSchoolYearCode: string;
    tabs: PLSubNavigationTabs[] = [];

    private tableQueryCache: any = null;

    constructor(
        private tabService: PLCamDashboardTabsService,
        private plGraphQL: PLGraphQLService,
        private schoolYearService: PLSchoolYearsService,
        private route: ActivatedRoute,
    ) {
    }

    ngOnInit(): void {
        this.tabs = this.tabService.tabs();

        this.schoolYearService
            .getCurrentSchoolYearCode()
            .pipe(first())
            .subscribe((schoolYearCode: any) => {
                this.route.queryParams.subscribe((params: any) => {
                    if (params.schoolYearCode) {
                        this.selectedSchoolYearCode = params['schoolYearCode'];
                    } else {
                        this.selectedSchoolYearCode = schoolYearCode;
                    }

                    if (this.tableQueryCache) this.onQuery({ query : this.tableQueryCache });
                });
            });
    }

    handleSelectedSchoolYearChange(schoolYearCode: string): void {
        this.selectedSchoolYearCode = schoolYearCode;
        this.onQuery({ query : this.tableQueryCache });
    }

    onQuery({ query }: { query: any }) {
        this.tableQueryCache = query;

        if (!this.selectedSchoolYearCode) {
            return;
        }

        this.loading = true;

        query.offset = (query.page - 1) * query.first;
        query.schoolYearCode = this.selectedSchoolYearCode;

        this.plGraphQL
            .query(GQL_GET_LOCATIONS_REFERRAL_STATS, query, {})
            .pipe(first())
            .subscribe(
                (res: any) => {
                    this.loading = false;
                    this.locations = res.statsReferralsByLocation;
                    this.totalCount = res.statsReferralsByLocation_totalCount;
                },
            );
    }

    getBackgroundColor(location: any) {
        const value = location.referralsUnscheduledCount / (location.referralsCount * 1.0);
        const hue = ((1 - value) * 100).toString(10);

        return ['hsl(', hue, ',90%,75%)'].join('');
    }

    getWidth(location: any) {
        if (location.referralsCount === 0) return 0;

        const value =
            (location.referralsCount - location.referralsUnscheduledCount) / (location.referralsCount * 1.0) * 100;

        return Math.max(value, 5);
    }

    getText(location: any) {
        return `${location.referralsCount - location.referralsUnscheduledCount} / ${location.referralsCount}`;
    }
}

const GQL_GET_LOCATIONS_REFERRAL_STATS = `
    query getStatsReferralsByLocation(
        $first: Int,
        $offset: Int,
        $schoolYearCode: String!,
        $accountCamId: UUID,
    ) {
        statsReferralsByLocation(
            first: $first,
            offset: $offset,
            schoolYearCode: $schoolYearCode,
            accountCamId: $accountCamId,
            orderByScheduledCount: true
        ) {
            totalCount
            edges {
                node {
                    uuid
                    name
                    orgName
                    referralsCount
                    referralsUnscheduledCount
                    camFirstName
                    camLastName
                }
            }
        }
    }
`;
