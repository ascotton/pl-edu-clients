import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
    anything,
    capture,
    mock,
    instance,
    when,
} from 'ts-mockito';

import { of } from 'rxjs';

import { currentClientUser } from '@app/stores/current-client-user.store';
import { StoreModule, Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';

import { PLToastService } from '@root/index';
import { PLClientReportsComponent } from './pl-client-reports.component';
import { PLNotesReportService } from '@common/services';

describe('PLClientReportsComponent', () => {
    let component: PLClientReportsComponent;
    let fixture: ComponentFixture<PLClientReportsComponent>;
    let reportService: PLNotesReportService;
    let store: Store<AppStore>;

    beforeEach(waitForAsync(() => {
        reportService = mock(PLNotesReportService);

        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({ currentClientUser })],
            declarations: [PLClientReportsComponent],
            providers: [
                { provide: PLNotesReportService, useValue: instance(reportService) },
                Store,
                { provide: PLToastService, useValue: instance(mock(PLToastService)) },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
        .compileComponents().then(() => {
            fixture = TestBed.createComponent(PLClientReportsComponent);
            component = fixture.componentInstance;

            store = TestBed.get(Store);
        });
    }));

    it('creates', () => {
        expect(component).toBeTruthy();
    });

    describe('generating reports', () => {
        const client = { id: '1234', firstName: 'Christopher', lastName: 'St. Robin' };
        const reportDates = { start: { year: 2016, month: 5 }, end: { year: 2017, month: 2 } };
        const formattedDate = '2018-07-14';

        beforeEach(() => {
            when(reportService.generateReport(anything())).thenReturn(of({ id: '42' }));

            store.dispatch({ type: 'UPDATE_CURRENT_CLIENT_USER', payload: { client } });

            component.onReportDates(reportDates);

            fixture.detectChanges();
        });

        it('calls report service to get start date', () => {
            when(reportService.monthToStartDateInclusive(anything())).thenReturn('');

            component.generateReport();

            const [startDate]: any = capture(reportService.monthToStartDateInclusive).last();

            expect(startDate).toEqual(reportDates.start);
        });

        it('calls report service to get end date', () => {
            when(reportService.monthToEndDateExclusive(anything())).thenReturn('');

            component.generateReport();

            const [endDate]: any = capture(reportService.monthToEndDateExclusive).last();

            expect(endDate).toEqual(reportDates.end);
        });

        it('includes appointment start date from report service', () => {
            when(reportService.monthToStartDateInclusive(anything())).thenReturn(formattedDate);

            component.generateReport();

            const [params]: any = capture(reportService.generateReport).last();

            expect(params.filterRecords.appointmentStartDate_Gte).toEqual(formattedDate);
        });

        it('includes appointment end date from report service', () => {
            when(reportService.monthToEndDateExclusive(anything())).thenReturn(formattedDate);

            component.generateReport();

            const [params]: any = capture(reportService.generateReport).last();

            expect(params.filterRecords.appointmentEndDate_Lt).toEqual(formattedDate);
        });

        it('includes reportFilenameTitle', () => {
            component.generateReport();

            const [params]: any = capture(reportService.generateReport).last();

            expect(params.reportFilenameTitle).toEqual('StRobin_Christopher');
        });

        it('includes the client ID', () => {
            component.generateReport();

            const [params]: any = capture(reportService.generateReport).last();

            expect(params.filterRecords.clientId_In).toEqual(client.id);
        });

        it('orders by appointmentStartDate', () => {
            component.generateReport();

            const [params]: any = capture(reportService.generateReport).last();

            expect(params.filterRecords.orderBy).toEqual('appointmentStartDate');
        });
    });
});
