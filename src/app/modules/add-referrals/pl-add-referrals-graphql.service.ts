import { Injectable } from '@angular/core';

import { PLGraphQLService } from '@root/index';

import { PLAddReferralsDataTableService } from './pl-add-referrals-table-data.service';
import { PLAddReferralsLocationYearService } from './pl-add-referrals-location-year.service';

import { Referral, Client, ClientReferral } from './pl-client-referral-data-model.service';

import { referralGroupingSpreadsheetLabelToValue } from '@common/services/pl-client-referral';

@Injectable()
export class PLAddReferralsGraphQLService {
    constructor(
        private tableDataService: PLAddReferralsDataTableService,
        private locationService: PLAddReferralsLocationYearService,
        private pLGraphQL: PLGraphQLService,
    ) {}

    convertImportedRowsToClientReferrals() {
        const data = this.tableDataService.finalImportedData;
        const clientReferrals: ClientReferral[] = [];

        for (const row of data) {
            const isEvaluationType = row.productTypeCode === this.tableDataService.CLINICAL_PRODUCT.CODE.EVAL;
            const client: Client = {
                firstName: row.firstName,
                lastName: row.lastName,
                birthday: row.birthday,
                locationIds: [this.locationService.selectedLocationID],
                externalId: row.externalId,
                englishLanguageLearnerStatus: row.englishLanguageLearnerStatus,
                primaryLanguageCode: row.primaryLanguageCode,
                secondaryLanguageCode: row.secondaryLanguageCode,
            };
            for (const field in client) {
                if (client[field] === '') {
                    client[field] = null;
                }
            }

            if (row.clientId) {
                client.id = row.clientId;
            }

            const yesNoNullToBoolean = (value: string): boolean => {
                if (value) {
                    switch (value.toLowerCase()) {
                            case 'yes':
                                return true;
                            case 'no':
                                return false;
                    }
                }

                return null;
            };

            const referral: Referral = {
                notes: row.notes,
                providerTypeCode: row.providerTypeCode,
                productTypeCode: row.productTypeCode,
                schoolYearCode: this.locationService.selectedSchoolYearCode,
                esy: !isEvaluationType && yesNoNullToBoolean(row.esy) ? true : false,
                grade: !isEvaluationType ? row.grade : null,
                frequency: !isEvaluationType ? row.frequency : null,
                interval: !isEvaluationType ? row.interval && row.interval.toLowerCase() : null,
                duration: !isEvaluationType ? row.duration : null,
                grouping: !isEvaluationType ? row.grouping &&
                  referralGroupingSpreadsheetLabelToValue(row.grouping) : null,
                ignoreDuplicateWarning: !!row.ignoreDuplicateWarning,
                isShortTerm: yesNoNullToBoolean(row.shortTermLeave) ? true : false,
                languageId: row.primaryLanguageCode || 'en',
                assessmentPlanSignedOn: row.assessmentPlanSignature,
                dueDate: row.assessmentDueDate,
                meetingDate: row.meetingDate,
            };

            for (const field in referral) {
                if (referral[field] === '') {
                    referral[field] = null;
                }
            }

            clientReferrals.push({ client, referral });
        }

        return clientReferrals;
    }

    uploadData(clientReferrals: any[], dryRun: boolean, maxReferrals: number) {
        const createQuery = `mutation bulkCreateReferrals($clientReferrals: [BulkClientReferalInput],
                                                          $autoMatch: Boolean, $dryRun: Boolean, $maxReferrals: Int) {
            createReferrals(input: {clientReferrals: $clientReferrals, autoMatch: $autoMatch, dryRun: $dryRun, maxReferrals: $maxReferrals}) {
                errors {
                  code
                  field
                  message
                }
                results {
                  status
                  priorClient {
                    firstName
                    lastName
                  }
                  referral {
                    client {
                      firstName
                      lastName
                    }
                  }
                  referralCreated
                  error {
                    code
                    field
                    message
                    clients {
                      edges {
                        node {
                          id
                          externalId
                          firstName
                          lastName
                          locations {
                            edges {
                              node {
                                id
                                name
                              }
                            }
                          }
                          birthday
                        }
                      }
                    }
                  }
                  referral {
                    id
                  }
                }
              }
        }`;

        const variables = {
            clientReferrals,
            dryRun,
            maxReferrals,
            autoMatch: this.tableDataService.providerMatching.selection === 'use_previous',
        };

        return this.pLGraphQL.mutate(createQuery, variables, { debug: false, suppressError: true }).toPromise()
          .catch((err: any) => {
              console.error('mutate err: ', err);
              const referrals = clientReferrals.map((ref) => {
                  return { ...ref.client, ...ref.referral };
              });
              throw { errorMessage: err, data: referrals };
          });
    }
}
