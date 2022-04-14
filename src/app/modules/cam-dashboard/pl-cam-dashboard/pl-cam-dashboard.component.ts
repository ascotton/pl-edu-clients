import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';

import { User } from '@modules/user/user.model';
import { PLSchoolYearsService } from '@common/services/';
import { PLCamDashboardTabsService } from '../pl-cam-dashboard-tabs.service';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-cam-dashboard',
    templateUrl: './pl-cam-dashboard.component.html',
    styleUrls: ['./pl-cam-dashboard.component.less'],
})
export class PLCamDashboardComponent implements OnInit {
    currentUser: User;
    selectedSchoolYearCode: string;
    selectedSchoolYear: any;
    tabs: PLSubNavigationTabs[] = [];

    constructor(
        private route: ActivatedRoute,
        private tabService: PLCamDashboardTabsService,
        private schoolYearService: PLSchoolYearsService,
    ) {}

    ngOnInit(): void {
        this.tabs = this.tabService.tabs();

        forkJoin(
            this.route.data.pipe(first()),
            this.schoolYearService.getCurrentSchoolYear().pipe(first()),
        ).subscribe(([data, schoolYear]: [{ currentUser: User }, any]) => {
            this.selectedSchoolYearCode = schoolYear.code;
            this.selectedSchoolYear = this.schoolYearService.getYearForCode(schoolYear.code);
            this.currentUser = data.currentUser;
        });
    }

    handleSelectedSchoolYearChange(schoolYearCode: string): void {
        this.selectedSchoolYearCode = schoolYearCode;
        this.selectedSchoolYear = this.schoolYearService.getYearForCode(schoolYearCode);
    }

    isLoaded(): boolean {
        return !!(this.selectedSchoolYearCode && this.currentUser);
    }
}
