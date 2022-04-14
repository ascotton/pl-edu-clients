import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PLDotLoaderModule, PLGraphQLModule, PLIconModule, PLInputModule,
 PLTableFrameworkModule, PLToastModule,
 PLLodashService, PLButtonModule, PLVaryDisplayModule } from '@root/index';

import { PLCommonModule } from  '@common/index';

import { PLClientAbsencesDashboardComponent } from
 "./pl-client-absences-dashboard/pl-client-absences-dashboard.component";
import { PLClientAbsencesDashboardBucketComponent } from
 "./pl-client-absences-dashboard/pl-client-absences-dashboard-bucket.component";
import { PLClientAbsencesService } from
 "./pl-client-absences-dashboard/pl-client-absences.service";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        PLDotLoaderModule,
        PLIconModule,
        PLInputModule,
        PLTableFrameworkModule,
        PLToastModule,
        PLButtonModule,
        PLCommonModule,
        PLVaryDisplayModule,
    ],
    exports: [PLClientAbsencesDashboardComponent],
    declarations: [
        PLClientAbsencesDashboardComponent,
        PLClientAbsencesDashboardBucketComponent,
    ],
    providers: [
        PLLodashService,
        PLClientAbsencesService,
    ],
})
export class PLClientAbsencesModule {}

export { PLClientAbsencesService } from './pl-client-absences-dashboard/pl-client-absences.service';
export { PLClientAbsences } from './pl-client-absences-dashboard/pl-client-absences';
export { PLClientAbsencesConsecutive } from './pl-client-absences-dashboard/pl-client-absences-consecutive';
export { PLClientAbsencesRate } from './pl-client-absences-dashboard/pl-client-absences-rate';
export { PLClientAbsencesYtd } from './pl-client-absences-dashboard/pl-client-absences-ytd';
