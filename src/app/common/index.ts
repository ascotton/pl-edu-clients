import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChartsModule } from 'ng2-charts';
// Angular Material
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { EditorModule } from '@tinymce/tinymce-angular';

import {
    PLInputModule,
    PLIconModule,
    PLModalModule,
    PLVaryDisplayModule,
    PLDotLoaderModule,
} from '@root/index';

import {
    PLSchoolyearSelectComponent,
    PLClientIdComponent,
    PLDateTimeRangeComponent,
    PLHelpSupportComponent,
    PLIsAvailableComponent,
    PLNavHeaderComponent,
    PLNavLeftStepsComponent,
    PLStatusDotComponent,
    PLStatusHelpComponent,
    PLTimeGridBlockComponent,
    PLTimeGridColumnComponent,
    PLTimeGridSchedulerComponent,
    PLWeeklyTimeGridComponent,
    PLSimpleMeterComponent,
    PLReferralFiltersComponent,
    PLAlertComponent,
    PLDoughnutChartComponent,
    PLLegendsComponent,
    PLDataLoaderComponent,
    PLGenericModalComponent,
    PLEditableTableComponent,
    PLPopoverComponent,
    PLConfirmDialog2Component,
    PLNotesListComponent,
    PLNoteEditorComponent,
    PLGalleryModalComponent,
    PLReferralNotesComponent,
    PLClientContactSaveComponent,
} from './components';

import {
    PLMatomoDirective,
} from './directives';

import {
    PLAccountsService,
    PLAssignedLocationsService,
    PLExpirationService,
    PLGetProviderService,
    PLLocationsService,
    PLProvidersListService,
    PLProviderProfileService,
    PLNotesReportService,
    PLSchoolYearsService,
    PLUserAssignmentsService,
    PLUtilService,
    PLRouteIdService,
    PLEventMessageBus,
    PLTimeGridService,
    PLTasksService,
    PLReferralNotesService,
 } from './services';

import {
    PLPhonePipe,
    PLStatePipe,
    PLTruncatePipe,
    PLCurrencyPipe,
    PLYesNoEmptyPipe,
    PLOptionsPipe,
    PLTimingPipe,
    PLSafeurlPipe,
    PLSafeHtmlPipe,
} from './pipes';

import {
    ProviderTypesResolver,
    CurrentUserResolver,
    CurrentSchoolYearResolver,
    AssignedLocationsResolver,
    ProviderResolver,
    UserAssigmentsResolver,
    PreviewInvoiceResolver,
    BillingCodesResolver,
    PLMaterialDesignResolver,
    PreviewBillingsResolver,
    PreviewTimesheetResolver,
    SchoolYearsResolver,
} from './resolvers';

import { PLCommonStoreModule } from './store';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ValidOptionValidatorDirective } from './validators';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        // 3rd Party
        ChartsModule,
        // Angular Material
        DragDropModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatButtonModule,
        MatDialogModule,
        MatDatepickerModule,
        MatMomentDateModule,
        ScrollingModule,
        // PL Comps
        PLInputModule,
        PLIconModule,
        PLModalModule,
        PLVaryDisplayModule,
        PLCommonStoreModule,
        PLDotLoaderModule,
        EditorModule,
    ],
    exports: [
        PLClientIdComponent,
        PLHelpSupportComponent,
        PLPhonePipe,
        PLStatePipe,
        PLCurrencyPipe,
        PLSchoolyearSelectComponent,
        PLIsAvailableComponent,
        PLNavHeaderComponent,
        PLNavLeftStepsComponent,
        PLStatusDotComponent,
        PLStatusHelpComponent,
        PLTruncatePipe,
        PLYesNoEmptyPipe,
        PLOptionsPipe,
        PLTimingPipe,
        PLSafeurlPipe,
        PLSafeHtmlPipe,
        PLTimeGridBlockComponent,
        PLTimeGridColumnComponent,
        PLTimeGridSchedulerComponent,
        PLWeeklyTimeGridComponent,
        PLSimpleMeterComponent,
        PLDateTimeRangeComponent,
        PLReferralFiltersComponent,
        PLAlertComponent,
        PLDoughnutChartComponent,
        PLDataLoaderComponent,
        PLLegendsComponent,
        PLMatomoDirective,
        MatTooltipModule,
        PLGenericModalComponent,
        PLEditableTableComponent,
        PLPopoverComponent,
        PLConfirmDialog2Component,
        ValidOptionValidatorDirective,
        PLNotesListComponent,
        PLNoteEditorComponent,
        PLReferralNotesComponent,
        PLGalleryModalComponent,
        PLClientContactSaveComponent
    ],
    declarations: [
        PLClientIdComponent,
        PLDateTimeRangeComponent,
        PLHelpSupportComponent,
        PLPhonePipe,
        PLStatePipe,
        PLCurrencyPipe,
        PLSchoolyearSelectComponent,
        PLIsAvailableComponent,
        PLNavHeaderComponent,
        PLNavLeftStepsComponent,
        PLStatusDotComponent,
        PLStatusHelpComponent,
        PLTruncatePipe,
        PLYesNoEmptyPipe,
        PLOptionsPipe,
        PLSafeurlPipe,
        PLSafeHtmlPipe,
        PLTimingPipe,
        PLTimeGridBlockComponent,
        PLTimeGridColumnComponent,
        PLTimeGridSchedulerComponent,
        PLWeeklyTimeGridComponent,
        PLSimpleMeterComponent,
        PLReferralFiltersComponent,
        PLAlertComponent,
        PLDoughnutChartComponent,
        PLLegendsComponent,
        PLDataLoaderComponent,
        PLGenericModalComponent,
        PLEditableTableComponent,
        PLPopoverComponent,
        PLConfirmDialog2Component,
        ValidOptionValidatorDirective,
        PLMatomoDirective,
        PLNotesListComponent,
        PLNoteEditorComponent,
        PLReferralNotesComponent,
        PLGalleryModalComponent,
        PLClientContactSaveComponent,
    ],
    providers: [
        PLAccountsService,
        PLAssignedLocationsService,
        PLNotesReportService,
        PLExpirationService,
        PLGetProviderService,
        PLProvidersListService,
        PLProviderProfileService,
        PLLocationsService,
        PLSchoolYearsService,
        PLUserAssignmentsService,
        PLUtilService,
        PLRouteIdService,
        PLEventMessageBus,
        PLTimeGridService,
        PLTasksService,
        // Resolvers
        ProviderTypesResolver,
        CurrentUserResolver,
        CurrentSchoolYearResolver,
        AssignedLocationsResolver,
        ProviderResolver,
        UserAssigmentsResolver,
        PreviewBillingsResolver,
        PreviewInvoiceResolver,
        PreviewTimesheetResolver,
        SchoolYearsResolver,
        BillingCodesResolver,
        PLMaterialDesignResolver,
        PLReferralNotesService,
    ],
    entryComponents: [
        PLConfirmDialog2Component,
        PLGalleryModalComponent,
    ],
})
export class PLCommonModule {}
