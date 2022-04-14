import { PLModalService } from '@root/index';
import {
    Component, OnInit, Input,
    AfterViewInit, ViewChild, ElementRef,
} from '@angular/core';

@Component({
    selector: 'pl-client-referral-save-modal',
    styleUrls: ['./pl-client-referral-save-modal.component.less'],
    templateUrl: './pl-client-referral-save-modal.component.html',
})
export class PLClientReferralSaveModalComponent implements OnInit, AfterViewInit {
    @Input() headerText: string;
    @Input() modalMessage: string;
    @Input() cancel: Function;
    @Input() continue: Function;
    @Input() reviewExistingReferrals: Function;

    @ViewChild('plClientReferralModal', { static: false }) private modalElementRef: ElementRef;

    headerToDisplay: string;
    messageToDisplay: string;

    private stopPropagationListener = (event: any) => {
        if (event.target['className'] === 'pl-modal-center') {
            event.stopPropagation();
        }
    }

    constructor(private plModalSvc: PLModalService) { }

    ngOnInit() {
        this.headerToDisplay = this.headerText;
        this.messageToDisplay = this.modalMessage;

        window.addEventListener('click', this.stopPropagationListener, true);
    }

    ngAfterViewInit() {
        const closeIcon = this.modalElementRef.nativeElement.getElementsByClassName('close-icon');
        closeIcon[0].style = 'display: none'; // Remove 'X' icon from modal.
    }

    onReview() {
        this.reviewExistingReferrals();
        this.closeModal();
    }

    onContinue() {
        this.continue();
        this.closeModal();
    }

    onCancel() {
        this.cancel();
        this.closeModal();
    }

    private closeModal() {
        this.plModalSvc.destroyAll();
    }
}
