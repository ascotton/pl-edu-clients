import { Component } from '@angular/core';
import { PLUrlsService } from '@root/index';
import { PLInvoiceDocumentationService } from './pl-ida.service';

@Component({
    selector: 'pl-invoice-documentation-view',
    templateUrl: './pl-ida-view.component.html',
    styleUrls: ['./pl-ida-view.component.less'],
})
export class PLInvoiceDocumentationViewComponent {
    constructor(
        public BO: PLInvoiceDocumentationService,
        public plUrls: PLUrlsService,
    ) {}
}
