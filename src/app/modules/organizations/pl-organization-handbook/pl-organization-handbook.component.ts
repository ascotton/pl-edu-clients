import { Component, OnDestroy, OnInit } from '@angular/core';

import { Store } from '@ngrx/store';
import { AppStore } from '@root/src/app/appstore.model';
import { environment } from '@environments/environment';
import { PLSchoolYearsService } from '@common/services/';
import { CanComponentDeactivate } from '@root/src/app/common/can-deactivate-guard.service';
import { RouterStateSnapshot, Router } from '@angular/router';

import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { PLBrowserService } from '@root/index';
import { PLOrganizationsService } from '../pl-organizations.service';
import { Handbook, TinyConfig, HANDBOOK_ROUTING_STORE } from '../../handbook/handbook.model';

@Component({
    selector: 'pl-organization-handbook',
    templateUrl: './pl-organization-handbook.component.html',
    styleUrls: ['./pl-organization-handbook.component.less'],
})
export class PLOrganizationHandbookComponent implements OnInit, OnDestroy, CanComponentDeactivate {
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
    private organizationName: string;

    constructor(
        private router: Router,
        private store: Store<AppStore>,
        private plBrowserSvc: PLBrowserService,
        private plSchoolYearSvc: PLSchoolYearsService,
        private plOrganizationsSvc: PLOrganizationsService,
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
        const currentSchoolYear$ = this.plSchoolYearSvc.getCurrentSchoolYear().pipe(first());
        const currentOrganization$ = this.plOrganizationsSvc.currentOrgDetails().pipe(first());

        forkJoin([currentSchoolYear$, currentOrganization$]).subscribe(([schoolYear, organization]) => {
            this.handbookInfo = {
                schoolYearId: schoolYear.id,
                orgId: organization.id,
                orgName: organization.name,
            };

            this.loaded.orgAndSchool = true;
            this.organizationName = organization.name;
            this.setPageTitle('Summary');
            this.renderComponents();
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
            const pageTitle = `${sectionName} - Handbook - ${this.organizationName}`;
            this.plBrowserSvc.setTitle(pageTitle);
        }
    }

    private unload(event: any) {
        event.returnValue = 'Leave site? Changes you made may not be saved.';
    }

    //#endregion Private Functions
}
