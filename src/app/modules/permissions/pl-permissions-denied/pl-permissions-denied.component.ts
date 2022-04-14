import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '@environments/environment';

@Component({
    selector: 'pl-permissions-denied',
    templateUrl: './pl-permissions-denied.component.html',
    styleUrls: ['./pl-permissions-denied.component.less'],
})
/**
 *  Displays permission error message. To show a customer message, pass content
 *  through the template, e.g.:
 *    <pl-permissions-denied>My message</pl-permissions-denied>
 */
export class PLPermissionsDeniedComponent {
    /**
     * navigateBack {boolean} if true, clicking back button will use browser back method
     */
    @Input() navigateBack: boolean = true;
    @Input() code: number = 403;
    @Output() back: EventEmitter<any> = new EventEmitter();
    supportEmail: String = environment.support_email;

    constructor(private location: Location) {}

    goBack() {
        this.back.emit();

        if (this.navigateBack) {
            this.location.back();
        }
    }
}
