import { MockComponent, MockPipe } from 'ng-mocks';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator';

import { PLIsAvailableComponent } from '@root/src/app/common/components';
import { PLClientReferralMatchComponent } from './pl-client-referral-match.component';
import { PLInputRadioComponent } from '@root/src/lib-components/pl-input/pl-input-radio.component';
import { PLDotLoaderComponent } from '@root/src/lib-components/pl-dot-loader/pl-dot-loader.component';
import { PLInputTextareaComponent } from '@root/src/lib-components/pl-input/pl-input-textarea.component';
import { PLModalHeaderWrapperComponent } from '@root/src/lib-components/pl-modal/pl-modal-header-wrapper.component';

import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { PLGraphQLService } from '@root/index';
import { PLLodashService } from '@root/src/lib-components';
import { PLReferralsService } from '../pl-referrals.service';
import { PLOptionsPipe } from '@root/src/app/common/pipes';

describe('PLClientReferralMatchComponent', () => {

    let spectator: Spectator<PLClientReferralMatchComponent>;

    const storeStub = {
        select: (storeOpt: string) => {
            if (storeOpt === 'currentUser') {
                const user = {
                    first_name: 'John',
                    last_name: 'Doe',
                };

                return new Observable((observer: any) => {
                    observer.next(user);
                });
            }
        },
    };

    const store = { provide: Store, useValue: storeStub };

    const mockResponse = {
        referral: {
            id: '7b71794a-0fd6-4e07-b582-44b54a43ab02',
            providerCandidates: [
                {
                    id: '86f0783f-eff5-44c8-9ba1-052feec7afda',
                    caseloadCount: 5,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Michael',
                        lastName: 'Bailey',
                    },
                    remainingAvailableHours: -10.1,
                },
                {
                    id: '86f0783f-eff5-44c8-9ba1-052feec7afda',
                    caseloadCount: 5,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Michael',
                        lastName: 'Bailey',
                    },
                    remainingAvailableHours: 5,
                },
                {
                    id: '86f0783f-eff5-44c8-9ba1-052feec7afda',
                    caseloadCount: 5,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Michael',
                        lastName: 'Bailey',
                    },
                    remainingAvailableHours: 0.0001,
                },
                {
                    id: '86f0783f-44c8-44c8-9ba1-052feec7afda',
                    caseloadCount: 4,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Jermaine',
                        lastName: 'Stewart',
                    },
                    remainingAvailableHours: 10,
                },
                {
                    id: '86f0783f-44c8-44c8-9ba1-052feec7afda',
                    caseloadCount: 4,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Jermaine',
                        lastName: 'Stewart',
                    },
                    remainingAvailableHours: -10.19,
                },
                {
                    id: '86f0783f-44c8-9ba1-9ba1-052feec7afda',
                    caseloadCount: 4,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Jeremy',
                        lastName: 'Edwards',
                    },
                    remainingAvailableHours: -10.11,
                },
                {
                    id: '86f0783f-44c8-54c8-9ba1-052feec7afda',
                    caseloadCount: 4,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Jermaine',
                        lastName: 'Stewart',
                    },
                    remainingAvailableHours: 0,
                },
                {
                    id: '86f0783f-54c8-9ba1-9ba1-052feec7afda',
                    caseloadCount: 4,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Jeremy',
                        lastName: 'Edwards',
                    },
                    remainingAvailableHours: 5.1,
                },
                {
                    id: '86f0783f-54c8-9ba1-9ba1-052feec7afda',
                    caseloadCount: 4,
                    user: {
                        id: 'c8ae40b2-1998-342a-887f-0108bf5abd35',
                        firstName: 'Jeremy',
                        lastName: 'Edwards',
                    },
                    remainingAvailableHours: 5.2,
                },
            ],
        },
    };

    const createComponent = createComponentFactory({
        component: PLClientReferralMatchComponent,
        declarations: [
            MockComponent(PLModalHeaderWrapperComponent), MockComponent(PLIsAvailableComponent),
            MockComponent(PLDotLoaderComponent), MockComponent(PLInputRadioComponent),
            MockComponent(PLInputTextareaComponent),
            MockPipe(PLOptionsPipe),
        ],
        mocks: [
            PLLodashService,
            PLReferralsService,
        ],
        providers: [
            mockProvider(PLGraphQLService, {
                query: () => of(mockResponse),
            }),
            store,
        ],
    });

    beforeEach(() => {
        spectator = createComponent({
            props: {
                client: {
                    firstName: 'Test firstName',
                    lastName: 'Test lastName',
                    englishLanguageLearnerStatus: 'active',
                    primaryLanguage: {
                        name: 'English',
                        code: 'en',
                    },
                },
                referral: {
                    id: 'abc',
                    discipline: 'Test discipline',
                    locationName: 'Test location',
                    organizationName: 'Test org',
                    productTypeCode: 'Test product',
                    duration: 10,
                    frequency: 10,
                    interval: 'Test interval',
                    grouping: 'Test grouping',
                },
            },
        });
    });

    // Helper function to count decimals places of a number.
    function decimalsOf(value: number) {
        if (Math.floor(value) === value) return 0;
        return value.toString().split('.')[1].length || 0;
    }

    it('should succeed', () => {
        expect(spectator.component).toBeTruthy();
        expect(spectator.component).toBeDefined();
    });

    it('should display the expected number of providers', () => {
        expect(spectator.queryAll('.provider-info')).toHaveLength(mockResponse.referral.providerCandidates.length);
    });

    it('should order providers by remaining hours in descending order', () => {
        const providers = spectator.component['providers'];
        let previous = providers[0];
        for (let i = 1; i < providers.length ; i++) {
            expect(previous.remainingAvailableHours).toBeGreaterThanOrEqual(providers[i].remainingAvailableHours);
            previous = providers[i];
        }
    });

    it('should round remaining hours to one decimal place', () => {
        const providers = spectator.component['providers'];
        for (const provider of providers) {
            expect(decimalsOf(provider.remainingAvailableHours)).toBeGreaterThanOrEqual(0);
            expect(decimalsOf(provider.remainingAvailableHours)).toBeLessThanOrEqual(1);
        }
    });

    it('should initially disabe  the "Confirm Match" button if user has not selected an option', () => {
        expect(spectator.query('#confirmMatchButton')).toBeDisabled();
    });

    it('should initially disabe  the "Save" button if user has not selected an option', () => {
        expect(spectator.query('#saveMatchButton')).toBeDisabled();
    });
});
