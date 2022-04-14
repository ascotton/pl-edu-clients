import { ReactiveFormsModule } from '@angular/forms';
import { MockComponent, MockModule } from 'ng-mocks';
import { PLServiceSaveService } from '../pl-service-save.service';
import { CurrentUserService } from '../../user/current-user.service';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { PLConfirmDialogService, PLMayService } from '@root/src/lib-components';
import { PLServiceSaveIdentifyComponent } from './pl-service-save-identify.component';
import { PLInputTextComponent } from '@root/src/lib-components/pl-input/pl-input-text.component';
import { PLInputSelectComponent } from '@root/src/lib-components/pl-input/pl-input-select.component';
import { PLInputDatepickerComponent } from '@root/src/lib-components/pl-input/pl-input-datepicker.component';
import { PLInputRadioGroupComponent } from '@root/src/lib-components/pl-input/pl-input-radio-group.component';
import { PLInputCheckboxGroupComponent } from '@root/src/lib-components/pl-input/pl-input-checkbox-group.component';
import { PLClientStudentDisplayComponent } from '@root/src/lib-components/pl-vary-display/pl-client-student-display.component';

describe('PLServiceSaveIdentifyComponent', () => {
    let spectator: Spectator<PLServiceSaveIdentifyComponent>;

    const createComponent = createComponentFactory({
        component: PLServiceSaveIdentifyComponent,
        imports: [
            MockModule(ReactiveFormsModule),
        ],
        declarations: [
            MockComponent(PLInputSelectComponent), MockComponent(PLInputTextComponent),
            MockComponent(PLInputRadioGroupComponent), MockComponent(PLInputDatepickerComponent),
            MockComponent(PLClientStudentDisplayComponent), MockComponent(PLInputCheckboxGroupComponent),
        ],
        mocks: [
            PLConfirmDialogService, CurrentUserService,
            PLMayService, PLServiceSaveService,
        ],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should success', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });

    describe('Service Drop Down Options', () => {
        describe('for Ocupational Therapist', () => {
            it('should display only ' +
                '\'Occupational Therapy\' and \'Occupational Therapy Consultation Services\'' +
                'when Direct Therapy', () => {

            });
        });

        it('should not display \'Trauma, Supervision/Therapy Supervision or Big\' in options when product type is Direct Therapy', () => {
            const referral = {
                productType: {
                    code: 'direct_service',
                },
            };
            const xpectedData = {
                serviceOpts: [
                    { label: 'Allowed Group for Direct Therapy' },
                ],
            };
            const data = [
                {
                    serviceOpts: [
                        { label: 'Allowed Group for Direct Therapy' },
                        { label: 'Supervision' },
                        { label: 'Trauma-informed Group' },
                        { label: 'Speech-Language Therapy Supervision' },
                    ],
                },
                {
                    serviceOpts: [
                        { label: 'Allowed Group for Direct Therapy' },
                        { label: 'Behavior Intervention Group' },
                        { label: 'Trauma-informed Group' },
                        { label: 'Speech-Language Therapy Supervision' },
                    ],
                },
            ];

            const spyOngetUpdates = spyOn(spectator.component, 'getUpdates');

            data.forEach((dato) => {
                spectator.component.processServiceOptsAndUpdate(dato, referral, {});

                expect(spyOngetUpdates).toHaveBeenCalledWith(xpectedData, jasmine.any(Object), jasmine.any(Object));
            });
        });

        it('should only display Speech-Language Therapy Supervision option when product type is Supervision', () => {
            const referral = {
                productType: {
                    code: 'supervision',
                },
            };
            const xpectedData = { serviceOpts: [{ label: 'Speech-Language Therapy Supervision' }] };
            const data = {
                serviceOpts: [
                    { label: 'Speech-Language Therapy Supervision' },
                    { label: 'Bilingual Speech-Language Evaluation — Assessment' },
                    { label: 'Speech-Language Consultation Services' },
                    { label: 'Speech-Language Evaluation — Assessment' },
                    { label: 'Speech-Language Therapy' },
                    { label: 'Review of Records by SLP' },
                    { label: 'Screening by SLP' },
                ],
            };

            const spyOngetUpdates = spyOn(spectator.component, 'getUpdates');
            spectator.component.processServiceOptsAndUpdate(data, referral, {});

            expect(spyOngetUpdates).toHaveBeenCalledWith(xpectedData, jasmine.any(Object), jasmine.any(Object));
        });
    });

});
