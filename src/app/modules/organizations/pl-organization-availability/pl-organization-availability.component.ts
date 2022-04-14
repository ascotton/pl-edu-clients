import { Component, OnDestroy, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import { PLBrowserService, PLGraphQLService, PLConfirmDialogService } from '@root/index';

import { PLOrganizationsService } from '../pl-organizations.service';

import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';

import { PLSchoolYearsService } from '@common/services';

@Component({
    selector: 'pl-organization-availability',
    templateUrl: './pl-organization-availability.component.html',
    styleUrls: ['../../../common/less/app/card-section.less', './pl-organization-availability.component.less'],
})
export class PLOrganizationAvailabilityComponent implements OnDestroy, OnInit, CanComponentDeactivate {
    private org: any;
    private orgSubscription: any = null;

    loading: Boolean = true;
    loadingData: Boolean = true;
    locations: any = [];
    availabilities: any = [];
    location: any;
    selectedSchoolYear: String;
    isDirty = false;

    total: number;

    private unload: any;

    constructor(
        private plGraphQL: PLGraphQLService,
        private plOrganizationsService: PLOrganizationsService,
        private schoolYearService: PLSchoolYearsService,
        private plConfirm: PLConfirmDialogService,
    ) {}

    ngOnInit(): void {
        this.schoolYearService
            .getCurrentSchoolYearCode()
            .pipe(first())
            .subscribe((year: string) => {
                this.selectedSchoolYear = year;

                this.orgSubscription = this.plOrganizationsService.currentOrgDetails().subscribe((org: any) => {
                    this.org = org;

                    this.plOrganizationsService
                        .locationsByOrgId(this.org.id, { first: 1000, orderBy: 'name' })
                        .subscribe(({ locations, totalCount }) => {
                            this.locations = locations;
                            this.total = totalCount;

                            this.loading = false;
                            this.loadData();
                        });
                });
            });

        this.unload = (event: any) => {
            if (this.isDirty) event.returnValue = 'Are you sure you want to close this window?';
        };

        window.addEventListener('beforeunload', this.unload);
    }

    ngOnDestroy(): void {
        this.orgSubscription.unsubscribe();
        window.removeEventListener('beforeunload', this.unload);
    }

    canDeactivate() {
        return new Observable<boolean>((observer: any) => {
            if (!this.isDirty) {
                observer.next(true);
                return;
            }

            this.plConfirm.show({
                header: 'Unsaved Changes',
                content:   `<div style="padding-bottom:12px;">Are you sure you want to exit?</div>
                            <div>Click 'Yes' to exit (and lose any changes), or 'No' to return.</div>`,
                primaryLabel: 'Yes',
                secondaryLabel: 'No',
                primaryCallback: () => {
                    observer.next(true);
                },
                secondaryCallback: () => {
                    observer.next(false);
                },
                closeCallback: () => {
                    observer.next(false);
                },
            });
        });
    }

    onClickLocation(location: any) {
        this.canDeactivate().subscribe(
            (result: any) => {
                if (result) {
                    this.isDirty = false;
                    this.location = location;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
        );
    }

    onIsDirtyChanged(isDirty: boolean) {
        if (this.isDirty && !isDirty) this.loadData();

        this.isDirty = isDirty;
    }

    onYearSelected(year: string): void {
        this.selectedSchoolYear = year;

        this.loadData();
    }

    loadData() {
        if (this.org) {
            this.loadingData = true;
            const selectedLocationId = (this.location) ? this.location.id : null;

            // get
            const payload = {
                organizationId: this.org.id,
                schoolYear: this.selectedSchoolYear,
            };

            this.plGraphQL
                .query(GQL_GET_AVAILABILITY, payload, { debug: false })
                .pipe(first())
                .subscribe(
                    (res: any) => {
                        let lastId;
                        const availabilities = [];

                        for (const b of res.locationAvailabilityBlocks) {
                            const id = b.location.id;
                            if (id !== lastId) {
                                const obj = {
                                    id,
                                    location: b.location,
                                    name: b.location.name,
                                    totalHours: 0,
                                    hours: Array<any>(),
                                };

                                availabilities.push(obj);
                                lastId = id;

                                if (b.location.id === selectedLocationId) this.location = b.location;
                            }

                            const start = new Date('1/1/2000 ' + b.start).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                            });
                            const end = new Date('1/1/2000 ' + b.end).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                            });

                            availabilities[availabilities.length - 1].hours.push({
                                start,
                                end,
                                dayPos: this.getPosFromDay(b.dayName),
                                day: this.getDayAbbr(b.dayName),
                                availableStations: b.availableStations,
                            });

                            availabilities[availabilities.length - 1].totalHours += b.totalHours;
                        }

                        for (const b of availabilities) {
                            b.hours.sort((a2, b2) => {
                                return a2.dayPos - b2.dayPos;
                            });
                        }

                        // add locations with no availability
                        for (const l of this.locations) {
                            if (availabilities.filter(x => x.id === l.id).length === 0) {
                                availabilities.push({ id: l.id, location: l, name: l.name, totalHours: 0, hours: [] });
                            }
                        }

                        this.availabilities = availabilities;

                        this.loadingData = false;
                    },
                    (err: any) => {
                        console.error(err);

                        this.loadingData = false;
                    },
                );
        }
    }

    private getPosFromDay(day: String) {
        switch (day) {
                case 'Monday':
                    return 0;
                case 'Tuesday':
                    return 1;
                case 'Wednesday':
                    return 2;
                case 'Thursday':
                    return 3;
                case 'Friday':
                    return 4;
        }
    }

    private getDayAbbr(day: String) {
        return day.substring(0, 3);
    }
}

const GQL_GET_AVAILABILITY = `
    query getLocationAvailabilityBlocks($organizationId: UUID!, $schoolYear: String!) {
        locationAvailabilityBlocks(organizationId: $organizationId, schoolYear: $schoolYear) {
            edges {
                node {
                    location {
                        id
                        name
                        sfAccountId
                        timezone
                    }
                    availableStations,
                    dayName,
                    start,
                    end,
                    totalHours,
                    hardStop,
                    hardStart,
                    notes
                }
            }
        }
    }
`;
