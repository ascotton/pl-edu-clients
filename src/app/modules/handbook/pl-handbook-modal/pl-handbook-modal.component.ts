import { PLModalService, PLModalServiceRoot } from '../../../../lib-components/pl-modal/pl-modal.service';
import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'pl-handbook-modal',
    templateUrl: './pl-handbook-modal.component.html',
    styleUrls: ['./pl-handbook-modal.component.less'],
})
export class PLHandbookModalComponent implements OnInit, AfterViewInit {
    @Input() timeoutTimer: number;
    @Input() headerText: string;
    @Input() onReturn: Function;
    @Input() onCancel: Function;
    @Input() onSave: Function;
    @Input() onSafeLeave: Function;
    @Input() onClose: Function;
    @ViewChild('plHandbookModal') private modalElementRef: ElementRef;

    automaticTimeout: boolean;
    isIntervalRunning: boolean;

    private modalInterval: any;

    constructor(private plModalSvc: PLModalService, private plModalSvcRoot: PLModalServiceRoot) { }

    ngOnInit() {
        if (this.headerText === 'Automatic Timeout') {
            this.automaticTimeout = true;
            this.startInterval();
        } else {
            this.automaticTimeout = false;
        }
    }

    ngAfterViewInit() {
        const closeIconReference = this.modalElementRef.nativeElement.getElementsByClassName('close-icon');
        closeIconReference[0].style = 'display: none'; // Remove 'X' icon from modal.
    }

    returnToEdit() {
        this.onReturn();
        this.closeModal();
    }

    /**
     * Supports three scenarios:
     *  1.- Returning to the edit mode.
     *  2.- Leaving the edit mode by going to a new section of the content.
     *  3.- Supporting second scenario using the `Escape` key.
     *
     * @param withNewContent - Boolean indicating if a new content will be loaded after closing the modal
     */
    closeAndDontSave(withNewContent: boolean = false) {
        this.onCancel(withNewContent);
        this.closeModal();
    }

    close() {
        this.onClose();
        this.closeModal();
    }

    save() {
        this.onSave();
        this.closeModal();
    }

    /**
     * Supports only the `Escape` key scenario.
     * Conditions are according to the logic in the HTML template.
     * `automaticTimeout` selects both negative conditions within the HTML.
     *  -> `if` still time (intervalRunning) closes the modal and allows the user to continue editing.
     *  -> `else` closes the modal withouth returning to edit mode.
     * `else` selects the negative option outside the `automaticTimeout`.
     *  -> Closes the modal and allows the user to move to another section content.
     */
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            if (this.automaticTimeout) {
                if (this.isIntervalRunning) {
                    this.returnToEdit();
                } else {
                    this.close();
                }
            } else {
                this.closeAndDontSave(true);
            }
        }
    }

    private closeModal() {
        this.stopInterval();
        this.plModalSvc.destroyAll();
    }

    private startInterval() {
        this.setIntervalRunning(true);

        if (!this.modalInterval) {
            this.modalInterval = setInterval(() => {
                if (this.timeoutTimer > 1) {
                    this.timeoutTimer--;
                } else {
                    this.onCancel();
                    this.stopInterval();
                }
            }, 1000);
        }
    }

    private stopInterval() {
        this.setIntervalRunning(false);
        clearInterval(this.modalInterval);
    }

    private stopPropagationListener = (event: any) => {
        if (event.target['className'] === 'pl-modal-center') {
            event.stopPropagation();
        }
    }

    private setIntervalRunning(running: boolean) {
        this.isIntervalRunning = running;
    }

}