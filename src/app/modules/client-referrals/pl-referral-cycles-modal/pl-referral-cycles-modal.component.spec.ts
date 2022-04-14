import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { MockComponent } from 'ng-mocks';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

import { CLINICAL_PRODUCT_TYPE } from '@root/src/app/common/constants';
import { PLReferralCyclesModalService } from './pl-referral-cycles-modal.service';
import { PLReferralCyclesModalComponent } from './pl-referral-cycles-modal.component';
import { referralProductTypeMap } from '@root/src/app/common/services/pl-client-referral';
import { PLDotLoaderComponent } from '@root/src/lib-components/pl-dot-loader/pl-dot-loader.component';
import { PLModalHeaderWrapperComponent } from '@root/src/lib-components/pl-modal/pl-modal-header-wrapper.component';

const REF_PROD_MAP = referralProductTypeMap;
const CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

describe('PLReferralCyclesModalComponent', () => {

    let spectator: Spectator<PLReferralCyclesModalComponent>;

    const clientStub = {
        firstName: '',
        lastName: '',
    };

    const referralStub = {
        id: '',
        discipline: '',
        locationName: '',
        organizationName: '',
        productTypeCode: '',
        provider: {
            id: '',
        },
        duration: 0,
        frequency: '',
        interval: '',
        grouping: '',
    };

    // This stub will be used in future scenarios.
    const storeStub = {
        select: (storeOpt: string) => {
            if (storeOpt === 'currentUser') {
                return new Observable((observer: any) => {
                    observer.next({ email: 'an@email.com' });
                });
            }
        },
    };

    const storeProviderStub = { provide: Store, useValue: {} };

    const createComponent = createComponentFactory({
        component: PLReferralCyclesModalComponent,
        declarations: [
            MockComponent(PLModalHeaderWrapperComponent), MockComponent(PLDotLoaderComponent),
        ],
        providers: [storeProviderStub],
        componentMocks: [PLReferralCyclesModalService],
        // detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('it should succeed', () => {
        expect(spectator.component).toBeTruthy();
        expect(spectator.component).toBeDefined();
    });

    it('it should return the correct product name when calling productTypeName', () => {
        for (const code in CLINICAL_PRODUCT.CODE) {
            referralStub.productTypeCode = CLINICAL_PRODUCT.CODE[code];

            spectator.setInput({
                client: clientStub,
                referral: referralStub,
            });

            const productTypeName = spectator.component.productTypeName();
            expect(productTypeName).toEqual(REF_PROD_MAP[CLINICAL_PRODUCT.CODE[code]]);
        }
    });

    describe('OnInit Scenario', () => {

        let spyOnSetRequestLink: jasmine.Spy<any>;
        let spyOnErrorMsginModal: jasmine.Spy<any>;

        beforeEach(() => {
            spyOnSetRequestLink = spyOn<any>(spectator.component, 'setRequestLink');
            spyOnErrorMsginModal = spyOn<any>(spectator.component, 'showErrorMsgInModal');
        });

        describe('Show Error Messages in Modal', () => {
            it('should show an error in the modal when the \'currentUser store\' is not valid.', () => {
                // tslint:disable:no-life-cycle-call
                spectator.component.ngOnInit();
                expect(spyOnErrorMsginModal).toHaveBeenCalledWith(true, 'issue when fetching the current user.');
            });

            xit('should show an error in the modal when the \'currentUser store\' throws an error.');

            xit('should show an error in the modal when the \'user\' and \'referral\' are not valid.');
        });

        it('should set the request link, and don\'t display error in the modal when \'user\' and \'referral\' are valid.');

    });

});
