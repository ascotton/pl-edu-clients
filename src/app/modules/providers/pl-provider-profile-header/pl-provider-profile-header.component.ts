import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { PLLinkService, PLMayService } from '@root/index';

@Component({
    selector: 'pl-provider-profile-header',
    templateUrl: './pl-provider-profile-header.component.html',
    styleUrls: ['./pl-provider-profile-header.component.less'],
    inputs: ['provider'],
})
export class PLProviderProfileHeaderComponent implements OnInit {
    provider: any = {};
    currentUser: any = {};
    backLink: string = '';
    userMayAssumeLogin: boolean = false;
    mayViewProvider: boolean = false;

    constructor(private plLink: PLLinkService, private store: Store<any>, private plMay: PLMayService) {}

    ngOnInit() {
      this.store.select('backLink')
          .subscribe((previousState: any) => {
              this.backLink = previousState.title;
          });

      this.store.select('currentUser')
          .subscribe((user: any) => {
              this.userMayAssumeLogin = this.plMay.assumeLogin(user);
              this.currentUser = user;
              this.checkPrivileges();
          });
    }

    ngOnChanges() {
        this.checkPrivileges();
    }

    checkPrivileges() {
        if (this.currentUser && this.currentUser.uuid && this.provider && this.provider.user) {
            this.mayViewProvider = (this.provider.user.id === this.currentUser.uuid || this.plMay.isAdminType(this.currentUser) ||
                (this.currentUser.xGlobalPermissions && this.currentUser.xGlobalPermissions.viewPersonnel)) ?
                true : false;
        }
    }

    onClose() {
        this.plLink.goBack();
    }
    
    get showAssumeButton() {
        return this.userMayAssumeLogin && (this.provider && this.provider.user);
    }
};
