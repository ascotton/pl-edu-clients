/* tslint:disable: no-life-cycle-call */
/*
  Note: Angular testing guide encourages calling life-cycle functions directly.
  See https://angular.io/guide/testing
 */
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { By } from '@angular/platform-browser';

import { of } from 'rxjs';

import {
    anything,
    capture,
    instance,
    mock,
    verify,
    when,
} from 'ts-mockito';

import { PLLodashService } from '@root/index';

import { PLCamAccountDetailsComponent } from './pl-cam-account-details.component';
import { PLCamAccountDetailsService } from './pl-cam-account-details.service';
import { PLCamAccountDetails, plCamAccountDetailsMock } from './pl-cam-account-details';
import { PLLocationReferralStats, plLocationReferralStatsMock } from './pl-location-referral-stats';
import { PLServiceStatus, plServiceStatusMock } from './pl-service-status';
import { plLocationMock } from '@common/services/locations/pl-location.mock';

const expect_referral_manager_links_to_include = (root: DebugElement, paramKey: string, paramValue: string): void => {
    root.queryAll(By.css('a[href*="/client-referrals/manager"]')).forEach((link) => {
        expect(link.properties.href).toContain(`${ paramKey }=${ paramValue }`);
    });
};

describe('PLCamAccountDetailsComponent', () => {
    let component: PLCamAccountDetailsComponent;
    let fixture: ComponentFixture<PLCamAccountDetailsComponent>;

    let componentService: PLCamAccountDetailsService;

    beforeEach(waitForAsync(() => {
        componentService = mock(PLCamAccountDetailsService);

        TestBed.configureTestingModule({
            imports: [CommonModule, RouterTestingModule],
            declarations: [PLCamAccountDetailsComponent],
            schemas: [NO_ERRORS_SCHEMA],
        })
        .overrideComponent(PLCamAccountDetailsComponent, {
            set: {
                providers: [
                    { provide: PLCamAccountDetailsService, useValue: instance(componentService) },
                    PLLodashService,
                    { provide: PercentPipe, useValue: { transform: (p: any) => p.toString() } },
                ],
            },
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLCamAccountDetailsComponent);

        component = fixture.debugElement.componentInstance;

        when(componentService.getDetails(anything())).thenReturn(of(plCamAccountDetailsMock()));
    });

    it('should exist', () => {
        expect(component).toBeDefined();
    });

    it('should show organization name', () => {
        component.orgName = 'My Organization Name';

        fixture.detectChanges();

        expect(fixture.debugElement.nativeElement.textContent).toContain('My Organization Name');
    });

    describe('location table', () => {
        let table: DebugElement;
        let stats: PLCamAccountDetails;

        beforeEach(() => {
            table = fixture.debugElement.query(By.css('.locations'));
        });

        describe('when there are no locations', () => {
            it('should show a message that there are no locations', () => {
                fixture.detectChanges();

                expect(table.nativeElement.textContent).toContain('does not have any locations');
            });
        });

        describe('when all of the locations are virtual locations', () => {
            let thead: DebugElement;

            beforeEach(() => {
                stats = plCamAccountDetailsMock({
                    locationReferralStats: [
                        plLocationReferralStatsMock({
                            location: plLocationMock({ isVirtual: true }),
                        }),
                    ],
                });

                when(componentService.getDetails(anything())).thenReturn(of(stats));

                component.schoolYearCode = '1976-1977-regular';

                fixture.detectChanges();

                thead = table.query(By.css('thead'));
            });

            it('should not show missing information column', () => {
                expect(thead.nativeElement.textContent).not.toContain('Missing Info');
            });

            it('should not show scheduled column', () => {
                expect(thead.nativeElement.textContent).not.toContain('Scheduled');
            });
        });

        describe('when there are brick and mortar locations', () => {
            let firstRow: DebugElement;
            let thead: DebugElement;

            const location = plLocationReferralStatsMock({
                convertedCount: 1,
                matchedCount: 2,
                missingInfoPercentage: 3,
                openCount: 7,
                proposedCount: 4,
                scheduledPercentage: 5,
                unmatchedCount: 6,
                total: 13,
                location: plLocationMock({ id: '42', name: 'A School' }),
            });

            beforeEach(() => {
                stats = plCamAccountDetailsMock({
                    locationReferralStats: [
                        location,
                        plLocationReferralStatsMock({ location: plLocationMock({ name: 'B School' }) }),
                    ],
                });

                when(componentService.getDetails(anything())).thenReturn(of(stats));

                component.schoolYearCode = '1976-1977-regular';

                fixture.detectChanges();

                firstRow = table.query(By.css('tbody tr:first-of-type'));
                thead = table.query(By.css('thead'));
            });

            it('should show missing information column', () => {
                expect(thead.nativeElement.textContent).toContain('Missing Info');
            });

            it('should show scheduled column', () => {
                expect(thead.nativeElement.textContent).toContain('Scheduled');
            });

            it('should link to the location profile from the location name', () => {
                const href = firstRow.query(By.css('a.location-profile')).properties.href;

                expect(href).toEqual('/location/42');
            });

            it('should show a table row for each location in the stats results', () => {
                expect(table.queryAll(By.css('tbody tr')).length).toEqual(stats.locationReferralStats.length);
            });

            it('should link unmatched referrals to the referral manager', () => {
                const link = firstRow.query(By.css('a.referral-manager-unmatched'));

                expect(link.properties.href).toMatch('/client-referrals/manager');
                expect(link.properties.href).toMatch('crmf_state_In=UNMATCHED_PL_REVIEW');
            });

            it('should show percentage referrals missing info', () => {
                expect(firstRow.nativeElement.textContent).toContain(location.missingInfoPercentage);
            });

            it('should show percentage referrals scheduled', () => {
                expect(firstRow.nativeElement.textContent).toContain(location.scheduledPercentage);
            });

            it('should link referals missing info to the referral manager', () => {
                const link = firstRow.query(By.css('a.referral-manager-missing-info'));

                expect(link.properties.href).toMatch('/client-referrals/manager');
                expect(link.properties.href).toMatch('crmf_missing_info=true');
            });

            it('should show open referrals', () => {
                expect(firstRow.nativeElement.textContent).toContain(location.openCount);
            });

            it('should show proposed referrals', () => {
                expect(firstRow.nativeElement.textContent).toContain(location.proposedCount);
            });

            it('should show matched referrals', () => {
                expect(firstRow.nativeElement.textContent).toContain(location.matchedCount);
            });

            it('should who converted referrals', () => {
                expect(firstRow.nativeElement.textContent).toContain(location.convertedCount);
            });

            it('should include school year in all links to the referral manager', () => {
                expect_referral_manager_links_to_include(firstRow, 'crmf_schoolYearCode_In', component.schoolYearCode);
            });

            it('should include location id in all links to the referral manager', () => {
                expect_referral_manager_links_to_include(firstRow, 'crmf_clientLocationId_In', location.location.id);
            });
        });
    });

    describe('service statuses', () => {
        it('should each have a service details component', () => {
            const accountDetails = plCamAccountDetailsMock({
                serviceStatuses: [
                    plServiceStatusMock({ serviceName: 'BMH', inServiceCount: 1 }),
                    plServiceStatusMock({ serviceName: 'SLP', inServiceCount: 1 }),
                ],
            });

            when(componentService.getDetails(anything())).thenReturn(of(accountDetails));

            fixture.detectChanges();

            expect(component.services.length).toEqual(2);

            const detailsComponents = fixture.debugElement.queryAll(By.css('pl-cam-service-details'));

            expect(detailsComponents.length).toEqual(2);
        });

        it('should not have a service details component if no referrals and no contracted hours', () => {
            const accountDetails = plCamAccountDetailsMock({
                serviceStatuses: [
                    plServiceStatusMock({ serviceName: 'BMH', inServiceCount: 0, contractedReferralHours: 0 }),
                ],
            });

            when(componentService.getDetails(anything())).thenReturn(of(accountDetails));

            fixture.detectChanges();

            const detailsComponents = fixture.debugElement.queryAll(By.css('pl-cam-service-details'));

            expect(detailsComponents.length).toEqual(0);
        });
    });

    describe('navigation', () => {
        describe('to referral manager for organization', () => {
            let link: DebugElement;

            beforeEach(() => {
                component.orgId = 'my-org-id';
                component.schoolYearCode = '1976-1977-regular';

                fixture.detectChanges();

                link = fixture.debugElement.query(By.css('.footer a[href*="/client-referrals/manager"]'));
            });

            it('should include the organization id', () => {
                expect(link.properties.href).toContain('crmf_clientOrganizationId_In=my-org-id');
            });

            it('should include the school year', () => {
                const footer = fixture.debugElement.query(By.css('.footer'));

                expect_referral_manager_links_to_include(footer, 'crmf_schoolYearCode_In', component.schoolYearCode);
            });
        });
    });
});
