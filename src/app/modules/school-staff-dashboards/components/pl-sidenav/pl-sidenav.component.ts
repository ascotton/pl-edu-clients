import {
    Input,
    ViewChild,
    OnDestroy,
    Component,
    ViewEncapsulation,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
// NgRx
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
// RxJs
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// Common
import { PLDesignService } from '@common/services';
import { PLDestroyComponent } from '@common/components';
// Services
import { PLMayService, PLUrlsService } from '@root/index';
import { PLMenuItem } from '../../models';
import { User } from '@modules/user/user.model';

@Component({
    selector: 'pl-sidenav',
    templateUrl: './pl-sidenav.component.html',
    styleUrls: ['./pl-sidenav.component.less'],
    encapsulation: ViewEncapsulation.None,
})
export class PLSidenavComponent extends PLDestroyComponent implements OnDestroy {

    @Input() menuItems: PLMenuItem[];
    @Input() resources = true;
    @Input() bottom = true;

    @ViewChild('sidenav', { static: true }) matSideNav: MatSidenav;

    design: any;
    currentUser$: Observable<User>;
    resourcesMenu$: Observable<PLMenuItem[]>;
    bottomMenu: PLMenuItem[] = [];

    constructor(
        private store$: Store<AppStore>,
        private plMay: PLMayService,
        private plUrls: PLUrlsService,
        public plDesign: PLDesignService) {
        super();
    }

    ngOnInit() {
        this.currentUser$ = this.store$.select('currentUser');
        this.resourcesMenu$ =  this.currentUser$.pipe(
            map((currentUser) => {
                const _resources: PLMenuItem[] = [];
                const isGroup = currentUser.groups.includes('Private Practice - Group');
                if ((currentUser.xGlobalPermissions && currentUser.xGlobalPermissions.provideServices)
                  || this.plMay.isAdminType(currentUser)) {
                    _resources.push({
                        label: 'Help Center',
                        icon: 'help_center',
                        href: this.plUrls.urls.helpDocsFE,
                        target: '_blank',
                    });
                }
                _resources.push({
                    label: 'Telehealth Institute',
                    icon: 'school',
                    href: 'landing/launch-coassemble',
                    target: '_blank',
                });
                if (!isGroup) {
                    _resources.push({
                        label: 'Teletherapy Essentials Facebook Group',
                        icon: 'groups',
                        href: 'https://www.facebook.com/groups/688197601802713',
                        target: '_blank',
                    });
                }
                return _resources;
            }));

        this.plDesign.responsive$.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(responsive => this.design = responsive);
        this.plDesign.setSideNav(this.matSideNav);
    }

    ngOnDestroy() {
        this.plDesign.setSideNav(null);
        super.ngOnDestroy();
    }

    menuItemSelected(isHandset: boolean) {
        if (isHandset) {
            this.matSideNav.close();
        }
    }
}
