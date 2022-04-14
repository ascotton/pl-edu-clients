import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';

import {
    PLIconModule,
    PLInputModule,
    PLTabsModule,
    PLTableFrameworkModule,
    PLDotLoaderModule,
    PLModalModule,
} from '@root/index';

import { PLCommonModule } from '@common/index';
import { PLAccountContactsComponent } from './pl-account-contacts/pl-account-contacts.component';
import { PLAccountContactsFormComponent } from './pl-account-contacts-form/pl-account-contacts-form.component';
import { PLAccountContactsRolesHelpComponent } from './pl-account-contacts-roles-help/pl-account-contacts-roles-help.component';
import { PLAccountAvailabilityComponent } from './pl-account-availability/pl-account-availability.component';
import { PLAccountStudentStatusChartComponent } from './pl-account-student-status-chart/pl-account-student-status-chart.component';
import { PLAccountOverviewComponent } from './pl-account-overview/pl-account-overview.component';
import { PLAccountSchoolYearDatesFormComponent } from './pl-account-school-year-dates-form/pl-account-school-year-dates-form.component';
import { PLAccountBlackoutDatesFormComponent } from './pl-account-blackout-dates-form/pl-account-blackout-dates-form.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        ChartsModule,
        PLCommonModule,
        PLIconModule,
        PLInputModule,
        PLTabsModule,
        PLTableFrameworkModule,
        PLDotLoaderModule,
        PLModalModule,
    ],
    exports: [
        PLAccountContactsComponent,
        PLAccountContactsFormComponent,
        PLAccountContactsRolesHelpComponent,
        PLAccountAvailabilityComponent,
        PLAccountStudentStatusChartComponent,
        PLAccountOverviewComponent,
        PLAccountSchoolYearDatesFormComponent,
        PLAccountBlackoutDatesFormComponent,
    ],
    declarations: [
        PLAccountContactsComponent,
        PLAccountContactsFormComponent,
        PLAccountContactsRolesHelpComponent,
        PLAccountAvailabilityComponent,
        PLAccountStudentStatusChartComponent,
        PLAccountOverviewComponent,
        PLAccountSchoolYearDatesFormComponent,
        PLAccountBlackoutDatesFormComponent,
    ],
    entryComponents: [
        PLAccountContactsFormComponent,
        PLAccountContactsRolesHelpComponent,
        PLAccountSchoolYearDatesFormComponent,
        PLAccountBlackoutDatesFormComponent,
    ],
    providers: [
    ],
})
export class PLAccountModule {}
