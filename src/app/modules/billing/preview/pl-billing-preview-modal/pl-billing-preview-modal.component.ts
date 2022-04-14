import { Component, Input } from '@angular/core';

@Component({
    selector: 'pl-billing-preview-modal',
    templateUrl: './pl-billing-preview-modal.component.html',
})
export class PLBillingPreviewModalComponent {
    @Input() headerText: string;
    @Input() messageText: string;
    @Input() exitButtonText: string;
    @Input() exit: Function;
    @Input() stay: Function;
}
