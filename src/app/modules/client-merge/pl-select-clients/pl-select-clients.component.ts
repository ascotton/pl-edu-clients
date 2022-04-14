import { Component, OnInit, OnDestroy } from '@angular/core';
import { PLClientMergeService } from '../pl-client-merge.service';
import { PLSelectClientsTableService } from './pl-select-clients-table.service';
import { PLTableFrameworkUrlService, PLToastService, PLGraphQLService }
    from '@root/index';
import { PLSchoolYearsService } from '@common/services';
import { User } from '@modules/user/user.model';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { PLComponentStateInterface, PLUtilService } from '@common/services';

@Component({
    selector: 'pl-select-clients',
    templateUrl: './pl-select-clients.component.html',
    styleUrls: ['./pl-select-clients.component.less'],
})
export class PLSelectClientsComponent implements OnInit, OnDestroy {
    public _state: PLComponentStateInterface;
    private classname = 'PLSelectClientsComponent';
    currentUser: User;

    selectedSchoolYear: string = null;
    private schoolYearLoaded: boolean = false;

    navSubscription: any = null;

    loading: boolean = false;
    clients: any[] = [];
    total: number;

    readonly TABLE_STATE_NAME = 'cm';
    currentPage: number;
    pageSize: number;

    // if onQuery is called before the user is loaded we queue it until the user has been loaded
    private queryQueuedForUser: any = null;

    constructor(
        public util: PLUtilService,
        public clientMergeService: PLClientMergeService,
        public plSelectClientsTableService: PLSelectClientsTableService,
        private plTableFrameworkUrl: PLTableFrameworkUrlService,
        private yearsService: PLSchoolYearsService,
        private plToast: PLToastService,
        private plGraphQL: PLGraphQLService,
        private store: Store<AppStore>
    ) { }

    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.classname,
            fn: (state, done) => {
                this.navSubscription = this.clientMergeService.navigateRequested$.subscribe(
                    (stepIndex: number) => {
                        if (this.clientMergeService.clientsSelected === 2) {
                            this.clientMergeService.confirmNavigate(stepIndex);
                        } else {
                            this.plToast.show('error', 'Please select two clients to merge');
                        }
                    },
                );
                this.currentUser = state.currentUser;
                if (this.queryQueuedForUser) {
                    this.onQuery.apply(this, this.queryQueuedForUser);
                    this.queryQueuedForUser = null;
                }
                this.store.select('clientsList').subscribe((state: any) => {
                    if (state === 'REMOTE_UPDATE_CLIENTS_LIST') {
                        this.plGraphQL.reset();
                    }
                });
                this.initSchoolYear();
                done();
            }
        });
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.navSubscription.unsubscribe();
        this.util.destroyComponent(this._state);
    }

    onQuery(info: { query: any }) { // fetch clients once we know the schoolYear
        this.clientMergeService.lastSelectQuery = info.query;
        if (info.query && this.schoolYearLoaded) {
            info.query.schoolYearCode_In = this.selectedSchoolYear === 'all_time' ? null : this.selectedSchoolYear;
            if (this.currentUser && this.currentUser.uuid) {
                this.loading = true;
                this.plSelectClientsTableService.onQuery(info, this.TABLE_STATE_NAME).subscribe(
                    (results: any) => {
                        this.clients = results.clients;
                        this.total = results.total;
                        this.loading = false;
                    },
                );
            } else {
                this.queryQueuedForUser = arguments;
            }
        }
    }

    onYearSelected(evt: any) {
        this.selectedSchoolYear = evt.model;
        this.onQuery({ query: this.clientMergeService.lastSelectQuery });
    }

    initSchoolYear() {
        this.plTableFrameworkUrl.getStateFromUrl(this.TABLE_STATE_NAME).subscribe((res: any) => {
            if (res.query.schoolYearCode_In) {
                this.selectedSchoolYear = res.query.schoolYearCode_In;
                this.schoolYearLoaded = true;
                this.onQuery({ query: this.clientMergeService.lastSelectQuery });
            } else {
                this.selectedSchoolYear = "all_time";
                this.schoolYearLoaded = true;
                this.onQuery({ query: this.clientMergeService.lastSelectQuery });
            }
        });
    }
}
