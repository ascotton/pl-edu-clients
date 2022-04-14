import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CanDeactivateGuard } from '@common/can-deactivate-guard.service';
import { PLScheduleAvailabilityComponentsModule } from './schedule-availability-components.module';

import { PLAvailabilityViewComponent } from
    './availability/pl-availability-view.component';

@NgModule({
    imports: [
        PLScheduleAvailabilityComponentsModule,
        RouterModule.forChild([{
            path: '',
            canDeactivate: [CanDeactivateGuard],
            component: PLAvailabilityViewComponent,
        }]),
    ],
})
export class PLScheduleAvailabilityModule {
}

export { PLAvailabilityViewComponent } from
    './availability/pl-availability-view.component';
export { PLScheduleAvailabilityComponentsModule } from './schedule-availability-components.module';
