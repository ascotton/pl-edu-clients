import {
    Input,
    Renderer2,
    Component,
    ElementRef,
    ChangeDetectionStrategy,
} from '@angular/core';

@Component({
    selector: 'pl-alert',
    templateUrl: './pl-alert.component.html',
    styleUrls: ['./pl-alert.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLAlertComponent {

    @Input() type: string;
    @Input() icon: string;

    constructor(
        private elementRef: ElementRef,
        private renderer: Renderer2) {}

    ngOnInit() {
        if (!this.icon) {
            const iconMap = {
                warn: 'exclamation',
                error: '',
                info: '',
                success: '',
            };
            this.icon = iconMap[this.type];
        }
        this.renderer.addClass(this.elementRef.nativeElement, this.type);
    }


}
