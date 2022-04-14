import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PLButtonModule, PLDotLoaderModule, PLIconModule, PLInputModule } from '@root/index';

import { PLFTEHoursComponent } from './pl-fte-hours/pl-fte-hours.component';
import { PLFTEWrapperComponent } from './pl-fte-wrapper/pl-fte-wrapper.component';
import { PLFTEOverHoursSurveyComponent } from './pl-fte-over-hours/pl-fte-over-hours-survey.component';
import { PLAppointmentService } from '../schedule/services/pl-appointment.service';

@NgModule({
    imports: [
        RouterModule,
        CommonModule,
        PLIconModule,
        PLInputModule,
        PLButtonModule,
        PLDotLoaderModule,
    ],
    exports: [
        PLFTEHoursComponent,
        PLFTEWrapperComponent,
        PLFTEOverHoursSurveyComponent,
    ],
    declarations: [
        PLFTEHoursComponent,
        PLFTEWrapperComponent,
        PLFTEOverHoursSurveyComponent,
    ],
    providers: [
        PLAppointmentService,
    ],
})
export class PLFTEHoursModule {}
