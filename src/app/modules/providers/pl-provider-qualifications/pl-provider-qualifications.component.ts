import { Component, OnInit } from '@angular/core';
import { PLQualificationsService } from '@common/services';
import { PLQualification } from '@common/interfaces';

import { User } from '@modules/user/user.model';
import { CurrentUserService } from '@modules/user/current-user.service';

import { PLProviderService } from '../pl-provider.service';
import { PLMayService } from '@root/index';
import { withLatestFrom, first } from 'rxjs/operators';

interface RequestsResults {
    qualifications: PLQualification[];
    totalCount: number;
}

@Component({
    selector: 'pl-provider-qualifications',
    templateUrl: './pl-provider-qualifications.component.html',
    // tslint:disable-next-line: use-input-property-decorator
    inputs: ['provider'],
    providers: [PLQualificationsService],
})
export class PlProviderQualificationsComponent implements OnInit {
    user: User;
    readonly expandedRows: Set<any> = new Set();
    loading = false;
    provider: any = {};
    qualifications: PLQualification [] = [];
    total = 0;
    admin = false;
    canShowData = false;

    constructor(
        private plProviderQualificationRequestService: PLQualificationsService,
        private plProvider: PLProviderService,
        private plMay: PLMayService,
        private plCurrentUserService: CurrentUserService,
    ) {}

    ngOnInit() {
        this.plProvider.getFromRoute()
            .pipe(withLatestFrom(this.plCurrentUserService.getCurrentUser()))
            .subscribe(([res, user]: [any, User]) => {
                this.provider = res.provider;

                this.user = user;
                this.admin = (this.plMay.isAdminType(this.user) || this.plMay.isSuperuser(this.user));

                this.canShowData = (
                    this.provider.user.id === this.user.uuid ||
                    this.plMay.isAdminType(this.user) ||
                    this.plMay.isSuperuser(this.user)
                );

                if (this.canShowData) {
                    this.loading = true;
                    this.plProviderQualificationRequestService
                        .getQualificationsRequests(this.provider.user.id)
                        .pipe(first())
                        .subscribe(results => this.onQueryResults(results));
                }
            });
    }

    private onQueryResults(results: RequestsResults): void {
        if (results) {
            this.qualifications = results['results'];
            this.total = results['count'];
            this.loading = false;
        }
    }
}
