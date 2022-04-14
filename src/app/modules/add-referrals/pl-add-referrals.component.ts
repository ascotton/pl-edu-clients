import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

import { PLAddReferralsNavigationService } from './pl-add-referrals-navigation.service';
import { PLAddReferralsLocationYearService } from './pl-add-referrals-location-year.service';
import { PLAddReferralsDataTableService } from './pl-add-referrals-table-data.service';
import { AppConfigService } from '@app/app-config.service';

import { PLConfirmDialogService, PLLinkService } from '@root/index';

import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';

@Component({
    selector: 'pl-add-referrals',
    templateUrl: './pl-add-referrals.component.html',
    styleUrls: ['./pl-add-referrals.component.less'],
})
export class PLAddReferralsComponent implements CanComponentDeactivate, OnInit, OnDestroy {

    steps: any[] = [];
    returnHomeSubscription: any;
    previousRoute: string;
    plAddReferralsNavigationService: any;
    destroyed$ = new Subject<boolean>();
    backLink = '';

    constructor(
        private router: Router, private route: ActivatedRoute,
        plAddReferralsNavigationService1: PLAddReferralsNavigationService,
        private locationService: PLAddReferralsLocationYearService,
        private tableDataService: PLAddReferralsDataTableService,
        private appConfig: AppConfigService,
        private plConfirm: PLConfirmDialogService,
        private plLink: PLLinkService,
    ) {
        this.plAddReferralsNavigationService = plAddReferralsNavigationService1;
        this.setSteps();
        plAddReferralsNavigationService1.navigateConfirmed$.pipe(takeUntil(this.destroyed$))
            .subscribe((stepIndex) => {
                this.router.navigate([this.steps[stepIndex].href],
                                     { queryParams: this.steps[stepIndex].hrefQueryParams },
                );
            });
        this.route.queryParams
            .pipe(first())
            .subscribe((params) => {
                if (params.next) {
                    this.backLink = params.next;
                }
            });
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    private locationCheck() {
        if (this.locationService.selectedLocationID === null &&
            !this.router.routerState.snapshot.url.includes('select-location')) {
            this.router.navigate([this.steps[0].href],
                                 { queryParams: this.steps[0].hrefQueryParams },
            );
        }

    }

    setSteps() {
        const hrefBase = `/add-referrals/`;
        const hrefParams = {};
        const steps = [
            { key: 'select-location', label: 'Select Location and School Year', href: `${hrefBase}select-location`,
                hrefQueryParams: hrefParams },
            { key: 'upload-referrals', label: 'Upload Referrals', href: `${hrefBase}upload-referrals`,
                hrefQueryParams: hrefParams },
            { key: 'referrals-confirmation', label: 'Confirmation', href: `${hrefBase}referrals-confirmation`,
                hrefQueryParams: hrefParams, prevDisabled: true },
        ];

        this.steps = steps;
    }

    ngOnInit() {
        // TODO - restore show/hide of App Nav at a later date if truly desired
        // this.appConfig.showAppNav = false;
        const thisRouteParams = this.route.snapshot.queryParams;
        this.previousRoute = thisRouteParams.previous;
        this.locationCheck();
        this.plAddReferralsNavigationService.showNavigation = true;
    }

    goHome = () => {
        if (!this.backLink) {
            this.plLink.goBack();
        } else {
            this.plLink.goToUrl(this.backLink);
        }
    }

    cleanup() {
        this.tableDataService.reset();
        this.locationService.reset();
    }

    // @HostListener('window:beforeunload')
    canDeactivate() {
        if (this.plAddReferralsNavigationService.uploadComplete) {
            return true;
        }
        const message = this.tableDataService.finalImportedData.length
            ? 'There are referrals that have not been successfully created.'
            : 'New referrals will not be uploaded.';
        return new Observable<boolean>((observer: any) => {
            this.plConfirm.show({header: 'Cancel Add Referrals',
                content:   `<div style="padding-bottom:12px;">Are you sure you want to end now?</div>
                            <div>${message}</div>`,
                primaryLabel: 'Yes', secondaryLabel: 'No',
                primaryCallback: () => {
                    this.cleanup();
                    observer.next(true);
                },
                secondaryCallback: () => {
                    observer.next(false);
                },
                closeCallback: () => {
                    observer.next(false);
                },
            });
        });
    }

    stepsRefresh() {
    }

    stepsCancel() {
        this.goHome();
    }

    stepsFinish() {
        this.goHome();
    }

    stepsNext(event: any) {
        this.plAddReferralsNavigationService.requestNavigate(event.nextIndex);
    }
}
