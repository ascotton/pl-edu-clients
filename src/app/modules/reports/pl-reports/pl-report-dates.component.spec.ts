import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
    mock,
    instance,
    when,
} from 'ts-mockito';

import { PLToastService, PLLodashService } from '@root/index';
import { PLReportDatesComponent } from './pl-report-dates.component';
import { PLReportDatesService } from './pl-report-dates.service';

describe('PLReportDatesComponent', () => {
    let component: PLReportDatesComponent;
    let fixture: ComponentFixture<PLReportDatesComponent>;
    let service: PLReportDatesService;

    beforeEach(waitForAsync(() => {
        service = mock(PLReportDatesService);

        TestBed.configureTestingModule({
            declarations: [PLReportDatesComponent],
            providers: [
                { provide: PLToastService, useValue: instance(mock(PLToastService)) },
                PLLodashService,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
        .overrideComponent(PLReportDatesComponent, {
            set: {
                providers: [
                    { provide: PLReportDatesService, useValue: instance(service) },
                ],
            },
        })
        .compileComponents().then(() => {
            fixture = TestBed.createComponent(PLReportDatesComponent);
            component = fixture.componentInstance;
        });
    }));

    it('creates', () => {
        when(service.currentYear()).thenReturn(2019);
        when(service.currentMonthIndex()).thenReturn(0);

        expect(component).toBeTruthy();
    });

    describe('dates', () => {
        let callback: any;

        beforeEach(() => {
            callback = jasmine.createSpy('callback');

            when(service.currentYear()).thenReturn(2019);
            when(service.currentMonthIndex()).thenReturn(0);
        });

        it('emits immediately on init', () => {
            component.dates.subscribe(callback);

            fixture.detectChanges();

            expect(callback).toHaveBeenCalled();
        });

        it('is emitted when months are changed', () => {
            fixture.detectChanges();

            component.dates.subscribe(callback);

            component.onChangeMonth();

            expect(callback).toHaveBeenCalled();
        });

        it('is emitted when years are changed', () => {
            fixture.detectChanges();

            component.dates.subscribe(callback);

            component.onChangeYear();

            expect(callback).toHaveBeenCalled();
        });

        it('matches the selection', () => {
            fixture.detectChanges();

            component.dates.subscribe(callback);

            when(service.monthsInYear(2016)).thenReturn(12);
            when(service.monthsInYear(2017)).thenReturn(12);

            component.startYear = '2016';
            component.startMonthIndex = '5';
            component.endYear = '2017';
            component.endMonthIndex = '1';

            component.onChangeYear();

            const [dates] = callback.calls.argsFor(0);

            expect(dates).toEqual({ start: { year: 2016, month: 5 }, end: { year: 2017, month: 1 } });
        });

        it('includes null start if no start month is selected', () => {
            fixture.detectChanges();

            component.dates.subscribe(callback);

            component.startYear = '2019';
            component.startMonthIndex = null;

            component.onChangeYear();

            const [dates] = callback.calls.argsFor(0);


            expect(dates.start).toBeNull();
        });

        it('includes null end if no start month is selected', () => {
            fixture.detectChanges();

            component.dates.subscribe(callback);

            component.endYear = '2019';
            component.endMonthIndex = null;

            component.onChangeYear();

            const [dates] = callback.calls.argsFor(0);

            expect(dates.end).toBeNull();
        });
    });

    describe('date validation', () => {
        beforeEach(() => {
            // We are in April, 2019
            when(service.currentYear()).thenReturn(2019);
            when(service.currentMonthIndex()).thenReturn(3);
        });

        it('start month is cleared if newly selected year does not include that month', () => {
            fixture.detectChanges();

            component.startYear = '2019';
            component.startMonthIndex = '6'; // We are only in April; this is invalid

            component.onChangeYear();

            expect(component.startMonthIndex).toBe(null);
        });

        it('end month is cleared if newly selected year does not include that month', () => {
            fixture.detectChanges();

            component.endYear = '2019';
            component.endMonthIndex = '4'; // May is after April

            component.onChangeYear();

            expect(component.endMonthIndex).toBe(null);
        });
    });

    describe('truncated month options', () => {
        beforeEach(() => {
            when(service.currentYear()).thenReturn(2019);
            when(service.currentMonthIndex()).thenReturn(0);
        });

        it('will include 12 months for previous years', () => {
            when(service.monthsInYear(2012)).thenReturn(12);

            fixture.detectChanges();

            component.startYear = '2012';

            component.onChangeYear();

            expect(component.monthOptions.start.length).toBe(12);
        });

        it('start months will not include months that are not in current year, if current year is selected', () => {
            when(service.monthsInYear(2019)).thenReturn(3);

            fixture.detectChanges();

            component.startYear = '2019';

            component.onChangeYear();

            expect(component.monthOptions.start.length).toBe(3);
        });

        it('end months will not include months that are not in current year, if current year is selected', () => {
            when(service.monthsInYear(2019)).thenReturn(3);

            fixture.detectChanges();

            component.endYear = '2019';

            component.onChangeYear();

            expect(component.monthOptions.end.length).toBe(3);
        });
    });
});
