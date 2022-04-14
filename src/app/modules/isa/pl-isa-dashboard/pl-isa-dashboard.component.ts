import { Router } from "@angular/router";
import { PLISAService } from "../pl-isa.service";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { PLModalService } from "@root/src/lib-components/pl-modal/pl-modal.service";
import { PLISAHandlingComponent } from "../pl-isa-handling/pl-isa-handling.component";
import { ISAInfo, ISADashboardButtons, ISAModalMode, ISATableMode, ISAFeatureStates } from "../index";

@Component({
    selector: "pl-isa-dashboard",
    templateUrl: "./pl-isa-dashboard.component.html",
    styleUrls: ["./pl-isa-dashboard.component.less"],
})
export class PLISADashboardComponent implements OnInit, OnDestroy {

    isas: ISAInfo = {
        count: 0,
        next: null,
        previous: null,
        results: []
    };

    selectedISAs: any[] = []; // The ISAs selected for signing/removing on the `Manage ISA` view.
    
    tableMode: ISATableMode;
    
    signedISAs = 0;
    unsignedISAs = 0;

    isReadOnlyView: boolean;

    primaryButton: { label: string; mode: string };
    secondaryButton: { label: string; mode: string };

    private BUTTON_MODE = {
        signOrRemove: {
            label: 'Sign or Remove ISAs',
            mode: ISADashboardButtons.signOrRemove,
        },
        signSelected: {
            label: 'Sign Selected ISAs',
            mode: ISADashboardButtons.sign,
        },
        requestDownload: { // Not used in any scenario for now.
            label: 'Request Download',
            mode: ISADashboardButtons.download,
        },
        removeSelected: {
            label: 'Remove Selected ISAs',
            mode: ISADashboardButtons.remove,
        },
    };

    constructor(
        private router: Router,
        private plISASvc: PLISAService,
        private plModalSvc: PLModalService,
    ) {}

    /**
     * For loading purposes (pl-dot-loader) the state won't be returned 'til the `tableMode` is set.
     */
    get currentFeatureState() {
        if (this.tableMode) {   
            return this.plISASvc.isasFeatureState;
        } else {
            return ISAFeatureStates.unavailable;
        }
    }

    get currentSchoolOrgName() {
        return this.plISASvc.currentSchoolOrgName;
    }

    get isaFeatureStates() {
        return ISAFeatureStates;
    }

    ngOnInit() {
        const tableViewMode = this.plISASvc.isasModeSelectedFromDashboard;

        switch (tableViewMode) {
            case ISATableMode.readOnlyISA:
                this.setReadOnlyView();
                break;
        
            case ISATableMode.manageISA:
                this.setManageView();
                break;
            
            default:
                return this.router.navigate(['/dashboard/']);
        }
    }

    ngOnDestroy() {
        this.plISASvc.isasModeSelectedFromDashboard = ISATableMode.readOnlyISA;
    }

    isPrimaryButtonDisabled(): boolean {
        if (this.isReadOnlyView) {
            return this.unsignedISAs === 0;
        } else { // Signing or removing view
            return this.selectedISAs.length === 0;
        }
    }

    isSecondaryButtonDisabled() {   
        if (!this.isReadOnlyView) return this.selectedISAs.length === 0;
    }

    /**
     * So far this is only used by the link on the `Manage ISAs` view.
     * This returns the user back to the `ReadOnly` view.
     */
    onLinkClick() {
        this.setReadOnlyView();
    }

    onPrimaryButtonClick(mode: string) {
        switch (mode) {
            case ISADashboardButtons.signOrRemove:
                this.setManageView();
                break;

            case ISADashboardButtons.sign:
                this.openModalForHandlingISAs('Sign Independent Service Agreements', ISAModalMode.sign);
                break;
        }
    }
        
    onSecondaryButtonClick() {
        this.openModalForHandlingISAs('Remove Independent Service Agreements', ISAModalMode.remove);
    }

    /**
     * Receives the ISAs emitted from the table.
     * `isas` are the whole amount of ISAs.
     * `selectedISAs` are the ISAs selected by the user for signing or removing.
     * 
     * @param event - Holds the ISAs emitted from the table
     */
    onTableDataReceived(event: any) {
        const isas = (event && event.isas && event.isas.count > 0);
        const selectedISAs = (event && event.selectedISAs);

        if (isas && selectedISAs) {
            this.isas = event.isas;
            this.selectedISAs = event.selectedISAs;
        } else {
            this.setReadOnlyView();
        }
    }

    //#region Private Functions

    /**
     * View for reading all the signed ISAs.
     * The undefined table mode sets the loading dots in the ui
     */
    private setReadOnlyView() {
        this.tableMode = undefined;
    
        this.plISASvc.getNumberOfUnsignedISAs().subscribe(
            (unsignedISAs: number) => {
                this.isReadOnlyView = true;
                this.unsignedISAs = unsignedISAs
                this.tableMode = ISATableMode.readOnlyISA;
                this.primaryButton = this.BUTTON_MODE.signOrRemove;
                this.secondaryButton = this.BUTTON_MODE.requestDownload;
            },
            (error: any) => {
                console.error(`There was an error loading the number of unsigned ISAs`);
                console.error(error);
            }
        );
    }

    /**
     * View for selecting the ISAs to sign or to remove.
     */
    private setManageView() {
        this.isReadOnlyView = false;
        this.tableMode = ISATableMode.manageISA;
        this.primaryButton = this.BUTTON_MODE.signSelected;
        this.secondaryButton = this.BUTTON_MODE.removeSelected;
    }

    private openModalForHandlingISAs(headerText: string, modalMode: string) {
        let modalSvcRef: any;

        const params = {
            modalMode,
            headerText,
            selectedISAs: this.selectedISAs,
            onCompletion: () => modalSvcRef._component.destroy(),
        };

        this.plModalSvc.create(PLISAHandlingComponent, params).subscribe(reference => modalSvcRef = reference);
    }

    //#endregion Private Functions
}
