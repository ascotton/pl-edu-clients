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

import {PLHttpService, PLLodashService, PLApiAreasOfConcernService,
 PLApiAssessmentsService, PLModalService} from '@root/index';
import { PLClientServicesService } from '../pl-client-services.service';
import { PLStatusHelpComponent }  from '@common/components/';

@Component({
    selector: 'pl-client-evaluations',
    templateUrl: './pl-client-evaluations.component.html',
    styleUrls: ['./pl-client-evaluations.component.less'],
})
export class PLClientEvaluationsComponent implements OnInit, OnChanges, OnDestroy {
    @Input() client: any = {};
    @Input() currentUser: any = {};

    evaluations: any[] = [];
    loadingServices: boolean = true;

    private ngUnsubscribe = new Subject();
    private clientSubject = new ReplaySubject<any>();

    constructor(private plHttp: PLHttpService, private plLodash: PLLodashService,
                private plAreasOfConcern: PLApiAreasOfConcernService,
                private plAssessments: PLApiAssessmentsService,
                private plClientServices: PLClientServicesService,
                private plModal: PLModalService) {
    }

    ngOnInit() {
        this.loadData();

        this.clientSubject.pipe(
            filter((client:any) => client && client.id),
            // As client changes, unsubscribe from any incomplete prior requests
            switchMap((client: any) => this.plClientServices.getEvaluationServicesAndReferrals(client.id)),
            takeUntil(this.ngUnsubscribe),
        )
        .subscribe((res: any) => {
            this.loadingServices = false;
            this.evaluations = res;
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

    // Not directly necessary, but speeds up loading by starting this call now
    // instead of waiting for an individual service to load them.
    loadData() {
        this.plAreasOfConcern.get()
            .subscribe((res: any) => {
            });
        this.plAssessments.get()
            .subscribe((res: any) => {
            });
    }

    displayLearnMore() {
        let modalRef: any;
        const statusNames: any[] = ['Evaluation_NOT_STARTED', 'Evaluation_IN_PROCESS', 'Evaluation_COMPLETED',
            'Evaluation_CANCELLED', 'Evaluation_IDLE'
        ];
        const params = {
            statusNames,
            onCancel: () => {
                modalRef._component.destroy();
            },
            modalHeaderText: `Learn more about Evaluations`,
            introductionText: `Below are the definitions for Evaluations (Evaluation Assessment, Evaluation - Review of
                Records & Evaluation - Screening) statuses ‘Not Started’, ‘In Process’ and ‘Idle” are automatically
                updated and do not require manual change by a Clinician. ‘Completed’ and ‘Cancelled’ statuses do
                require manual change by a Clinician. Evaluations statuses can only be updated using the documentation
                tool within the Schedule.`,
            definitionHeaderText: `Evaluation Statuses`,
        };
        this.plModal.create(PLStatusHelpComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }
}
