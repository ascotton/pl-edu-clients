/* tslint:disable: no-life-cycle-call */
/*
  Note: Angular testing guide encourages calling life-cycle functions directly.
  See https://angular.io/guide/testing
 */
import { NO_ERRORS_SCHEMA, Component, SimpleChange } from '@angular/core';

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

import { PLCamAccountsComponent } from './pl-cam-accounts.component';
import { PLCamAccountsService, PLAccountHealthSummaryResults } from './pl-cam-accounts.service';
import { PLAccountHealthSummary, plAccountHealthSummaryMock } from './pl-account-health-summary';
import { PLOrganizationFilter, PLOrganizationFilterFactory } from '../../../common/filters';
import { User } from '@modules/user/user.model';

const emptySummaryResult: PLAccountHealthSummaryResults = { summaries: [], total: 0 };
const mockUser: User = <User> { uuid: 'a-user-id' };

@Component({
    selector: 'pl-test-host-component',
    template: '<pl-cam-accounts [currentUser]="currentUser" [schoolYearCode]="schoolYearCode"></pl-cam-accounts>',
})
class TestHostComponent {
    currentUser: User;
    schoolYearCode: string;
}

describe('PLCamAccountsComponent', () => {
    let component: PLCamAccountsComponent;
    let testHostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let tableElement: HTMLElement;

    let orgFilterFactoryMock: PLOrganizationFilterFactory;
    let camAccountServiceMock: PLCamAccountsService;

    beforeEach(waitForAsync(() => {
        orgFilterFactoryMock = mock(PLOrganizationFilterFactory);
        camAccountServiceMock = mock(PLCamAccountsService);

        TestBed.configureTestingModule({
            declarations: [TestHostComponent, PLCamAccountsComponent],
            schemas: [NO_ERRORS_SCHEMA],
        })
        .overrideComponent(PLCamAccountsComponent, {
            set: {
                providers: [
                    { provide: PLCamAccountsService, useValue: instance(camAccountServiceMock) },
                    { provide: PLOrganizationFilterFactory, useValue: instance(orgFilterFactoryMock) },
                ],
            },
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);

        testHostComponent = fixture.debugElement.componentInstance;
        testHostComponent.currentUser = mockUser;

        component = fixture.debugElement.query(By.css('pl-cam-accounts')).componentInstance;

        when(orgFilterFactoryMock.create(anything())).thenReturn(mock(PLOrganizationFilter));
    });

    it('should exist', () => {
        expect(component).toBeDefined();
    });

    describe('when school year changes', () => {
        beforeEach(() => {
            when(camAccountServiceMock.getHealthSummaries(anything())).thenReturn(of(emptySummaryResult));

            fixture.detectChanges();
        });

        it('should reset the organizations filter', () => {
            const freshOrgFilter = mock(PLOrganizationFilter);

            when(orgFilterFactoryMock.create(anything())).thenReturn(freshOrgFilter);

            testHostComponent.schoolYearCode = '1999-2000';

            fixture.detectChanges();

            expect(component.filterSelectOpts).toContain(freshOrgFilter);
        });

        it('should set the hidden filter to the new school year', () => {
            testHostComponent.schoolYearCode = '1999-2000';

            fixture.detectChanges();

            expect(component.hiddenFilterValues.schoolYearCode).toEqual('1999-2000');
        });

        it('should reset the fulfilment filter', () => {
            testHostComponent.schoolYearCode = '1999-2000';

            fixture.detectChanges();

            const filter = component.filterSelectOpts.find(o => o.value === 'fulfillmentPercentageLte');

            expect(filter.text).toEqual('');
        });
    });

    describe('fulfillment filter', () => {
        it('should default to showing all accounts', () => {
            fixture.detectChanges();

            const filter = component.filterSelectOpts.find(o => o.value === 'fulfillmentPercentageLte');

            expect(filter.text).toEqual('');
        });
    });

    describe('onQuery', () => {
        beforeEach(() => {
            when(camAccountServiceMock.getHealthSummaries(anything())).thenReturn(of(emptySummaryResult));

            // force initialization of PLCamAccountsComponent
            fixture.detectChanges();
        });

        it('should request health summaries', () => {
            component.onQuery({});

            verify(camAccountServiceMock.getHealthSummaries(anything())).called();
        });

        it('should omit fulfillment filter if filter value is empty', () => {
            component.onQuery({});

            const queryParams = capture(camAccountServiceMock.getHealthSummaries).last()[0];

            expect('fulfillmentPercentageLte' in queryParams).toBeFalsy();
        });

        it('should include non-empty fulfillment filter', () => {
            component.onQuery({ fulfillmentPercentageLte: '70' });

            const queryParams: any = capture(camAccountServiceMock.getHealthSummaries).last()[0];

            expect(queryParams.fulfillmentPercentageLte).toEqual(70);
        });
    });

    describe('when there are organizations', () => {
        const summary = plAccountHealthSummaryMock({
            orgId: '1',
            projectedTherapyStartDate: new Date(1999, 10, 1),
            fulfillmentPercentage: 99,
            matchedReferralCount: 100,
            referralCount: 50,
        });

        const summaryResult = { summaries: [summary], total: 1 };

        beforeEach(() => {
            when(camAccountServiceMock.getHealthSummaries(anything())).thenReturn(of(summaryResult));

            // implicitly sets PLCamAccountsComponent input values
            fixture.detectChanges();

            component.onQuery({});

            // update PLCamAccountsComponent view
            fixture.detectChanges();

            tableElement = fixture.debugElement.query(By.css('pl-table-wrapper')).nativeElement;
        });

        it('should show organization name', () => {
            expect(tableElement.textContent).toContain(summary.orgName);
        });

        it('should show PTSD dates', () => {
            expect(tableElement.textContent).toContain('11/01/1999');
        });

        it('should show fulfillment percentage', () => {
            expect(tableElement.textContent).toContain(`${summary.fulfillmentPercentage}%`);
        });

        it('should show matched/referral counts', () => {
            expect(tableElement.textContent).toContain(`${summary.matchedReferralCount} / ${summary.referralCount}`);
        });
    });

    describe('when there are no organizations', () => {
        beforeEach(() => {
            when(camAccountServiceMock.getHealthSummaries(anything())).thenReturn(of({ summaries: [], total: 0 }));

            fixture.detectChanges();

            component.onQuery({});

            // update PLCamAccountsComponent view
            fixture.detectChanges();

            tableElement = fixture.debugElement.query(By.css('pl-table-wrapper')).nativeElement;
        });

        it('should show "no organizations" message', () => {
            expect(tableElement.textContent).toContain('No organizations');
        });
    });

    describe('table expansion', () => {
        const summary = plAccountHealthSummaryMock({ orgId: '42' });

        it('is initially not expanded', () => {
            expect(component.isRowExpanded(summary)).toBeFalsy();
        });

        it('initial toggle expands a summary', () => {
            component.toggleExpanded(summary);

            expect(component.isRowExpanded(summary)).toBeTruthy();
        });

        it('a second toggle collapses a summary', () => {
            component.toggleExpanded(summary);
            component.toggleExpanded(summary);

            expect(component.isRowExpanded(summary)).toBeFalsy();
        });

        describe('after a query', () => {
            beforeEach(() => {
                const results = { summaries: [summary], total: 1 };
                when(camAccountServiceMock.getHealthSummaries(anything())).thenReturn(of(results));

                fixture.detectChanges();

                component.toggleExpanded(summary);
            });

            it('is reset to not expanded', () => {
                component.onQuery({});

                expect(component.isRowExpanded(summary)).toBeFalsy();
            });
        });
    });
});
