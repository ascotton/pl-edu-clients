/* tslint:disable: no-life-cycle-call */
/*
  Note: Angular testing guide encourages calling life-cycle functions directly.
  See https://angular.io/guide/testing
 */
import {
    Component,
    DebugElement,
    NO_ERRORS_SCHEMA,
    SimpleChange,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { By } from '@angular/platform-browser';

import { of } from 'rxjs';

import {
    anything,
    instance,
    mock,
    verify,
    when,
} from 'ts-mockito';

import { PLCamAccountNumbersComponent } from './pl-cam-account-numbers.component';
import { PLCamAccountNumbersService } from './pl-cam-account-numbers.service';
import { PLCamAccountNumbers, plCamAccountNumbersMock } from './pl-cam-account-numbers';

@Component({
    selector: 'pl-test-host-component',
    template: '<pl-cam-account-numbers [schoolYearCode]="schoolYearCode"></pl-cam-account-numbers>',
})
class TestHostComponent {
    schoolYearCode: string;
}

describe('PLCamAccountNumbersComponent', () => {
    let component: PLCamAccountNumbersComponent;
    let testHostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let serviceMock: PLCamAccountNumbersService;

    beforeEach(waitForAsync(() => {
        serviceMock = mock(PLCamAccountNumbersService);

        TestBed.configureTestingModule({
            imports: [CommonModule, RouterTestingModule],
            declarations: [PLCamAccountNumbersComponent, TestHostComponent],
            schemas: [NO_ERRORS_SCHEMA],
        })
        .overrideComponent(PLCamAccountNumbersComponent, {
            set: {
                providers: [
                    { provide: PLCamAccountNumbersService, useValue: instance(serviceMock) },
                ],
            },
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);

        testHostComponent = fixture.debugElement.componentInstance;

        component = fixture.debugElement.query(By.css('pl-cam-account-numbers')).componentInstance;
    });

    it('should exist', () => {
        expect(component).toBeDefined();
    });

    describe('when school year changes', () => {
        beforeEach(() => {
            when(serviceMock.getAccountNumbers(anything())).thenReturn(of(plCamAccountNumbersMock()));

            fixture.detectChanges(); // fire ngOnInit()
        });

        it('should fetch new numbers', () => {
            component.ngOnChanges({ schoolYearCode: new SimpleChange('1997-1998', '1998-1999', false) });

            verify(serviceMock.getAccountNumbers(anything())).twice();
        });
    });

    describe('boxes', () => {
        let box: DebugElement;

        describe('referrals', () => {
            beforeEach(() => {
                const numbers = plCamAccountNumbersMock({
                    referralsUnmatchedCount: 5,
                    referralsToConvertCount: 10,
                });

                when(serviceMock.getAccountNumbers(anything())).thenReturn(of(numbers));

                testHostComponent.schoolYearCode = '1972-1973';

                fixture.detectChanges(); // render template

                box = fixture.debugElement.query(By.css('.referrals'));
            });

            describe('total unmatched referrals', () => {
                it('should be dispayed', () => {
                    expect(box.nativeElement.textContent).toContain('5');
                });

                it('should route to referral manager filtered to unmatched referrals in the CAMs organizations', () => {
                    const href = box.query(By.css('.referrals-unmatched')).properties.href;

                    expect(href).toContain('/client-referrals/manager');
                    expect(href).toContain('crmf_state_In=UNMATCHED_PL_REVIEW,UNMATCHED_OPEN_TO_PROVIDERS');
                    expect(href).toContain('crmf_managedAccountsOnly=true');
                    expect(href).toContain(`crmf_schoolYearCode_In=${ component.schoolYearCode }`);
                });
            });

            describe('total matched/unconverted referrals', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('10');
                });

                it('should route to referral manager filtered to matched/unconverted referrals in CAMs organizations, over a week old', () => {
                    const href = box.query(By.css('.referrals-matched')).properties.href;

                    expect(href).toContain('/client-referrals/manager');
                    expect(href).toContain('crmf_state_In=MATCHED');
                    expect(href).toContain('crmf_olderThan=one-week');
                    expect(href).toContain('crmf_managedAccountsOnly=true');
                    expect(href).toContain(`crmf_schoolYearCode_In=${ component.schoolYearCode }`);
                });
            });
        });

        describe('assignments', () => {
            beforeEach(() => {
                const numbers = plCamAccountNumbersMock({
                    accountsUnfulfilledCount: 6,
                    assignmentsProposedCount: 87,
                    assignmentsPendingCount: 11,
                });

                when(serviceMock.getAccountNumbers(anything())).thenReturn(of(numbers));

                fixture.detectChanges(); // render template

                box = fixture.debugElement.query(By.css('.assignments'));
            });

            describe('total accounts not fully staffed', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('6');
                });

                it('should route to assignment manager, filtered on accounts with less then 100% fulfillment');
            });

            describe('total number of machine-proposed assignments pending human approval', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('87');
                });

                it('should route to assignment manager, filtered on assignment status in CAMs organizations');
            });

            describe('total number of pending assignments', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('11');
                });

                it('should route somewhere TBD');
            });
        });

        describe('scheduling', () => {
            beforeEach(() => {
                const numbers = plCamAccountNumbersMock({
                    locationsRequiringSchedulingCount: 7,
                });

                when(serviceMock.getAccountNumbers(anything())).thenReturn(of(numbers));

                fixture.detectChanges(); // render template

                box = fixture.debugElement.query(By.css('.scheduling'));
            });

            describe('location requiring scheduling', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('7');
                });
            });
        });

        describe('services', () => {
            beforeEach(() => {
                const numbers = plCamAccountNumbersMock({
                    servicesEvalsPastDue: 8,
                    servicesUndocumentedBeyondStartDate: 12,
                });

                when(serviceMock.getAccountNumbers(anything())).thenReturn(of(numbers));

                fixture.detectChanges(); // render template

                box = fixture.debugElement.query(By.css('.services'));
            });

            describe('total number of evals past due', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('8');
                });

                it('should route to a metabase report');
            });

            describe('undocumented services past start date', () => {
                it('should be displayed', () => {
                    expect(box.nativeElement.textContent).toContain('12');
                });

                it('should route to a metabase report');
            });
        });
    }); // routing
});
