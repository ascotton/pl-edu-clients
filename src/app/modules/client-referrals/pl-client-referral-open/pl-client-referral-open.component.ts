import * as moment from 'moment';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PLClientReferralsService } from '../pl-client-referrals.service';
import { PLGetProviderService } from '@common/services/pl-get-provider.service';
import { PLGraphQLService, PLLodashService, PLToastService, PLGQLQueriesService } from '@root/index';

@Component({
    selector: 'pl-client-referral-open',
    templateUrl: './pl-client-referral-open.component.html',
    styleUrls: ['./pl-client-referral-open.component.less'],
})
export class PLClientReferralOpenComponent {

    allChecked = false;
    currentPage: number;
    filterSelectOpts: any[] = [
        { value: 'clientFirstName_Icontains', label: 'First Name', defaultVisible: true },
        { value: 'clientLastName_Icontains', label: 'Last Name', defaultVisible: true },
        {
            value: 'productTypeCode_In', label: 'Referral', defaultVisible: true,
            selectOptsMulti: [
                { value: 'evaluation_with_assessments', label: 'Evaluation' },
                { value: 'direct_service', label: 'Therapy' },
            ],
        },
    ];
    loading = true;
    noneSelectedError = false;
    pageSize: number;
    referrals: any[] = [];
    referralsSelectedCount = 0;
    total: number;

    private currentQueryId = '';
    private tableQueryCache: any = null;
    private selectedReferrals: string[] = [];
    private referralStateMap: any = {
        UNMATCHED_PL_REVIEW: 'Unmatched',
        UNMATCHED_OPEN_TO_PROVIDERS: 'Open',
        MATCHED: 'Matched',
    };
    private referralTypeMap: any = {
        direct_service: 'Therapy',
        evaluation_with_assessments: 'Evaluation',
    };
    private ELLMap: any = {
        NEVER_IDENTIFIED: 'Never',
        CURRENTLY_IDENTIFIED: 'Currently',
        PREVIOUSLY_IDENTIFIED: 'Previously',
    };
    private userProviderId = '';
    private providerTypeCodes: string[] = [];

    constructor(
        private plToast: PLToastService,
        private plLodash: PLLodashService,
        private plGraphQL: PLGraphQLService,
        private plGQLQueries: PLGQLQueriesService,
        private plGetProvider: PLGetProviderService,
        private changeDetectorRef: ChangeDetectorRef,
        private plClientReferrals: PLClientReferralsService,
    ) { }

    ngOnInit() {
        this.plClientReferrals.getTabs();
        this.plGetProvider.get()
            .subscribe((res: any) => {
                this.userProviderId = res.providerUserId;
                this.providerTypeCodes = res.provider.providerTypes.map((providerType: any) => {
                    return providerType.code;
                });
                // Can not re-query without table query values that are loaded the first time.
                // So the table will load ONCE to start, either here if it was already attempted once
                // OR by the default initial call if the provider user id is loaded before that.
                if (this.tableQueryCache) {
                    this.reQuery();
                }
            });
    }

    reQuery() {
        const query = this.tableQueryCache;
        this.onQuery({ query });
    }

    onQuery(info: { query: any }) {
        const currentQueryId: string = this.plLodash.randomString();
        this.currentQueryId = currentQueryId;
        const query = info.query;
        // Save for next time for filter changes.
        this.tableQueryCache = query;
        // Need provider types, but must FIRST save the query cache for next time.
        if (!this.userProviderId) {
            return;
        }
        query.state_In = 'UNMATCHED_OPEN_TO_PROVIDERS';
        // const variables = this.plLodash.omit(query, ['orderBy', 'page']);
        const variables = Object.assign({}, query, {
            providerTypeCode_In: this.providerTypeCodes.join(','),
        });
        this.plGraphQL.query(`query ${this.plGQLQueries.queries.referralsOpenReferrals.cacheName}($first: Int!,
         $offset: Int, $orderBy: String, $clientFirstName_Icontains: String,
         $clientLastName_Icontains: String, $productTypeCode_In: String,
         $state_In: String, $providerTypeCode_In: String) {
            ${this.plGQLQueries.queries.referralsOpenReferrals.apiName}(first: $first, offset: $offset, orderBy: $orderBy,
            clientFirstName_Icontains: $clientFirstName_Icontains,
            clientLastName_Icontains: $clientLastName_Icontains,
            productTypeCode_In: $productTypeCode_In,
            state_In: $state_In,
            providerTypeCode_In: $providerTypeCode_In
            ) {
                totalCount
                edges {
                    node {
                        id
                        created
                        createdBy {
                            id
                        }
                        client {
                            id
                            firstName
                            lastName
                            primaryLanguage {
                                id
                                name
                            }
                            englishLanguageLearnerStatus
                            locations {
                                edges {
                                    node {
                                        id
                                        name
                                        parent {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                        providerType {
                            id
                            longName
                            code
                        }
                        productType {
                            id
                            code
                        }
                        provider {
                            id
                            firstName
                            lastName
                        }
                        state
                        bilingual
                        clientService {
                            id
                        }
                        notes
                        reason
                        permissions {
                            matchProvider
                            declineReferral
                            deleteReferral
                            unmatchReferral
                            updateReferral
                        }
                    }
                }
            }
         }`, variables, {}).subscribe((res: any) => {
             if (this.currentQueryId === currentQueryId) {
                 const referrals = res.referrals ? res.referrals : [];
                 this.referrals = this.formatReferrals(referrals);
                 this.total = res.referrals_totalCount;
                 this.loading = false;
                 this.changeDetectorRef.markForCheck();  // Parent component has OnPush change detection strategy.
             }
         });
    }

    formatReferrals(referrals: any[]) {
        return referrals.map((referral: any) => {
            const location = (referral.client.locations && referral.client.locations[0])
                ? referral.client.locations[0] : {};
            const organization = (location && location.parent) ? location.parent : {};
            referral.xDiscipline = referral.providerType.code.toUpperCase();
            referral.xType = this.referralTypeMap[referral.productType.code];
            referral.xStatus = this.referralStateMap[referral.state];
            referral.xCreated = moment(referral.created, 'YYYY-MM-DD').fromNow();
            referral.xLocation = location.name ? location.name : '';
            referral.xOrganization = organization.name ? organization.name : '';
            referral.xELLStatus = this.ELLMap[referral.client.englishLanguageLearnerStatus];
            referral._checked = false;
            this.setReferralCheckedFromSelectedList(referral);
            return referral;
        });
    }

    setReferralCheckedFromSelectedList(referral: any) {
        const index = this.selectedReferrals.indexOf(referral.id);
        if (index > -1) {
            referral._checked = true;
        }
    }

    changeSelectRow(referral: any) {
        if (referral._checked) {
            this.selectedReferrals.push(referral.id);
        } else {
            const index = this.selectedReferrals.indexOf(referral.id);
            this.selectedReferrals.splice(index, 1);
            // Uncheck select all checkbox if it was selected.
            if (!this.selectedReferrals.length && this.allChecked) {
                this.allChecked = false;
            }
        }
        this.countRowsSelected();
    }

    countRowsSelected() {
        this.referralsSelectedCount = this.selectedReferrals.length;
    }

    changeSelectAllPage(evt: any) {
        if (this.allChecked) {
            this.selectAllPage();
        } else {
            this.unselectAllPage();
        }
    }

    selectAllPage() {
        this.referrals.forEach((referral: any) => {
            if (this.selectedReferrals.indexOf(referral.id) < 0) {
                this.selectedReferrals.push(referral.id);
                referral._checked = true;
            }
        });
        this.countRowsSelected();
    }

    unselectAllPage() {
        this.referrals.forEach((referral: any) => {
            const index = this.selectedReferrals.indexOf(referral.id);
            if (index > -1) {
                this.selectedReferrals.splice(index, 1);
                referral._checked = false;
            }
        });
        this.countRowsSelected();
    }

    unselectAllEverywhere() {
        this.selectedReferrals = [];
        this.referrals.forEach((referral: any) => {
            if (referral._checked) {
                referral._checked = false;
            }
        });
        this.countRowsSelected();
    }

    addSelectedReferralsToCaseload() {
        if (!this.selectedReferrals.length) {
            this.noneSelectedError = true;
            return;
        }
        this.noneSelectedError = false;
        const variables: any = {
            referralIds: this.selectedReferrals,
            providerId: this.userProviderId,
        };
        this.plGraphQL.mutate(`mutation ${this.plGQLQueries.mutations.referralsOpenMatch.cacheName}($referralIds: [ID]!, $providerId: String!) {
            ${this.plGQLQueries.mutations.referralsOpenMatch.apiName}(input: {ids: $referralIds, providerId: $providerId}) {
                results {
                    error {
                        code
                        field
                        message
                    }
                    status
                    referral {
                        id
                        state
                    }
                }
                errors {
                    code
                    field
                    message
                }
                status
            }
         }`, variables, {}, {
             refetchQueries: this.plGQLQueries.queryGroups.referralsAndServices,
         }).subscribe((res: any) => {
             this.selectedReferrals = [];
             this.unselectAllEverywhere();
             const data: any = res.matchReferrals;

            // handle top level errors
             if (data.errors && data.errors.length) {
                 console.log('GQL: move to open referrals', data.errors);
                // For now just show the first error.
                 this.plToast.show('error', data.errors[0].message);
             } else {
                 this.handleAddToCaseloadApiResponse(data);
             }
         });
    }

    handleAddToCaseloadApiResponse(data: any) {
        const results: any = data.results.reduce((output: any, item: any) => {
            if (item.status === 'ok') {
                output.ok.push(item);
            } else if (item.status === 'error') {
                output.error.push(item);
            }
            return output;
        }, { ok: [], error: [] });
        if (results.error.length === 0) {
            // ALL successful
            this.plToast.show('success', `You have successfully added ${results.ok.length} ` +
                `referrals to your caseload. Thank you for making a difference.`, 2000, true);
        } else if (results.ok.length) {
            // SOME successful
            this.plToast.show('info', `(${results.ok.length}) referrals added to caseload and (${results.error.length}) were ineligible to be added.`);
        } else {
            // NONE successful
            this.plToast.show('warning', `All (${results.error.length}) referrals were ineligible to be added.`);
        }
    }
}
