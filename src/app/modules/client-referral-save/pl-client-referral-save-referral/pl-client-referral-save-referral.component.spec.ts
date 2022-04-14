import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { AppModule } from '@root/src/app/app.module';

import { MockModule } from 'ng-mocks';
import { Observable } from 'rxjs';

import { PLClientReferralSaveReferralComponent } from './pl-client-referral-save-referral.component';
import { PLSchoolYearsService } from '@root/src/app/common/services';

describe('PLClientReferralSaveReferralComponent', () => {
    const storeStub = {
        select: (storeOpt: string) => {
            if (storeOpt === 'currentUser') {
                const user = {
                    first_name: '',
                    last_name: '',
                };

                return new Observable((observer: any) => {
                    observer.next(user);
                });
            }
        },
    };

    const yearsSvcStub = {
        getCurrentSchoolYear: () => {
            const schoolYear = {
                code: '2020-2021-regular',
                endDate: '2021-07-31',
                id: 'b5bfb502-7858-4966-8e5a-b9fe72b7e75d',
                isCurrent: true,
                name: '2020-2021 School Year',
                option: {
                    value: '2020-2021-regular',
                    label: '2020-2021 School Year',
                    id: 'b5bfb502-7858-4966-8e5a-b9fe72b7e75d',
                },
                startDate: '2020-08-01',
                startYear: 2020,
                yearType: 'REGULAR',
            };

            return new Observable((observer: any) => {
                observer.next(schoolYear);
            });
        },
        getYearsData: () => {
            return new Observable((observer: any) => {
                observer.next({});
            });
        },
        getYearOptions: () => {
            const yearOpts = [
                {
                    value: '2017-2018-regular',
                    label: '2017-2018 School Year',
                    id: '3f654f8e-b1ca-4159-8c76-c39e739874d2',
                },
                {
                    value: '2019-2020-regular',
                    label: '2019-2020 School Year',
                    id: '5bc4bc02-f20b-4ccd-8080-f170913bcd3a',
                },
                {
                    value: '2020-2021-regular',
                    label: '2020-2021 School Year',
                    id: 'b5bfb502-7858-4966-8e5a-b9fe72b7e75d',
                },
                {
                    value: '2021-2022-regular',
                    label: '2021-2022 School Year',
                    id: '3048c404-d18c-4064-83ee-ff1e3f123607',
                },
            ];

            return yearOpts;
        },
    };

    let fixture: ComponentFixture<PLClientReferralSaveReferralComponent>;
    let component: PLClientReferralSaveReferralComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MockModule(AppModule)],
            declarations: [PLClientReferralSaveReferralComponent],
            providers: [
                { provide: Store, useValue: storeStub },
                { provide: PLSchoolYearsService, useValue: yearsSvcStub },
            ],
        });

        fixture = TestBed.createComponent(PLClientReferralSaveReferralComponent);
        component = fixture.componentInstance;
    });

    it('should success', () => {
        expect(component).toBeTruthy();
    });

    describe('Supervision and Behavioral Products', () => {

        describe('Referral Radio Buttons', () => {

            describe('Creating a New Referral', () => {

                describe('Provider is SL or OT', () => {
                    const providers = ['slp', 'ot'];

                    it('should enable and select Supervision when Referral selected is Behavioral', () => {
                        providers.forEach((provider) => {
                            component.referral.productType.code = 'groupbmh_bi';
                            component.updateReferralRadioGroup(provider);

                            expect(component.referralOpts[2].disabled).toBeFalsy();
                            expect(component.referralOpts[2].label).toEqual('Supervision');
                            expect(component.referral.productType.code).toEqual('supervision');
                        });
                    });

                    it('should disable Behavioral when Referral selected is not Behavioral', () => {
                        providers.forEach((provider) => {
                            component.updateReferralRadioGroup(provider);

                            expect(component.referralOpts[0].disabled).toBeFalsy();
                            expect(component.referralOpts[1].disabled).toBeFalsy();
                            expect(component.referralOpts[2].disabled).toBeFalsy();
                            expect(component.referralOpts[3].label).toEqual('Behavior Intervention Group');
                            expect(component.referralOpts[3].disabled).toBeTruthy();
                        });
                    });
                });

                describe('Provider is MHP or PA', () => {
                    const providers = ['mhp', 'pa'];

                    it('should enable and select Behavioral when Referral selected is Supervision', () => {
                        providers.forEach((provider) => {
                            component.referral.productType.code = 'supervision';
                            component.updateReferralRadioGroup(provider);

                            expect(component.referralOpts[3].disabled).toBeFalsy();
                            expect(component.referralOpts[3].label).toEqual('Behavior Intervention Group');
                            expect(component.referral.productType.code).toEqual('groupbmh_bi');
                        });
                    });

                    it('should disable Supervision when Referral selected is not Supervision', () => {
                        providers.forEach((provider) => {
                            component.updateReferralRadioGroup(provider);

                            expect(component.referralOpts[0].disabled).toBeFalsy();
                            expect(component.referralOpts[1].disabled).toBeFalsy();
                            expect(component.referralOpts[2].label).toEqual('Supervision');
                            expect(component.referralOpts[2].disabled).toBeTruthy();
                            expect(component.referralOpts[3].disabled).toBeFalsy();
                        });
                    });
                });
            });

            describe('Updating Frequency when Editing a Behavioral Referral', () => {
                it('should reset frequency when duration is empty', () => {
                    component.referral.duration = null;

                    component.loadForEditReferralWhenBmhType();

                    expect(component.frequencyTypeCode).toEqual(null);
                    expect(component.referral.duration).toBeUndefined();
                    expect(component.referral.frequency).toBeUndefined();
                    expect(component.referral.interval).toBeUndefined();
                });

                it('should set frequency to 30 when duration is 30', () => {
                    component.referral.duration = 30;

                    component.loadForEditReferralWhenBmhType();

                    expect(component.referral.interval).toEqual('weekly');
                    expect(component.referral.duration).toEqual(30);
                    expect(component.referral.frequency).toEqual(2);
                });

                it('should set frequency to 60 when duration is not 30', () => {
                    component.referral.duration = 60;

                    component.loadForEditReferralWhenBmhType();

                    expect(component.referral.interval).toEqual('weekly');
                    expect(component.referral.duration).toEqual(60);
                    expect(component.referral.frequency).toEqual(1);
                });
            });
        });

        describe('Behavioral Product', () => {
            it('should update to two fixed frequencies when behavioral and update object based frequency_twice', () => {
                const frequencyTypeTwice = component.frequencyOpts[0].value; // 'frequency_twice'

                component.updateFrequencyWhenBmhType(frequencyTypeTwice);

                expect(component.referral.interval).toEqual('weekly');
                expect(component.referral.duration).toEqual(30);
                expect(component.referral.frequency).toEqual(2);
            });

            it('should update to two fixed frequencies when behavioral and update object based frequency_once', () => {
                const frequencyTypeOnce = component.frequencyOpts[1].value; // 'frequency_once'

                component.updateFrequencyWhenBmhType(frequencyTypeOnce);

                expect(component.referral.interval).toEqual('weekly');
                expect(component.referral.duration).toEqual(60);
                expect(component.referral.frequency).toEqual(1);
            });

            it('should delete frequency related properties when not behavioral (invalid frequency type code)', () => {
                const invalidFreqTypeCodes = [null, undefined, ''];

                invalidFreqTypeCodes.forEach((invalidCode) => {
                    component.updateFrequencyWhenBmhType(invalidCode);

                    expect(component.frequencyTypeCode).toBeNull();
                    expect(component.referral.interval).not.toBeDefined();
                    expect(component.referral.duration).not.toBeDefined();
                    expect(component.referral.frequency).not.toBeDefined();
                });
            });

            it('should update \'Individual/Group\' checkboxes to only Group when behavioral', () => {
                const behaviorProduct = 'groupbmh_bi';
                const spyOnChangeGrouping = spyOn(component, 'onChangeGrouping');
                const spyUpdateFrequencyWhenBehavioral = spyOn(component, 'updateFrequencyWhenBmhType');

                // Opposite set up of what's expected
                component.referralGrouping = null;
                component.grouping.disabled = false;
                component.grouping.label = null;

                component.updateGroupingAndFrequencyWhenBmhType(behaviorProduct);

                expect(spyOnChangeGrouping).toHaveBeenCalledTimes(1);
                expect(spyUpdateFrequencyWhenBehavioral).toHaveBeenCalledTimes(1);
                expect(component.referralGrouping).toEqual(['group_only']);
                expect(component.grouping.disabled).toBeTruthy();
                expect(component.grouping.label).toEqual(component.GROUPING_LBL_GROUP);
            });

            it('should not update \'Individual/Group\' checkboxes when not behavioral', () => {
                const spyOnChangeGrouping = spyOn(component, 'onChangeGrouping');
                const spyUpdateFrequencyWhenBehavioral = spyOn(component, 'updateFrequencyWhenBmhType');

                // Opposite set up of what's expected
                component.referralGrouping = null;
                component.grouping.disabled = true;
                component.grouping.label = null;

                component.updateGroupingForBmhType(null);
                component.updateGroupingAndFrequencyWhenBmhType(null);

                expect(spyOnChangeGrouping).not.toHaveBeenCalled();
                expect(spyUpdateFrequencyWhenBehavioral).toHaveBeenCalled();
                expect(component.referralGrouping).not.toEqual(['group_only']);
                expect(component.grouping.disabled).toBeFalsy();
                expect(component.grouping.label).not.toEqual(component.GROUPING_LBL_GROUP);
            });
        });
    });
    it('should default School Year box to the current school year', () => {
        expect(component.referral.schoolYear.code).not.toBeNull();
        expect(component.referral.schoolYear.code).toEqual('2020-2021-regular');
    });

});
