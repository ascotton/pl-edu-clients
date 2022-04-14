import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { filter, takeUntil, switchMap } from 'rxjs/operators';

import { PLHttpService, PLLodashService, PLModalService,
 PLClientStudentDisplayService } from '@root/index';
import { PLClientServicesService } from '../pl-client-services.service';
import { PLStatusHelpComponent }  from '@common/components/';

@Component({
    selector: 'pl-client-direct-services',
    templateUrl: './pl-client-direct-services.component.html',
    styleUrls: ['./pl-client-direct-services.component.less'],
})
export class PLClientDirectServicesComponent implements OnInit, OnChanges, OnDestroy {
    @Input() client: any = {};
    @Input() currentUser: any = {};

    directServices: any[] = [];
    loadingServices: boolean = true;

    private ngUnsubscribe = new Subject();
    private clientSubject = new ReplaySubject<any>();

    constructor(private plHttp: PLHttpService, private plLodash: PLLodashService,
                private plModal: PLModalService, private plClientServices: PLClientServicesService) {
    }

    ngOnInit() {
        this.clientSubject.pipe(
            filter((client:any) => client && client.id),
            // As client changes, unsubscribe from any incomplete prior requests
            switchMap((client: any) => this.plClientServices.getDirectServicesAndReferrals(client.id)),
            takeUntil(this.ngUnsubscribe),
        )
        .subscribe((res: any) => {
            this.loadingServices = false;
            this.directServices = res;
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        // true on component init
        if (changes.client) {
            this.clientSubject.next(this.client);
        }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    onRefresh() {
        this.clientSubject.next(this.client);
    }

    displayLearnMore() {
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        let modalRef: any;
        const statusNames: any[] = ['DirectService_NOT_STARTED', 'DirectService_IN_PROCESS', 'DirectService_COMPLETED',
            'DirectService_CANCELLED', 'DirectService_IDLE'
        ];
        const params = {
            statusNames,
            onCancel: () => {
                modalRef._component.destroy();
            },
            modalHeaderText: `Learn more about Direct Services`,
            introductionText: `
                Below are the definitions for the various Direct Services (Direct Service & Consultation) statuses. ‘Not
                Started’, ‘In Therapy’ and ‘Idle’ statuses are automatically updated and do not require manual change by a
                Clinician. ‘Completed’ and ‘Discontinued’ statuses do require manual change by a Clinician. Direct Services
                statuses can only be updated on the ${clientStudentCapital} Profile in the Services tab.`,
            definitionHeaderText: `Direct Service Statuses`,
        };
        this.plModal.create(PLStatusHelpComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }
}
