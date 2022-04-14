import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { Store } from '@ngrx/store';

import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';

import { PLClientEvaluationReassignComponent } from './pl-client-evaluation-reassign.component';
import { PLDotLoaderComponent } from '@root/src/lib-components/pl-dot-loader/pl-dot-loader.component';
import { PLInputRadioComponent } from '@root/src/lib-components/pl-input/pl-input-radio.component';
import { PLInputTextareaComponent } from '@root/src/lib-components/pl-input/pl-input-textarea.component';
import { PLModalHeaderWrapperComponent } from '@root/src/lib-components/pl-modal/pl-modal-header-wrapper.component';
import { PLStylesService } from '@root/index';
import { PLToastService, PLLodashService } from '@root/index';

describe('PLClientEvaluationReassignComponent', () => {
    let spectator: Spectator<PLClientEvaluationReassignComponent>;

    const storeStub = {
        select: (storeOpt: string) => {
            if (storeOpt === 'currentUser') {
                return of ({
                    first_name: 'John',
                    last_name: 'Doe',
                });
            }
        }
    };

    const createComponent = createComponentFactory({
        component: PLClientEvaluationReassignComponent,
        declarations: [
            MockComponent(PLModalHeaderWrapperComponent),
            MockComponent(PLDotLoaderComponent),
            MockComponent(PLInputRadioComponent),
            MockComponent(PLInputTextareaComponent),
        ],
        mocks: [
            PLToastService,
        ],
        providers: [
            { provide: Store, useValue: storeStub },
            PLLodashService,
            PLStylesService,
        ],
    });

    const mockResponse = {
        mayMatch: true,
        providers: [
            {
                id: "86f0783f-eff5-44c8-9ba1-052feec7afda",
                caseloadCount: 5,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Michael",
                    lastName: "Bailey"
                },
                remainingAvailableHours: -10.1,
            },
            {
                id: "86f0783f-eff5-44c8-9ba1-052feec7afda",
                caseloadCount: 5,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Michael",
                    lastName: "Bailey"
                },
                remainingAvailableHours: 5,
            },
            {
                id: "86f0783f-eff5-44c8-9ba1-052feec7afda",
                caseloadCount: 5,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Michael",
                    lastName: "Bailey"
                },
                remainingAvailableHours: 0.0001,
            },
            {
                id: "86f0783f-44c8-44c8-9ba1-052feec7afda",
                caseloadCount: 4,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Jermaine",
                    lastName: "Stewart"
                },
                remainingAvailableHours: 10,
            },
            {
                id: "86f0783f-44c8-44c8-9ba1-052feec7afda",
                caseloadCount: 4,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Jermaine",
                    lastName: "Stewart"
                },
                remainingAvailableHours: -10.19,
            },
            {
                id: "86f0783f-44c8-9ba1-9ba1-052feec7afda",
                caseloadCount: 4,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Jeremy",
                    lastName: "Edwards"
                },
                remainingAvailableHours: -10.111,
            },
            {
                id: "86f0783f-44c8-54c8-9ba1-052feec7afda",
                caseloadCount: 4,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Jermaine",
                    lastName: "Stewart"
                },
                remainingAvailableHours: 0,
            },
            {
                id: "86f0783f-54c8-9ba1-9ba1-052feec7afda",
                caseloadCount: 4,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Jeremy",
                    lastName: "Edwards"
                },
                remainingAvailableHours: 5.1,
            },
            {
                id: "86f0783f-54c8-9ba1-9ba1-052feec7afda",
                caseloadCount: 4,
                user: {
                    id: "c8ae40b2-1998-342a-887f-0108bf5abd35",
                    firstName: "Jeremy",
                    lastName: "Edwards"
                },
                remainingAvailableHours: 5.2,
            },
        ]
    }

    beforeEach(() => spectator = createComponent({
        props: {
            client: {
                firstName: 'Test firstName',
                lastName: 'Test lastName',
                englishLanguageLearnerStatus: 'test',
                primaryLanguage: {
                    name: 'English',
                    code: 'en',
                },
            },
            evaluation: {
                discipline: 'Test discipline',
                locationName: 'Test locationName',
                organizationName: 'Test organizationName',
                productTypeCode: 'Test productTypeCode',
            },
            onGetProviders: () => { return of(mockResponse) },
        },
    }));


    // Helper function to count decimals places of a number.
    function decimalsOf (value: number) {
        if(Math.floor(value) === value) return 0;
        return value.toString().split(".")[1].length || 0; 
    }

    it('should create', () => {
        expect(spectator.component).toBeTruthy();
        expect(spectator.component).toBeDefined();
    })

    it('should display the expected number of providers', () => {
        expect(spectator.queryAll('.provider-info')).toHaveLength(mockResponse.providers.length)
    })

    it('should order providers by remaining hours in descending order', () => {
        let providers = spectator.component['providers']
        let previous = providers[0];
        for (let i = 1; i < providers.length ; i++) {
            expect(previous.remainingAvailableHours).toBeGreaterThanOrEqual(providers[i].remainingAvailableHours);
            previous = providers[i];
        }
    })

    it('should round remaining hours to one decimal place', () => {
        let providers = spectator.component['providers']
        for (let provider of providers) {
            expect(decimalsOf(provider.remainingAvailableHours)).toBeGreaterThanOrEqual(0);
            expect(decimalsOf(provider.remainingAvailableHours)).toBeLessThanOrEqual(1);
       }
    })

    it('should initially disabe  "Reassign" button if user has not selected an option', () => {
        expect(spectator.query('#submitReassignButton')).toBeDisabled();
    })
});

