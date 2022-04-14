import {
    Input,
    Component,
    ElementRef,
    TemplateRef,
    HostListener,
    ViewContainerRef,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    Overlay,
    OverlayRef,
    OverlayConfig,
    ConnectionPositionPair,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
    selector: 'pl-popover',
    templateUrl: './pl-popover.component.html',
    styleUrls: ['./pl-popover.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLPopoverComponent {

    private _portal: TemplatePortal;
    private _overlayRef: OverlayRef | null = null;
    private _open = false;

    @Input() template: TemplateRef<any>;
    @Input() disabled: boolean;
    @HostListener('mouseover', ['$event']) onHover(event: MouseEvent) {
        this.open();
    }
    @HostListener('mouseout', ['$event']) onLeave(event: MouseEvent) {
        this.close();
    }

    constructor(
        private _overlay: Overlay,
        private _element: ElementRef<HTMLElement>,
        private _viewContainerRef: ViewContainerRef) {
    }

    /**
    * This method creates the overlay from the provided menu's template and saves its
    * OverlayRef so that it can be attached to the DOM when openMenu is called.
    */
    private createOverlay(): OverlayRef {
        if (!this._overlayRef) {
            const config = new OverlayConfig({
                positionStrategy: this._overlay.position()
                    .flexibleConnectedTo(this._element)
                    .withPositions([
                        new ConnectionPositionPair(
                          { originX: 'start', originY: 'bottom' },
                          { overlayX: 'start', overlayY: 'top' },
                        ),
                        new ConnectionPositionPair(
                          { originX: 'start', originY: 'top' },
                          { overlayX: 'start', overlayY: 'bottom' },
                        ),
                    ])
                    .withPush(false),
                panelClass: ['pl-popover-panel', 'mat-elevation-z4', 'padding'],
                scrollStrategy: this._overlay.scrollStrategies.reposition(),
            });
            this._overlayRef = this._overlay.create(config);
        }
        return this._overlayRef;
    }

    private getPortal(): TemplatePortal {
        if (!this._portal || this._portal.templateRef !== this.template) {
            this._portal = new TemplatePortal(this.template, this._viewContainerRef);
        }
        return this._portal;
    }

    open() {
        if (this.disabled || this._open) {
            return;
        }
        const overlayRef = this.createOverlay();
        overlayRef.attach(this.getPortal());
        this._open = true;
    }

    close() {
        if (this.disabled || !this._overlayRef || !this._open) {
            return;
        }
        this._overlayRef.detach();
        this._open = false;
    }

    toggle() {
        this._open ? this.open() : this.close();
    }
}
