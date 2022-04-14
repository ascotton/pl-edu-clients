import { Component, OnInit } from '@angular/core';

import { Store } from '@ngrx/store';
import { AppStore } from '@root/src/app/appstore.model';
import { environment } from '@environments/environment';
import { PLBrowserService } from '@root/index';
import { PLSchoolYearsService } from '@common/services/';
import { Router, RouterStateSnapshot } from '@angular/router';

import { first } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { PLLocationService } from '../pl-location.service';
import { Handbook, TinyConfig, HANDBOOK_ROUTING_STORE } from '../../handbook/handbook.model';

@Component({
    selector: 'pl-location-handbook',
    templateUrl: './pl-location-handbook.component.html',
    styleUrls: ['./pl-location-handbook.component.less'],
})
export class PLLocationHandbookComponent implements OnInit {
    contentToLoad: any = null;
    disableSchoolYears = false;
    handbookInfo: Handbook = {
        schoolYearId: null,
        orgId: null,
        orgName: null,
    };
    isLoading = true;
    isOkForRender = false;
    supportEmail: string = environment.support_email;
    selectedSchoolYear: any = null;
    timeoutTime = environment.TINY_TIMEOUT_TIME;
    intervalTime = environment.TINY_INTERVAL_TIME;
    tinyConfiguration: TinyConfig = {
        height: 550,
        menubar: false,
        plugins: ['table print emoticons paste fullscreen'],
        toolbar: 'undo redo | formatselect | bold italic underline backcolor emoticons | \
                    alignleft aligncenter alignright alignjustify | \
                    bullist numlist outdent indent | table print fullscreen',
    };

    private handbookRoutingAction$: any;
    private routingStoreConst = HANDBOOK_ROUTING_STORE;
    private loaded = {
        orgAndSchool: false,
        contents: false,
    };
    private nextStateURL: string;
    private locationName: string;

    constructor(
        private router: Router,
        private store: Store<AppStore>,
        private plBrowserSvc: PLBrowserService,
        private plLocationSvc: PLLocationService,
        private plSchoolYearSvc: PLSchoolYearsService,
    ) { }

    ngOnInit(): void {
        this.getSchoolAndOrgInfo();

        // Helps canDeactivate function scenario
        this.handbookRoutingAction$ = this.store.select<any>(this.routingStoreConst.FUNCTION_NAME)
            .subscribe((action: any) => {
                if (this.nextStateURL && action && action === this.routingStoreConst.CONTINUE) {
                    this.router.navigate([this.nextStateURL]);
                    this.nextStateURL = null;
                }
            });
    }

    ngOnDestroy(): void {
        this.handbookRoutingAction$.unsubscribe();
        this.removeBeforeUnloadListener();
    }

    onYearSelected(evt: any): void {
        if (evt && evt.model) {
            const selectedSchoolYearFull = this.plSchoolYearSvc.getYearForCode(evt.model);

            if (selectedSchoolYearFull && selectedSchoolYearFull.id) {
                this.handbookInfo = {
                    schoolYearId: selectedSchoolYearFull.id,
                    orgId: this.handbookInfo.orgId,
                    orgName: this.handbookInfo.orgName,
                };
                return;
            }
        }

        this.renderComponents(false);
    }

    /**
     * Stop routing if Text Editor is being edited.
     * Text Editor being edited === School Years disabled.
     * Otherwise continue routing.
     */
    canDeactivate({ }, { }, nextState: RouterStateSnapshot) {
        let response = true;

        if (this.disableSchoolYears) {
            this.nextStateURL = nextState.url;
            this.store.dispatch(this.routingStoreConst.STOP_ROUTE);
            response = false;
        }

        return response;
    }

    /**
     * The renderFlag help us to display or not an error in the UI
     * renderFlag is based on whether the $event is valid or not.
     */
    contentsEvent($event: any) {
        let renderFlag = false;

        if ($event && ($event.name || $event.handbookInfo)) {
            let valid = false;
            renderFlag = !renderFlag;

            if ($event) {
                valid = !valid;
                this.contentToLoad = $event;
                this.setPageTitle($event.name);
            }

            this.loaded.contents = valid;
        }

        this.renderComponents(renderFlag);
    }

    isEditorBeingEdited($event: boolean) {
        this.disableSchoolYears = $event;

        if ($event) {
            window.addEventListener('beforeunload', this.unload);
        } else {
            this.removeBeforeUnloadListener();
        }
    }

    //#region Private Functions

    private getSchoolAndOrgInfo() {
        const locationId$ = this.plLocationSvc.getIdFromRoute().pipe(first());
        const currentSchoolYear$ = this.plSchoolYearSvc.getCurrentSchoolYear().pipe(first());

        forkJoin([locationId$, currentSchoolYear$])
            .subscribe(([currentLocationId, schoolYear]) => {
                this.plLocationSvc.getLocation(currentLocationId).subscribe((current: any) => {
                    // use "parent" in case user is customer basic (no access to organization in GQL)
                    const currentOrgId = current.location.parent.id;
                    const currentOrgName = current.location.parent.name;

                    this.handbookInfo = {
                        schoolYearId: schoolYear.id,
                        orgId: currentOrgId,
                        orgName: currentOrgName,
                    };

                    this.loaded.orgAndSchool = true;
                    this.locationName = current.location.name;
                    this.setPageTitle('Summary');
                    this.renderComponents();
                });
            });
    }

    /**
     * In charge of rendering three states: On Load, On Success, and On Error
     * Scenario 'On Error' uses the param 'load_in'
     *   If 'On Error' wants to be activated; send param as false.
     * @param load_in
     */
    private renderComponents(load_in: boolean = true) {
        let render = false;
        let loading = load_in;
        const load = this.loaded;

        if (load && load.orgAndSchool && load.contents) {
            render = !render;
            loading = !loading;
        }

        this.isLoading = loading;
        this.isOkForRender = render;
    }

    private removeBeforeUnloadListener() {
        window.removeEventListener('beforeunload', this.unload);
    }

    private setPageTitle(sectionName: string) {
        if (sectionName) {
            const pageTitle = `${sectionName} - Handbook - ${this.locationName}`;
            this.plBrowserSvc.setTitle(pageTitle);
        }
    }

    private unload(event: any) {
        event.returnValue = 'Leave site? Changes you made may not be saved.';
    }

    //#endregion Private Functions
}
