import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'pl-generic-modal',
    templateUrl: './pl-generic-modal.component.html',
    styleUrls: ['./pl-generic-modal.component.less'],
})
export class PLGenericModalComponent {
    @Input() onCancel: Function;
    @Input() modalHeaderText: string;
    @Input() introText: string;
    @Input() headlineText: string;
    @Input() bodyText: string;

    introTextUnsanitized: any;

    constructor(private domSanitizer: DomSanitizer) { }

    ngOnInit() {
        this.introTextUnsanitized = this.domSanitizer.bypassSecurityTrustHtml(this.introText);
    }

    cancel() {
        this.onCancel();
    }
}
