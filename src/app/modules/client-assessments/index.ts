import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { PLClientsAssessmentsComponent } from './pl-clients-assessments.component';
import { PLAssessmentsTableComponent } from './pl-assessments-table/pl-assessments-table.component';
import { PLAssessmentsProviderMatchingComponent } from './pl-assessments-provider-matching/pl-assessments-provider-matching.component';
import { PLAssessmentsFiltersComponent } from './pl-assessments-filters/pl-assessments-filters.component';
import { PLAssessmentCaseManagerModalComponent } from './pl-assessment-case-manager-modal/pl-assessment-case-manager-modal.component';

import { PLAssessmentsTableService } from './pl-assessments-table.service';
import { PLCommonModule } from '../../common';
import {
    PLButtonModule,
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
    PLModalModule,
    PLTableFrameworkModule,
    PLTableModule,
    PLTabsModule
} from '@root/index';

@NgModule({
    declarations: [
        PLClientsAssessmentsComponent,
        PLAssessmentsTableComponent,
        PLAssessmentsProviderMatchingComponent,
        PLAssessmentsFiltersComponent,
        PLAssessmentCaseManagerModalComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        ScrollingModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatMomentDateModule,
        PLCommonModule,
        PLButtonModule,
        PLInputModule,
        PLTabsModule,
        PLIconModule,
        PLModalModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLDotLoaderModule,
    ],
    exports: [
        PLClientsAssessmentsComponent,
        PLAssessmentCaseManagerModalComponent
    ],
    providers: [
        PLAssessmentsTableService,
    ],
})
export class PLClientAssessmentsModule {}
