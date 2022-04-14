import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    PLDotLoaderModule,
    PLIconModule,
    PLInputModule,
} from '@root/index';

import { PLReportDatesComponent } from './pl-reports/pl-report-dates.component';

@NgModule({
    imports: [
        CommonModule,
        PLIconModule,
        PLInputModule,
    ],
    exports: [PLReportDatesComponent],
    declarations: [PLReportDatesComponent],
})
export class PLReportsModule {}
