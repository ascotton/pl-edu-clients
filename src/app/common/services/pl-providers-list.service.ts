import { Injectable } from '@angular/core';

import {
    PLMayService,
    PLUrlsService,
} from '@root/index';

import { User } from '@modules/user/user.model';

@Injectable()
export class PLProvidersListService {
    constructor(private plMay: PLMayService, private plUrls: PLUrlsService) {}

    areAssignmentsVisible(currentUser: User): boolean {
        const may = this.plMay;

        return may.isAdminType(currentUser) || may.isLead(currentUser) || may.isProvider(currentUser);
    }

    isPhoneColumnVisible(currentUser: User): boolean {
        const may = this.plMay;

        return may.isCustomer(currentUser) || (may.isProvider(currentUser) && !may.isLead(currentUser));
    }

    isScheduleColumnVisible(currentUser: User): boolean {
        return this.plMay.isAdminType(currentUser) || this.plMay.isLead(currentUser);
    }

    mayViewScheduleFor(provider: any): boolean {
        return this.plMay.viewSchedule(provider);
    }

    scheduleUrl(userId: string): string {
        return `${this.plUrls.urls.scheduleFE}/calendar/${userId}`;
    }
}
