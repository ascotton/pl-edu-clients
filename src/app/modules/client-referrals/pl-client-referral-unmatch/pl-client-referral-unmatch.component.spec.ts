import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PLDotLoaderModule, PLModalModule } from '@root/index';
import { PLInputSelectComponent } from '@root/src/lib-components/pl-input/pl-input-select.component';
import { MockComponent, MockModule, MockService } from 'ng-mocks';
import { PLReferralsService } from '../pl-referrals.service';

import { PlClientReferralUnmatchComponent } from './pl-client-referral-unmatch.component';

describe('PlClientReferralUnmatchComponent', () => {
    let component: PlClientReferralUnmatchComponent;
    let fixture: ComponentFixture<PlClientReferralUnmatchComponent>;

    const mockedPLReferralSvc = { provide: PLReferralsService, useValue: MockService(PLReferralsService)};

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ 
                MockModule(PLModalModule),
                MockModule(PLDotLoaderModule),
            ],
            declarations: [ 
                PlClientReferralUnmatchComponent,
                MockComponent(PLInputSelectComponent),
            ],
            providers: [ mockedPLReferralSvc ]
        })
    .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlClientReferralUnmatchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
