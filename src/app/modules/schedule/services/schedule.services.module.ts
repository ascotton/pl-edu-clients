import { NgModule } from '@angular/core';
// Module Services
import { PLScheduleService } from './schedule.service';
import { PLBillingCodesService } from './billing-codes.service';
import { PLClientsService } from './clients.service';
import { PLClientServicesService } from './client-services.service';
import { PLLocationsService } from './locations.service';
import { PLProvidersService } from './providers.service';
import { PLScheduleHelperService } from './pl-schedule-helper.service';
// PL Record
import { PLRecordParticipantsService } from '../pl-records/pl-record-participants.service';
import { PLRecordService } from '../pl-records/pl-record.service';
import { PLAppointmentService } from './pl-appointment.service';
import { PLEventParticipantsService } from './pl-event-participants.service';
// PL Invoice
import { PLInvoiceService } from '../../billing/pl-invoice.service';

@NgModule({
    imports: [],
    providers: [
        PLClientsService,
        PLScheduleService,
        PLProvidersService,
        PLLocationsService,
        PLBillingCodesService,
        PLClientServicesService,
        PLScheduleHelperService,
        PLAppointmentService,
        PLEventParticipantsService,
        // PL Records
        PLRecordParticipantsService,
        PLRecordService,
        PLInvoiceService,
    ],
})
export class PLScheduleServicesModule { }
