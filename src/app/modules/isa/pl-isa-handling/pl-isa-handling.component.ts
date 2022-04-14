import { ToastrService } from 'ngx-toastr';
import { PLISAService } from "../pl-isa.service";
import { ISAModalMode, ISATableMode } from "../index";
import { Component, Input, OnInit } from "@angular/core";

interface UserSigning {
    fullNameLabel: string,
    fullNameModel: string,
    titleModel: string,
}

@Component({
    selector: "pl-isa-handling",
    templateUrl: "./pl-isa-handling.component.html",
    styleUrls: ["./pl-isa-handling.component.less"],
})
export class PLISAHandlingComponent implements OnInit {
    @Input() modalMode: ISAModalMode;
    @Input() headerText: string;
    @Input() onCompletion: Function;
    @Input() selectedISAs?: any[];

    isMainButtonDisabled = true;
    
    isProcessingISAs = false;

    tableMode = ISATableMode.removeISA;
    
    user: UserSigning = {
        fullNameLabel: '',
        fullNameModel: '',
        titleModel: '',
    };

    constructor(
        private toastSvc: ToastrService,
        private plISAsSvc: PLISAService,
    ) {}

    get isaModalMode() {
        return ISAModalMode;
    }

    get bannerTextForUI() {
        let text: string;

        switch (this.modalMode) {
            case this.isaModalMode.sign:
                text = `You selected ${this.selectedISAs.length} ISA(s) to sign.`;
                break;

            case this.isaModalMode.remove:
                text = `${this.selectedISAs.length} ISA(s) will remain unsigned and be removed. Input a reason for not signing the ISA(s).`;
                break;
        }

        return text;
    }

    get buttonTextForUI() {
        let text: string;

        switch (this.modalMode) {
            case this.isaModalMode.sign:
                text = `Sign ${this.selectedISAs.length} ISAs`;
                break;

            case this.isaModalMode.remove:
                text = `Remove ${this.selectedISAs.length} ISAs`;
                break;
        }

        return text;
    }

    ngOnInit() {
        if (this.modalMode === this.isaModalMode.sign) {
            if(this.plISAsSvc.userTitle !== '-') this.user.titleModel = this.plISAsSvc.userTitle;
            if(this.plISAsSvc.userFullName) this.user.fullNameLabel = this.plISAsSvc.userFullName;
        }
    }

    onTableDataReceived(event: {selectedISAs: any}) {
        if (event.selectedISAs) this.disableMainButton(event.selectedISAs.length !== this.selectedISAs.length);
    }
    
    onSigningInputBoxesChange() {
        let disableMainButton = true;

        if (this.user.fullNameModel === this.user.fullNameLabel && this.user.titleModel) {
            disableMainButton = false;
            this.plISAsSvc.userTitle = this.user.titleModel;
        }

        this.disableMainButton(disableMainButton)
    }

    onMainButtonClick() {
        this.isProcessingISAs = true;
        const referralIds = this.selectedISAs.map(({uuid}) => uuid);

        if (this.modalMode === this.isaModalMode.sign) this.signISAs(referralIds);
        if (this.modalMode === this.isaModalMode.remove) this.removeISAs(referralIds);
    }

    //#region Private Functions

    private disableMainButton(disable: boolean): void {
        this.isMainButtonDisabled = disable;
    }

    private processedISAsOnSuccess(msg: string, title: string) {
        this.toastSvc.success(msg, title, { positionClass: 'toast-bottom-right' });
        this.onCompletion();
    }

    private processedISAsOnError(msg: any, title: string) {
        this.toastSvc.error(msg, title, { positionClass: 'toast-bottom-right' });
        this.onCompletion();
    }

    private signISAs(referralIds: any) {
        this.plISAsSvc.signISAs(referralIds).subscribe(
            (success: any) => {
                if (success.is_approved) {
                    const message = `${referralIds.length} ISA(s) successfully signed.`;
                    this.processedISAsOnSuccess(message, 'ISA(s) Successfuly Signed');
                } else {
                    this.processedISAsOnError(null, 'Error: There was an Error, please reload and try again.');
                }    
            },
            (error: any) => this.processedISAsOnError(error.error.detail, 'Error: ISAs Not Signed'),
        );
    }

    private removeISAs(referralIds: any) {
        const reasonCodes = this.selectedISAs.map(({unsignReason}) => unsignReason);
        const reasonOthers = this.selectedISAs.map(({unsignReasonComment}) => unsignReasonComment);
        
        this.plISAsSvc.removeISAs(referralIds, reasonCodes, reasonOthers).subscribe(
            (success: any) => {
                if (success.detail) {
                    this.toastSvc.error(success.detail, 'Error: ISAs Not Signed', { positionClass: 'toast-bottom-right' });
                } else {                        
                    const message = `${this.selectedISAs.length} ISA(s) successfully removed.`;
                    this.processedISAsOnSuccess(message, 'ISA(s) Successfuly Removed');
                }
            },
            (error: any) => this.processedISAsOnError(error.error.detail, 'Error: ISAs Not Signed'),
        );
    }

    //#endregion Private Functions
}
