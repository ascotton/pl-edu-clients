import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { switchMap, map, filter, first } from 'rxjs/operators';
// NgRx
import { AppStore } from '@root/src/app/appstore.model';
import { Store } from '@ngrx/store';
import { selectLocationState } from '../../store';
// Service
import { PLMayService } from '@root/index';
import { PLAccountsService } from '@common/services';
import { combineLatest } from 'rxjs';

@Injectable()
export class LocationSchedulerPermisionsResolver
    implements Resolve<{ mayEditSchedule: boolean, mayApproveSchedule?: boolean, mayEditReferrals?: boolean }> {

    readonly permissionsMap = {
        MODIFY_SCHEDULE: 'master_scheduler.modify_masterschedule',
        MODIFY_OWN_SCHEDULE: 'master_scheduler.modify_own_masterschedule',
    };

    constructor(
        private store$: Store<AppStore>,
        private plMay: PLMayService,
        private accountsService: PLAccountsService) {}

    resolve() {
        return combineLatest([
            this.store$.select('currentUser'),
            this.store$.select(selectLocationState),
        ]).pipe(
            filter(([user, { loaded }]) => user && user.uuid && loaded),
            switchMap(([user, { value: location }]) => this.accountsService.getAccountPermissions(
                location.parent.sfAccountId, [
                    this.permissionsMap.MODIFY_SCHEDULE,
                    this.permissionsMap.MODIFY_OWN_SCHEDULE]).pipe(
                        map((res) => {
                            const locPerms = res[location.sfAccountId];
                            const mayEditSchedule = locPerms && (locPerms.includes(this.permissionsMap.MODIFY_SCHEDULE)
                                || locPerms.includes(this.permissionsMap.MODIFY_OWN_SCHEDULE));
                            // const admin = this.plMay.isCustomerAdmin(user);
                            const mayApproveSchedule = this.plMay.isClinicalAccountManager(user);
                            const mayEditReferrals = !this.plMay.isCustomerBasic(user);
                            return { mayEditSchedule, mayApproveSchedule, mayEditReferrals };
                        }),
                    )),
            first(),
        );
    }
}
