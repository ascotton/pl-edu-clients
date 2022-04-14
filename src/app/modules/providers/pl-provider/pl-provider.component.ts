import { Component } from '@angular/core';
import { PLProviderService } from '../pl-provider.service';
import { Store } from '@ngrx/store';
import { PLAddRecentProvider } from '@modules/search/store/search.store';
import { PLSubNavigationTabs } from '@root/src/app/common/interfaces/pl-sub-navigation-tabs';

@Component({
    selector: 'pl-provider',
    templateUrl: './pl-provider.component.html',
    styleUrls: ['./pl-provider.component.less'],
})
export class PLProviderComponent {
    allLoaded = false;
    provider: any = {};
    permissionCode: number;
    mayViewProvider = false;
    tabs: PLSubNavigationTabs[] = [];
    
    constructor(private plProvider: PLProviderService, private $store: Store<any>) {
    }

    ngOnInit() {
        this.plProvider.getFromRoute()
            .subscribe((res: any) => {
                this.provider = res.provider;
                this.$store.dispatch(PLAddRecentProvider({ provider: this.provider }));
                this.mayViewProvider = res.mayViewProvider;

                this.tabs = this.plProvider.getTabs(this.provider.user);
                this.allLoaded = true;
            }, (err: any) => {
                this.permissionCode = err.permissionCode;
                this.allLoaded = true;
            });
    }
}
