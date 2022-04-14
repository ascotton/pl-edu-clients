import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { Observable } from 'rxjs';

@Injectable()
export class PLClientMergePermissionsService implements CanActivate {
    private userCanMergeClients: boolean = false;

    constructor(private store: Store<AppStore>) {
    }

    canActivate(): Observable<any> {
        return new Observable((observer: any) => {
            this.store.select('currentUser').subscribe((user: any) => {
                if (user.uuid) {
                    this.userCanMergeClients = user.xGlobalPermissions && user.xGlobalPermissions.mergeClient;
                    observer.next(this.userCanMergeClients);
                }
            });
        });
    }
}
