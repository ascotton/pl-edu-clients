import { TestBed, waitForAsync } from '@angular/core/testing';

import { PLLocationSchedulerService } from './pl-location-scheduler.service';
import moment from 'moment';
import { PLTimeGridService } from '@common/services';
import { PLLocationAvailability, PLAvailability } from '@common/interfaces';
import { ToastrService } from 'ngx-toastr';

describe('PLLocationSchedulerService', () => {

    let service: PLLocationSchedulerService;
    let timeService: PLTimeGridService;
    let toast: ToastrService;

    const UTCFrame = (start: string, end: string) => timeService.timeObj({ start, end }, '');

    const locationAvailability: PLLocationAvailability[] = [
        {
            uuid: '8268f8e4-b6a0-4cfd-b591-2633994fafca',
            day: 'M',
            start: '09:00',
            end: '15:00',
            availableStations: 2,
            dayName: '',
        },
        {
            uuid: '89f196f5-14c4-491a-b9db-4b4101f93025',
            day: 'R',
            start: '07:00',
            end: '12:00',
            availableStations: 1,
            dayName: '',
        },
        {
            uuid: '3fa89eba-0e23-44f1-a0ae-b8b7bff69d24',
            day: 'T',
            start: '10:00',
            end: '14:00',
            availableStations: 1,
            dayName: '',
        },
        {
            uuid: '1fae39ae-8e55-48d1-ba07-4cf92d76e9b0',
            day: 'W',
            start: '07:00',
            end: '16:00',
            availableStations: 3,
            dayName: '',
        },
    ];

    const providerAvailability: PLAvailability[] = [
        {
            day: 'M',
            start: '14:00:00',
            end: '20:00:00',
            uuid: '5b05bb8f-5413-443b-b869-40140ebd5e58',
        },
        {
            day: 'T',
            start: '12:00:00',
            end: '18:00:00',
            uuid: '04e6c0df-b5af-4ad2-90af-008a14b56478',
        },
        {
            day: 'W',
            start: '10:00:00',
            end: '16:00:00',
            uuid: 'bdc8bc70-9bb3-47cf-a265-6b8a41f7e02b',
        },
        {
            day: 'R',
            start: '20:00:00',
            end: '23:30:00',
            uuid: 'bdc8bc70-9bb3-47cf-a265-6b8a41f7e02c',
        },
    ];

    const LA_TZ = 'America/Los_Angeles';
    const NY_TZ = 'America/New_York';

    beforeEach(() => {
        // TODO
        toast = jasmine.createSpyObj<ToastrService>('toastrService', ['error']);
        timeService = new PLTimeGridService();
        service = new PLLocationSchedulerService(timeService, toast);
    });

    it('Should be initialized', () => {
        expect(service).toBeTruthy();
    });

    xit('Should Get Available Time', () => {
        const availability = service.getAvailableTime(
            providerAvailability, NY_TZ, 'M', UTCFrame('18:00', '19:00'));
        expect(availability.length).toBeGreaterThan(0);
    });

    it('Should Get Location Stations', () => {
        const stations = service.getLocationStations(
            locationAvailability, LA_TZ, 'M', UTCFrame('18:00', '19:00'));
        expect(stations).toBeGreaterThan(0);
    });

    it('Should Get Available Stations', () => {
        const time = timeService.timeObj({ start: '11:00', end: '11:30' }, LA_TZ);
        const stations = service.getAvailableStations(
            'M', time,
            { availability: locationAvailability, timezone: LA_TZ },
            { availability: providerAvailability, timezone: NY_TZ });
        expect(stations).toBeGreaterThan(0);
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('Should NOT Get Available Stations', () => {
        const stations = service.getAvailableStations(
            'M', UTCFrame('10:00', '11:00'),
            { availability: locationAvailability, timezone: LA_TZ },
            { availability: providerAvailability, timezone: NY_TZ });
        expect(stations).toBe(0);
        expect(toast.error).toHaveBeenCalled();
    });

    it('Should NOT Get Available Stations WITHOUT Warning', () => {
        const stations = service.getAvailableStations(
            'M', UTCFrame('10:00', '11:00'),
            { availability: locationAvailability, timezone: LA_TZ },
            { availability: providerAvailability, timezone: NY_TZ },
            false);
        expect(stations).toBe(0);
        expect(toast.error).not.toHaveBeenCalled();
    });
});
