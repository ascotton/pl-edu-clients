import { Injectable } from '@angular/core';
import { PLSubNavigationTabs } from '../../common/interfaces/pl-sub-navigation-tabs';

@Injectable({
    providedIn: 'root',
})
export class PLCamDashboardTabsService {
    tabs(): PLSubNavigationTabs[] {
        return [
            { label: 'Overview', href: '/cam-dashboard/overview' },
            { label: 'Assignment Manager', href: '/assignment-manager' },
            { label: 'Scheduling Status', href: '/cam-dashboard/locations-scheduling-status' },
        ];
    }
}
