import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// Material
import { MatSidenav } from '@angular/material/sidenav';
// RxJs
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// Common
import { PLUrlsService } from '@root/index';
import { PLDestroyComponent } from '@common/components';
import { PLDesignService } from '@common/services';
// Models
import { PLMenuItem } from '../../models';
import { User } from '@modules/user/user.model';
import { environment } from '@environments/environment';

@Component({
    templateUrl: './pl-layout.component.html',
})
export class PLLayoutComponent extends PLDestroyComponent implements OnInit, OnDestroy {

    currentUser: User;
    gloablNav: PLMenuItem[];
    displayHeader$: Observable<boolean>;
    isHandset$: Observable<boolean>;
    sideNav$: Observable<MatSidenav>;
    sideNavOpened$: Observable<boolean>;
    gitSha: string;
    private userGlobalPermissions: any = {};

    constructor(
        public plDesign: PLDesignService,
        private route: ActivatedRoute,
        private plUrls: PLUrlsService) {
        super();
    }

    ngOnInit() {
        this.displayHeader$ = this.plDesign.enabled$;
        this.isHandset$ = this.plDesign.smallScreen$;
        this.sideNav$ = this.plDesign.sideNav$;
        this.sideNavOpened$ = this.plDesign.sideNavOpened$;
        this.gitSha = environment.git_sha ? environment.git_sha.slice(0, 4) : '';
        // TODO: Check Permisios, etc...
        this.route.data
            .pipe(takeUntil(this.destroyed$))
            .subscribe(({ currentUser }) => {
                this.currentUser = currentUser;
                this.userGlobalPermissions = currentUser.xGlobalPermissions || {};
                let navItems: PLMenuItem[] = [{
                    label: 'Home',
                    icon: 'home',
                    material: true,
                    href: '/school-staff',
                }];
                navItems = this.formAppLinks(navItems, currentUser);
                this.gloablNav = navItems;
            });
    }

    formAppLinks(navItems: PLMenuItem[], currentUser: User): PLMenuItem[] {
        const isSSP = this.isSchoolStaffProvider(currentUser);
        if (this.userGlobalPermissions.provideServices || isSSP) {
            return [
                ...navItems,
                {
                    label: 'Room',
                    icon: 'room',
                    target: '_blank',
                    href: this.plUrls.urls.roomFE,
                },
                {
                    label: 'Library',
                    icon: 'library',
                    target: '_blank',
                    href: this.plUrls.urls.libraryFE,
                },
            ];
        }
        return navItems;
    }

    private isSchoolStaffProvider(user: User) {
        const allowGroups = [
            'Private Practice',
            'School Staff Providers',
        ];
        return user && user.groups && user.groups.some((g: string) => allowGroups.includes(g));
    }

}
