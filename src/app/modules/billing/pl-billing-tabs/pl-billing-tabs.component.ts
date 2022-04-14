import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { AppStore } from '@root/src/app/appstore.model';
import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { selectIsW2User } from '@common/store/user.selectors';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-billing-tabs',
    templateUrl: './pl-billing-tabs.component.html',
    styleUrls: ['./pl-billing-tabs.component.less'],
})
export class PLBillingTabsComponent implements OnInit, AfterContentChecked {
    isValidRoute = false;
    isW2Provider = false;

    tabs: PLSubNavigationTabs[] = [];

    constructor(
        private router: Router,
        private store$: Store<AppStore>,
    ) { }

    ngOnInit(): void {
        this.store$.select(selectIsW2User).subscribe(user => this.isW2Provider = user);
    }

    ngAfterContentChecked(): void {
        if (this.isW2Provider) {
            const snapshotUrl = this.router.routerState.snapshot.url;
            const isValidRoute = (
                snapshotUrl.indexOf('timesheet-detail') === -1
                && snapshotUrl.indexOf('invoice') === -1
            );

            if (this.isValidRoute !== isValidRoute) {
                this.isValidRoute = isValidRoute;
                this.tabs = [
                    { href: '/billing/billings', label: 'Billings' },
                    { href: '/billing/view-amendments', label: 'Amendments (Beta)' },
                ];
            }
        }
    }

}
