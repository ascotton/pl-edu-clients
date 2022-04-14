import { Component } from '@angular/core';

import {PLHttpService, PLMayService, PLApiAreasOfConcernService,
 PLApiAssessmentsService, PLModalService,
 PLGraphQLService, PLToastService, PLConfirmDialogService } from '@root/index';
import { PLClientEvaluationReassignComponent } from '../pl-client-evaluation-reassign/pl-client-evaluation-reassign.component';
import { PLClientEvaluationReassignService } from '../pl-client-evaluation-reassign/pl-client-evaluation-reassign.service';

import { PLStatusDisplayService } from '@common/services/';
import { CLINICAL_PRODUCT_TYPE } from '@root/src/app/common/constants';

@Component({
    selector: 'pl-client-evaluation',
    templateUrl: './pl-client-evaluation.component.html',
    styleUrls: ['./pl-client-evaluation.component.less'],
    providers: [PLClientEvaluationReassignService],
    inputs: ['client', 'service', 'currentUser'],
})
export class PLClientEvaluationComponent {
    client: any = {};
    service: any = {};
    currentUser: any = {};

    planData: any = [];
    serviceFormatted: any = {};
    expanded: boolean = false;
    classesContainer: any = {
        expanded: this.expanded,
    };
    mayEditService: boolean = false;
    showReassignLink: boolean = false;
    clinicalProductTypes = CLINICAL_PRODUCT_TYPE;
    hasNotes = false;
    locationId: string;

    private areasOfConcern: any[] = [];
    private assessments: any[] = [];

    constructor(private plHttp: PLHttpService, private plMay: PLMayService,
                private plAreasOfConcern: PLApiAreasOfConcernService,
                private plAssessments: PLApiAssessmentsService,
                private plModal: PLModalService,
                private plGraphQL: PLGraphQLService,
                private plToast: PLToastService,
                private plClientEvaluationReassign: PLClientEvaluationReassignService,
                private plStatusDisplayService: PLStatusDisplayService,
                private plConfirmDialogService: PLConfirmDialogService) {
    }

    ngOnInit() {
        this.loadData();
        this.init();
    }

    ngOnChanges(changes: any) {
        this.init();
    }

    loadData() {
        this.plAreasOfConcern.get()
            .subscribe((res: any) => {
                this.areasOfConcern = res;
                this.formatService(this.service);
            });
        this.plAssessments.get()
            .subscribe((res: any) => {
                this.assessments = res;
                this.formatService(this.service);
            });
    }

    init() {
        if (this.service) {
            this.mayEditService = (this.service.permissions &&
             this.service.permissions.updateEvaluation) &&
             this.plMay.editService(this.currentUser, this.client);
            this.showReassignLink = (this.service.permissions.reassignEvaluation ||
             this.service.permissions.reassignEvaluationWithoutBillingImplicationCheck);
        }
        this.formatService(this.service);
        this.setLocationId();

        const convertedReferral = this.service.referrals && this.service.referrals.length ? this.service.referrals[0] : null;
        this.hasNotes = convertedReferral && convertedReferral.hasNotes;
    }

    setLocationId(): void {
        if (this.client && this.client.locations && this.client.locations.length) {
            this.locationId = this.client.locations[0].id;
        }
    }

    formatService(service: any) {
        if (service && this.areasOfConcern.length && this.assessments.length) {

            this.planData = [
                { value: service.evaluationTypeDisplay, label: 'Evaluation Type' },
                { value: service.xDueDate, label: 'Evaluation Due Date' },
                { value: service.xCreatedBy, label: 'Created By'},
            ];

            const aocIds = service.areasOfConcern.map((aoc: any) => {
                return aoc.id;
            });
            const auIds = service.assessmentsUsed.map((au: any) => {
                return au.id
            });

            const areasOfConcernNames = this.plAreasOfConcern.getNamesFromIds(aocIds);
            const assessmentsNames = this.plAssessments.getNamesFromIds(auIds);

            this.serviceFormatted = Object.assign({}, service, {
                xAreasOfConcern: areasOfConcernNames.join(', '),
                xAssessments: assessmentsNames.join(', '),
            });
            this.serviceFormatted.statusDisplay =
                this.plStatusDisplayService.getLabelForStatus('Evaluation_' + this.service.status);
            this.serviceFormatted.referrals = this.service.referrals.find((referral: any) => referral.schoolYear);
        }
    }

    toggleExpand() {
        this.expanded = !this.expanded;
        this.classesContainer.expanded = this.expanded;
    }

    rematch() {
        if (!this.service.permissions.reassignEvaluation) {
            let message = 'You may not reassign this evaluation.';
            if (this.service.reassignmentHasBillingImplications) {
                message = 'Reassigning this evaluation has billing implications. ' +
                 'Please contact asksupport@presencelearning.com for assistance.'
            }
            this.plToast.show('error', message);
        } else {
            if (this.service.reassignmentHasBillingImplications) {
                this.showRematchBillingDialog();
            } else {
                this.showRematchModal();
            }
        }
    }

    showRematchBillingDialog() {
        this.plConfirmDialogService.show({
            type: 'toast',
            toastType: 'warning',
            content: `Reassigning this evaluation has billing implications. Make sure customer is notified. Do you want to continue?`,
            primaryLabel: 'Yes, I want to reassign',
            secondaryLabel: 'Cancel',
            primaryClasses: {
                primary: false,
            },
            secondaryClasses: {
                bare: true,
            },
            primaryCallback: () => {
                this.showRematchModal();
            },
            secondaryCallback: () => {
            },
        });
    }

    showRematchModal() {
        let modalRef: any;
        const client = this.service.client;
        const location = (client.locations && client.locations.length) ? client.locations[0] : {};

        const params: any = {
            client: this.service.client,
            evaluation: {
                discipline: this.service.service.providerTypes.map((t: any) => t.shortName).join(','),
                locationName: location.name || '',
                organizationName: location.parent ? location.parent.name : '',
                productTypeCode: this.service.service.productType.code,
            },
            onGetProviders: () => {
                const clientId = this.service.client.id;
                const providerTypeIds = this.service.service.providerTypes.map((providerType: any) => providerType.id);

                return this.plClientEvaluationReassign.getProviders({ clientId, providerTypeIds });
            },
            onMatch: ({ providerId, newNotes }: { providerId: string, newNotes: string }) => {
                const matchParams = {
                    providerId,
                    newNotes,
                    serviceId: this.service.id,
                };
                return this.plClientEvaluationReassign.match(matchParams);
            },
            onMatchDone: () => {
                modalRef._component.destroy();
            },
            onCancel: () => {
                modalRef._component.destroy();
            },
        };
        this.plModal.create(PLClientEvaluationReassignComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    isEvalWithAssessments(): boolean {
        return this.serviceFormatted.service &&
            this.serviceFormatted.service.productType.code === this.clinicalProductTypes.CODE.EVAL;
    }

    handleNoteCreated(event: any) {
        this.hasNotes = true;
    }
}
