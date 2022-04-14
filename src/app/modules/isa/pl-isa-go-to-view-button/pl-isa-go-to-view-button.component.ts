import { Subscription } from "rxjs";
import { PLISAService } from "../pl-isa.service";
import { ActivatedRoute, Router } from "@angular/router";
import { filter, first, switchMap } from "rxjs/operators";
import { ISAFeatureStates, ISATableMode } from "../index";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { PLSchoolYearsService } from "@root/src/app/common/services";

@Component({
    selector: "pl-isa-go-to-view-button",
    templateUrl: "./pl-isa-go-to-view-button.component.html",
    styleUrls: ["./pl-isa-go-to-view-button.component.less"],
})
export class PLISAGoToViewButtonComponent implements OnInit, OnDestroy {
    signedISAs = 0;
    unsignedISAs = 0;

    private currentSchoolYearSubscription$: Subscription;
    private schoolOrgIdUpdatedSubscription$: Subscription;
    private signedAndUnsignedISAsSubscription$: Subscription;

    constructor(
        private router: Router,
        private plISASvc: PLISAService,
        private activatedRoute: ActivatedRoute,
        private plSchoolYearsSvc: PLSchoolYearsService,
    ) { }

    get isaTableMode() {
        return ISATableMode;
    }

    /**
     * Checks the number of signed and unsigned ISAs.
     * A call to the current SY is made before calling the ISAs.
     * The ISAs need to know the current SY before being initialized.
     */
    ngOnInit() {
        if (
            this.plISASvc.isasFeatureState === ISAFeatureStates.notChecked ||
            this.plISASvc.isasFeatureState !== ISAFeatureStates.unavailable 
        ) {
            this.currentSchoolYearSubscription$ = this.plSchoolYearsSvc.getCurrentSchoolYearCode()
                .pipe(first())
                .subscribe(
                    (currentYear: string) => {
                        this.plISASvc.currentSchoolYearCode = currentYear
                        this.getNumberOfSignedAndUnsignedISAs();
                    }
                );
        }
    }

    ngOnDestroy() {
        if (this.currentSchoolYearSubscription$) this.currentSchoolYearSubscription$.unsubscribe();
        if (this.schoolOrgIdUpdatedSubscription$) this.schoolOrgIdUpdatedSubscription$.unsubscribe();
        if (this.signedAndUnsignedISAsSubscription$) this.signedAndUnsignedISAsSubscription$.unsubscribe();
    }

    /**
     * In order to display the component, the feature has to be available & the org has to have any ISA to sign or unsign.
     * 
     * @returns - Boolean telling whether to display or not the component.
     */
    displayComponentInUI() {
        const hasISAs = (!!this.signedISAs || !!this.unsignedISAs);
        const isFeatureAvailable = this.plISASvc.isasFeatureState === ISAFeatureStates.available;

        return (hasISAs && isFeatureAvailable);
    }

    onClickRouteTo(viewMode: ISATableMode): void {
        this.plISASvc.isasModeSelectedFromDashboard = viewMode;
        this.router.navigate(['/isas-dashboard/'], { relativeTo: this.activatedRoute });
    }

    /**
     * Checks if the ISA's feature is enabled.
     *  If not checked:
     *      - Checks if the feature is enabled.
     *  If enabled:
     *      - Calls the unsigned ISA's number and the signed ISA's number of the current year.
     *  If unavailable:
     *      - Calls the unsigned ISA's number and the signed ISA's number of the current year.
     * 
     * The above is for knowing whether to display or not the buttons that redirect to the ISA dashboard
     * And if the buttons are displayed; to do it with the right numbers of ISAs and enabled or disabled features.
     */
    private getNumberOfSignedAndUnsignedISAs() {
        const getISAsOfCurrentYear = true;

        if (this.plISASvc.isasFeatureState === ISAFeatureStates.notChecked) {
            this.signedAndUnsignedISAsSubscription$ = this.plISASvc.isISAFeatureEnabled().pipe(
                filter((isas: {signedISAs: number, unsignedISAs: number, featureState: ISAFeatureStates}) => {
                    const hasISAs = (!!isas.signedISAs || !!isas.unsignedISAs);
                    const isFeatureAvailable = isas.featureState === ISAFeatureStates.available;

                    if (isFeatureAvailable) this.onSuccessfulNumberRetrievedOfISAs(isas);

                    return (isFeatureAvailable && hasISAs);
                }),
                switchMap(() => this.plISASvc.getNumberOfSignedISAs(getISAsOfCurrentYear))
            ).subscribe(
                (signedISAs: number) => { this.signedISAs = signedISAs; },
                (error: any) => console.log(`There was an error retrieving the ISAs. ${error}`)
            );
        } else if (this.plISASvc.isasFeatureState !== ISAFeatureStates.unavailable){
            this.signedAndUnsignedISAsSubscription$ = this.plISASvc.getNumberOfSignedAndUnsignedISAs(getISAsOfCurrentYear).subscribe(
                (isas: {signedISAs: number, unsignedISAs: number}) => this.onSuccessfulNumberRetrievedOfISAs(isas),
                (error: any) => console.log(`There was an error retrieving the ISAs. ${error}`)
            );
        }
    }

    private onSuccessfulNumberRetrievedOfISAs(isas: {signedISAs: number, unsignedISAs: number}) {
        this.signedISAs = isas.signedISAs;
        this.unsignedISAs = isas.unsignedISAs;
        this.subscribeToOrgIdSubject();
    }

    /**
     * This is executed only when the user has more than one school assigned and the subscription hasn't been made.
     * In charge of getting again the number of ISAs every time the user changes the school in the main dashboard.
     */
    private subscribeToOrgIdSubject() {
        if (!this.plISASvc.isUserAssignedToOneSchoolOnly && !this.schoolOrgIdUpdatedSubscription$) {
            this.schoolOrgIdUpdatedSubscription$ = this.plISASvc.schoolOrgIdUpdatedSubject.subscribe( 
                () => this.getNumberOfSignedAndUnsignedISAs()
            );
        }
    }
}
