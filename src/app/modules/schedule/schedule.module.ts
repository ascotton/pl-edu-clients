import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'ng2-tooltip-directive';
// FullCalendar
import { FullCalendarModule } from '@fullcalendar/angular';
// Ng Material
import { MatDialogModule } from '@angular/material/dialog';
// PL Componets
import { PLCommonModule } from '@app/common';
import {
    PLDotLoaderModule,
    PLInputModule,
    PLButtonModule,
    PLTableFrameworkModule,
    PLIconModule,
    PLTabsModule,
    PLModalModule,
    PLProgressModule,
} from '@root/index';
import { PLIDAModule } from '@modules/workflow-manager/workflows/invoice-documentation/pl-ida.module';
// Routing
import { PLScheduleRoutingModule } from './schedule.routing.module';
// Store
import { PLScheduleStoreModule } from './store/schedule.store.module';
// Module Components
import * as components from './components';
import { PLFTEHoursModule } from '../fte/fte.module';
import { PLIDABoxComponent } from './components';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PLScheduleRoutingModule,
        PLScheduleStoreModule,
        FullCalendarModule,
        //
        TooltipModule,
        // Ng Material
        MatDialogModule,
        // PL Comps
        PLCommonModule,
        PLTableFrameworkModule,
        PLDotLoaderModule,
        PLButtonModule,
        PLInputModule,
        PLIconModule,
        PLTabsModule,
        PLIDAModule,
        PLModalModule,
        PLProgressModule,
        PLFTEHoursModule,
    ],
    declarations: [
        components.PLIDABoxComponent,
        components.PLCalendarComponent,
        components.PlCalendarFooterComponent,
        components.PLCalendarContainerComponent,
        components.PLCalendarFiltersComponent,
        components.PLExportCalendarComponent,
        components.PLEventComponent,
        components.PLPendingServiceSelectComponent,
        components.PLEventPreviewComponent,
        components.PLRecordsPreviewComponent,
        // More general
        components.PLInputSearchBelowComponent,
        components.PLRepeatRuleComponent,
        PLIDABoxComponent,
        components.PLSelectBillingCodeComponent,
    ],
    entryComponents: [
        components.PLEventComponent,
        components.PLEventPreviewComponent,
        components.PLRecordsPreviewComponent,
        components.PLExportCalendarComponent,
        components.PLSelectBillingCodeComponent,
    ],
})
export class PLScheduleModule { }
