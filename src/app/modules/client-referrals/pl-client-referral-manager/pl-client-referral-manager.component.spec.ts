import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MockModule, MockComponent, MockService } from 'ng-mocks';

import {
    PLDotLoaderModule, PLTableModule, PLIconModule, PLInputModule, PLTableFrameworkModule,
    PLMayService, PLModalService, PLGQLProviderTypesService, PLGQLLanguagesService,
    PLTimezoneService,
} from '@root/src/lib-components';
import { PLLocationFilterFactory, PLOrganizationFilterFactory } from '@root/src/app/common/filters';
import { PLSchoolYearsService, PLUtilService } from '@root/src/app/common/services';
import { PLPopoverComponent, PLSchoolyearSelectComponent } from '@root/src/app/common/components';

import { CurrentUserService } from '../../user/current-user.service';
import { PLReferralsService } from '../pl-referrals.service';
import { PLClientReferralManagerService } from './pl-client-referral-manager.service';
import { PLClientReferralsService } from '../pl-client-referrals.service';
import { PLClientReferralManagerComponent } from './pl-client-referral-manager.component';

import { ToastrService } from 'ngx-toastr';

describe('PLClientReferralManagerComponent', () => {
    let component: PLClientReferralManagerComponent;
    let fixture: ComponentFixture<PLClientReferralManagerComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                MockModule(PLIconModule),
                MockModule(PLInputModule),
                MockModule(PLTableModule),
                MockModule(PLDotLoaderModule),
                MockModule(PLTableFrameworkModule),
                RouterTestingModule.withRoutes([{
                    path: 'manager',
                    component: PLClientReferralManagerComponent,
                }]),
            ],
            declarations: [
                PLClientReferralManagerComponent,
                MockComponent(PLPopoverComponent),
                MockComponent(PLSchoolyearSelectComponent),
            ],
        })
            .overrideComponent(PLClientReferralManagerComponent, {
                set: {
                    providers: [
                        {
                            provide: PLClientReferralManagerService,
                            useValue: MockService(PLClientReferralManagerService),
                        },
                        { provide: PLMayService, useValue: MockService(PLMayService) },
                        { provide: ToastrService, useValue: MockService(ToastrService) },
                        { provide: PLUtilService, useValue: MockService(PLUtilService) },
                        { provide: PLModalService, useValue: MockService(PLModalService) },
                        { provide: PLTimezoneService, useValue: MockService(PLTimezoneService) },
                        { provide: CurrentUserService, useValue: MockService(CurrentUserService) },
                        { provide: PLReferralsService, useValue: MockService(PLReferralsService) },
                        { provide: PLSchoolYearsService, useValue: MockService(PLSchoolYearsService) },
                        { provide: PLGQLLanguagesService, useValue: MockService(PLGQLLanguagesService) },
                        { provide: PLLocationFilterFactory, useValue: MockService(PLLocationFilterFactory) },
                        { provide: PLClientReferralsService, useValue: MockService(PLClientReferralsService) },
                        { provide: PLGQLProviderTypesService, useValue: MockService(PLGQLProviderTypesService) },
                        { provide: PLOrganizationFilterFactory, useValue: MockService(PLOrganizationFilterFactory) },
                    ],
                },
            })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLClientReferralManagerComponent);
        component = fixture.debugElement.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Status Column', () => {
        let plReferralMock: any;

        beforeEach(() => {
            plReferralMock = {
                state: 'CONVERTED',
                isMissingInformation: true,
                isScheduled: true,
            };
        });

        it('should display Scheduled State Label when isScheduled is true', () => {
            const statusLabel = component.statusLabel(plReferralMock);
            expect(statusLabel).toContain(', Sched\u00ADuled');
        });

        it('should display Missing Info State Label when isMissingInformation is true and isScheduled is false', () => {
            plReferralMock.isScheduled = false;
            const statusLabel = component.statusLabel(plReferralMock);
            expect(statusLabel).toContain(', Missing Info');
        });

        it('should display Unscheduled State Label when isScheduled is false & isMissingInformation is invalid', () => {
            plReferralMock.isScheduled = false;
            const invalidValues = [false, null, undefined];

            invalidValues.forEach((invalidValue) => {
                plReferralMock.isMissingInformation = invalidValue;

                const statusLabel = component.statusLabel(plReferralMock);
                expect(statusLabel).toContain(', Un\u00ADsched\u00ADuled');
            });
        });

        it('should display only State Label when isScheduled and isMissingInformation are invalid', () => {
            const invalidIsScheduled: any[] = [null, undefined];
            const invalidIsMissingInfo = [null, undefined, false];

            invalidIsScheduled.forEach((invalidScheduled) => {
                plReferralMock.isScheduled = invalidScheduled;

                invalidIsMissingInfo.forEach((invalidMissingInfo) => {
                    plReferralMock.isMissingInformation = invalidMissingInfo;

                    const statusLabel = component.statusLabel(plReferralMock);
                    expect(statusLabel).toEqual('Con\u00ADverted');
                });
            });
        });
    });
});
