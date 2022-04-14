import { Component, Output, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';

import { PLGraphQLService, PLModalService, PLLodashService, PLGQLQueriesService } from '@root/index';

import { serviceDurationPluralizationMapping } from '@common/services/pl-client-service';
import {
    referralGroupingOptions,
    referralIntervalOptions,
} from '@common/services/pl-client-referral';

import { PLClientReferralDeclineComponent } from
 './pl-client-referral-decline/pl-client-referral-decline.component';
import { PLClientReferralDeleteComponent } from
 './pl-client-referral-delete/pl-client-referral-delete.component';

import { CLINICAL_PRODUCT_TYPE } from '../../../common/constants/index';
import { PLClientService } from '../pl-client.service';

@Component({
    selector: 'pl-client-direct-referral',
    templateUrl: './pl-client-direct-referral.component.html',
    styleUrls: ['./pl-client-direct-referral.component.less'],
})
export class PLClientDirectReferralComponent {
    @Input() client: any = {};
    @Input() referral: any = {};
    @Input() currentUser: any = {};
    @Output() onRefresh = new EventEmitter<any>();

    CLINICAL_PRODUCT = CLINICAL_PRODUCT_TYPE;

    referralDisplay: any = {};
    expanded = false;
    classesContainer: any = {
        expanded: this.expanded,
    };
    mayConvertToService = false;
    editingNotes = false;
    hasNotes = false;
    private notesCopy: string;
    savingNotes = false;
    readonly intervalOptions = referralIntervalOptions;
    readonly groupingOptions = referralGroupingOptions;
    readonly durationPluralization = serviceDurationPluralizationMapping;
    locationId: string;

    constructor(
        private router: Router,
        private plModal: PLModalService,
        private plLodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private plClientSvc: PLClientService,
        private plGQLQueries: PLGQLQueriesService,
    ) { }

    ngOnInit() {
        this.init();
    }

    ngOnChanges() {
        this.init();
    }

    init() {
        // this.client = this.plTransformGraphQL.fromSnakeCase(this.client);
        this.setLocationId();
        this.formatReferral(this.referral);
    }

    /**
     * The longName is used to be displayed in the UI for describing the Referral
     * Hopefully in the next release this can be pushed to be added in the BE like the providerType.longName
     * Based on the productType.code; a productTypeLongNames is added to the referral object
     */
    addLongNameToReferralProductType(): void {
        const productTypeLongName = {
            groupbmh_bi: `- ${this.CLINICAL_PRODUCT.NAME.BIG}`,
            direct_service: `- ${this.CLINICAL_PRODUCT.NAME.DIR_TE}`,
            supervision: `- ${this.CLINICAL_PRODUCT.NAME.SV}`,
            groupbmh_ti: `- ${this.CLINICAL_PRODUCT.NAME.TG}`,
        };

        this.referral.productType.longName = productTypeLongName[this.referral.productType.code];
    }

    formatReferral(referral: any) {
        if (referral) {
            this.addLongNameToReferralProductType();

            if (this.referral && this.referral.dueDate) {
                this.referral.dueDate = this.referral.dueDate.slice(0, 10);
            }
            this.referralDisplay = Object.assign({}, this.referral, {});

            // May only convert if in matched state.
            this.mayConvertToService = (referral.permissions.convertReferral && this.referral.state === 'MATCHED');
        }
    }

    setLocationId(): void {
        if (this.client && this.client.locations && this.client.locations.length) {
            this.locationId = this.client.locations[0].id;
        }
    }

    getFrequencyLabel(frequency: number): string {
        return this.plClientSvc.buildFrequencyLabel(frequency);
    }

    isPartOfDirectServices(): boolean {
        const code = this.referral.productType.code;
        const isPartOf = (
            code === this.CLINICAL_PRODUCT.CODE.DIR_SVC ||
            code === this.CLINICAL_PRODUCT.CODE.SV ||
            code === this.CLINICAL_PRODUCT.CODE.BIG ||
            code === this.CLINICAL_PRODUCT.CODE.TG
        );

        return isPartOf;
    }

    toggleExpand() {
        this.expanded = !this.expanded;
        this.classesContainer.expanded = this.expanded;
    }

    toggleNotes() {
        if (!this.editingNotes) {
            this.notesCopy = this.referral.notes;
        }
        this.editingNotes = !this.editingNotes;
    }

    editNotes() {
        if (!this.editingNotes) {
            this.notesCopy = this.referral.notes;
            this.editingNotes = true;
        }
    }

    emptyNotes() {
        this.referral.notes = '';
        this.updateNotes();
    }

    updateNotes() {
        this.savingNotes = true;
        const variables: any = {
            referral: {
                id: this.referral.id,
                notes: this.referral.notes,
            },
        };
        const moreParams = {
            refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
        };
        this.plGraphQL.mutate(`mutation createOrUpdateReferral($referral: ReferralInput) {
            createOrUpdateReferral(input: {referral: $referral}) {
                errors {
                    code
                    field
                    message
                }
                status
                referral {
                    id
                }
            }
        }`, variables, {}, moreParams).subscribe(() => {
            this.savingNotes = false;
            this.formatReferral(this.referral);
            this.toggleNotes();
        }, () => {
            this.savingNotes = false;
        });
    }

    cancelEditNotes() {
        this.referral.notes = this.notesCopy;
        this.toggleNotes();
    }

    showDeclineConfirm() {
        let modalRef: any;
        const params: any = {
            referral: Object.assign({ reason: 'SCHEDULING_CONFLICT' }, this.referral),
            onDecline: (referral: { reason: string }) => {
                modalRef._component.destroy();

                const variables: any = {
                    declineReferralInput: {
                        id: this.referral.id,
                        reason: referral.reason,
                    },
                };
                const moreParams = {
                    refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
                };
                this.plGraphQL.mutate(`mutation declineReferral($declineReferralInput: DeclineReferralInput!) {
                    declineReferral(input: $declineReferralInput) {
                        errors {
                            code
                            field
                            message
                        }
                        status
                        referral {
                            id
                            state
                            permissions {
                                matchProvider
                                declineReferral
                                deleteReferral
                                updateReferral
                                convertReferral
                            }
                        }
                    }
                }`, variables, {}, moreParams).subscribe(() => {
                    this.router.navigate(['/clients']);
                });
            },
            onCancel: () => {
                modalRef._component.destroy();
            },
        };
        this.plModal.create(PLClientReferralDeclineComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    showDeleteConfirm() {
        let modalRef: any;
        const params: any = {
            referral: Object.assign({ reason: 'DUPLICATE_REFERRAL' }, this.referral),
            onDelete: (referral: { reason: string }) => {
                modalRef._component.destroy();

                const variables: any = {
                    deleteReferralInput: {
                        id: this.referral.id,
                        reason: referral.reason,
                    },
                };
                const moreParams: any = {
                    updateQueries: {
                        ClientReferrals: (prev: any) => {
                            const newReferrals: any = prev.referrals;
                            const removeIndex = this.plLodash.findIndex(newReferrals.edges, 'node.id', this.referral.id);
                            if (removeIndex > -1) {
                                newReferrals.edges.splice(removeIndex);
                            }
                            return {
                                referrals: newReferrals,
                            };
                        },
                    },
                    refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
                };
                this.plGraphQL.mutate(`mutation deleteReferral($deleteReferralInput: DeleteReferralInput!) {
                    deleteReferral(input: $deleteReferralInput) {
                        errors {
                            code
                            field
                            message
                        }
                        status
                    }
                }`, variables, {}, moreParams).subscribe(() => {
                    this.router.navigate(['/clients']);
                });
            },
            onCancel: () => {
                modalRef._component.destroy();
            },
        };
        this.plModal.create(PLClientReferralDeleteComponent, params)
            .subscribe((ref: any) => {
                modalRef = ref;
            });
    }

    handleNoteCreated(event: any) {
        this.referral.hasNotes = true;
    }
}
