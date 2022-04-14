import { Injectable } from '@angular/core';
// Third Party
import { ToastrService } from 'ngx-toastr';
// Services
import { PLTimeGridService } from '@common/services';
// Models
import {
    PL_INTERVAL,
    PL_GROUPING,
    PLReferral,
    PLTimeFrame,
    PLAvailability,
    PLProviderProfile,
    PLLocationAvailability,
} from '@common/interfaces';
import { PLProviderSession } from '../models';

@Injectable()
export class PLLocationSchedulerService {

    toastTitles = {
        GroupError: 'Unable to Group',
        ReserveError: 'Unable to Reserve',
    };

    constructor(
        private timeGridService: PLTimeGridService,
        private toastr: ToastrService) {}

    toastError(title: string, message: string) {
        this.toastr.error(message, title, { positionClass: 'toast-bottom-right' });
    }

    toast(title: string, message: string, type = 'error') {
        const config = { positionClass: 'toast-bottom-right' };
        if (type === 'error') {
            this.toastr.error(message, title, config);
        }
        if (type === 'warn') {
            this.toastr.warning(message, title, config);
        }
    }

    referralFullfillment(referral: PLReferral, sessions?: PLProviderSession[]):
        { scheduledTime: number, expectedTime: number } {
        let monthlyScheduledTime = 0;
        let monthlyExpectedTime = 0;
        let expectedTime = 0;
        let scheduledTime = 0;
        if (referral.interval && referral.frequency) {
            monthlyExpectedTime = referral.frequency * referral.duration;
            const repeats = {
                [PL_INTERVAL.Day]: 20,
                [PL_INTERVAL.Week]: 4,
            };
            const frequency = Math.ceil((repeats[referral.interval] || 1) * referral.frequency);
            monthlyExpectedTime = Math.round(frequency * referral.duration);
            if (sessions.length > 0) {
                monthlyScheduledTime = sessions
                    .map(({ start, end, week }) => {
                        const { start: _start, end: _end } = this.timeGridService.timeObj({ start, end }, '');
                        return _end.diff(_start, 'minutes')  * (week ? 1 : 4);
                    }).reduce((p, c) => p + c);
            }
            expectedTime = monthlyExpectedTime;
            scheduledTime = monthlyScheduledTime;
            if ([PL_INTERVAL.Day, PL_INTERVAL.Week].includes(referral.interval)) {
                expectedTime /= 4;
                scheduledTime /= 4;
            }
        }
        return { expectedTime, scheduledTime };
    }

    getProviderTypes(referrals: PLReferral[]): string[] {
        return [...new Set(referrals.map(({ providerType }) => providerType.shortName))];
    }

    providerCheck(provider: PLProviderProfile, referrals: PLReferral[]): boolean {
        const [referralType] = this.getProviderTypes(referrals);
        const title = this.toastTitles.ReserveError;
        // Check if Provider Type is the Same
        if (!provider.providerTypes.find(pt => pt.shortName === referralType)) {
            this.toastError(title,
                `Cannot create an appoint for a different service type - ${provider.providerTypes.map(pt => pt.shortName).join(', ')}`);
            return false;
        }
        // Check if provider is the Same
        if ([...new Set(referrals.map(r => r.provider.id))].find(id => id !== provider.user.id)) {
            this.toastError(title,
                // Referral type doesn't match provider type
                `Provider ${provider.user.firstName} ${provider.user.lastName} is not assigned to
                    ${referrals.map(({ client }) => `${client.firstName} ${client.lastName}`).join(', ')}`);
            return false;
        }
        return true;
    }

    canGroup(referrals: PLReferral[]): boolean {
        const noGroup = referrals.filter(r => r.grouping === PL_GROUPING.Individual);
        if (noGroup.length) {
            const names: string[] = [];
            noGroup.forEach(r => names.push(`${r.client.firstName} ${r.client.lastName}`));
            this.toastError(
                this.toastTitles.GroupError,
                `Referral - ${names.join(',')} cannot participate in group therapy sessions.`);
            return false;
        }
        if (this.getProviderTypes(referrals).length > 1) {
            this.toastError(
                this.toastTitles.GroupError,
                `Referrals with different service types cannot reserve group therapy sessions.`);
        }
        return true;
    }

    getAvailableTime(
        availability: PLAvailability[],
        timezone: string,
        day: string,
        time: PLTimeFrame): PLAvailability[] {
        const { start, end } = time;
        return availability ? availability.filter(a => a.day === day && this.timeGridService.inTimeFrame(
            this.timeGridService.timeObj(a, timezone), start, end)) : [];
    }

    getLocationStations(
        availability: PLLocationAvailability[],
        timezone: string,
        day: string,
        time: PLTimeFrame): number {
        const [_locationAvailability] =
            <PLLocationAvailability[]>this.getAvailableTime(availability, timezone, day, time);
        return _locationAvailability ? _locationAvailability.availableStations : 0;
    }

    getAvailableStations(
        day: string,
        time: PLTimeFrame,
        location: {
            availability: PLLocationAvailability[],
            timezone: string,
        },
        provider?: {
            availability: PLAvailability[],
            timezone: string,
        },
        warn = true): number {
        const { start, end } = this.timeGridService.timeBlock(time);
        let availableStations = this.getLocationStations(location.availability, location.timezone, day, time);
        if (!availableStations && warn) {
            this.toastError(this.toastTitles.ReserveError, `School is not available during ${start} - ${end}`);
        }
        if (provider) {
            const isProviderAvailable = 
                !!this.getAvailableTime(provider.availability, provider.timezone, day, time).length;
            if (!isProviderAvailable) {
                availableStations = 0;
                if (warn) {
                    this.toastError(
                        this.toastTitles.ReserveError,
                        `Provider is not available during ${start} - ${end}`);
                }
            }
        }
        return availableStations;
    }
}
