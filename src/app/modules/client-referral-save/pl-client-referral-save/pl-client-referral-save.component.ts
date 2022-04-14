import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
    PLLinkService,
    PLToastService,
    PLGraphQLService,
    PLLodashService,
    PLGQLClientsService,
    PLTransformGraphQLService,
    PLE2EOutputService,
    PLModalService,
} from '@root/index';

import { AppConfigService } from '@app/app-config.service';
import { PLClientReferralSaveModalComponent } from '../pl-client-referral-save-modal/pl-client-referral-save-modal.component';
import { PLNote } from '@root/src/app/common/components/pl-notes-list/pl-notes-list.component';
import { PLReferralNotesService } from '@root/src/app/common/services';

const referralQuery = require('./queries/referral.graphql');
const createOrUpdateReferralQuery = require('./queries/create-or-update-referral.graphql');


@Component({
    selector: 'pl-client-referral-save',
    templateUrl: './pl-client-referral-save.component.html',
    styleUrls: ['./pl-client-referral-save.component.less'],
})
export class PLClientReferralSaveComponent implements OnInit, OnChanges, OnDestroy {
    client: any = {};
    clientReferral: any = {};
    initing = true;
    isEdit = false;
    saving = false;

    private saveActual$: any;
    private plGQLClients$: any;
    private plGraphQLQuery$: any;
    private routeQueryParams$: any;
    private plGraphQLMutation$: any;
    private referralValuesForSaving: any; // Used for the warning modal when overriding/duplicating a referral.
    private ignoreDuplicateWarning = false;
    private savingMode = SavingMode.NotSaving;

    constructor(
        private router: Router,
        private plLink: PLLinkService,
        private plToast: PLToastService,
        private appConfig: AppConfigService,
        private plGraphQL: PLGraphQLService,
        private plLodash: PLLodashService,
        private route: ActivatedRoute,
        private plGQLClients: PLGQLClientsService,
        private plTransformGraphQL: PLTransformGraphQLService,
        private plE2EOutput: PLE2EOutputService,
        private plModalSvc: PLModalService,
        private clientReferralNotesService: PLReferralNotesService,
    ) {
        this.routeQueryParams$ = this.route.queryParams.subscribe(
            (routeParams: any) => {
                const loaded = {
                    client: false,
                    referral: false,
                };
                const checkAllLoadedLocal = () => {
                    if (this.plLodash.allTrue(loaded)) {
                        this.initing = false;
                    }
                };

                const clientId = routeParams['client'] || '';
                const referralId = routeParams['referral'] || '';

                if (clientId) {
                    this.plGQLClients$ = this.plGQLClients.getById(clientId).subscribe(
                        (resClient: any) => {
                            this.client = resClient.client;
                            loaded.client = true;
                            checkAllLoadedLocal();
                        },
                        () => {
                            this.plToast.show('error', 'There was an error getting the student id, please try again.');
                        },
                    );
                } else {
                    loaded.client = true;
                }

                if (referralId) {
                    const variables: any = {
                        id: referralId,
                    };
                    this.plGraphQLQuery$ = this.plGraphQL.query(referralQuery, variables, {}).subscribe(
                        (res: any) => {
                            this.clientReferral = res.referral;
                            this.isEdit = true;
                            loaded.referral = true;
                            checkAllLoadedLocal();
                        },
                        () => {
                            this.plToast.show('error', 'There was an error getting data for creating the referral, please try again.');
                        },
                    );
                } else {
                    loaded.referral = true;
                }

                checkAllLoadedLocal();
            },
            () => {
                this.plToast.show('error', 'There was an error in the routing of the page, please try again.');
            },
        );
    }

    ngOnInit() {
        this.init();
    }

    ngOnChanges() {
        this.init();
    }

    /**
     * Unsubscribe from all defined subscriptions of the class.
     */
    ngOnDestroy(): void {
        const subscribersArray = ['saveActual$', 'plGQLClients$', 'plGraphQLQuery$', 'routeQueryParams$', 'plGraphQLMutation$'];

        subscribersArray.forEach((subscriber) => {
            if (this[subscriber]) {
                this[subscriber].unsubscribe();
            }
        });
    }

    init() {
        setTimeout(() => {
            this.appConfig.showAppNav = false;
        });
    }

    selectClient(evt: { client: any }) {
        this.client = this.plTransformGraphQL.fromSnakeCase(evt.client);
    }

    removeClient() {
        this.client = {};
    }

    /**
     * Displays the navigation tab and navigates to a specific place once the Add of Single Referral is completed.
     *
     * @param navigateTo The path to navigate e.g. '/clients'. By default navigation goes back to previous page.
     * @param navigationExtras For using it in router.navigate, object with extra navigation details
     */
    onDestroy(navigateTo: string = '', navigationExtras: NavigationExtras = {}) {
        this.appConfig.showAppNav = true;
        this.setSavingMode(SavingMode.NotSaving);

        if (navigateTo) {
            this.router.navigate([navigateTo], navigationExtras);
        } else {
            this.plLink.goBack();
        }
    }

    onClose() {
        this.onDestroy();
    }

    save(vals: { client: any, referral: any, note: any }) {
        this.setSavingMode(SavingMode.NormalSaving);
        this.saveActual$ = this.saveActual(vals, this.ignoreDuplicateWarning)
            .pipe(switchMap((referralRes: any) => this.saveNewNote(referralRes.referral, vals.note)))
            .subscribe(
                () => this.onDestroy(),
                (err: any) => this.checkCreateOrUpdateGQLError(err),
            );
    }

    saveAndConvert(vals: { client: any, referral: any, note: any }) {
        this.setSavingMode(SavingMode.SaveAndConvert);
        this.saveActual$ = this.saveActual(vals, this.ignoreDuplicateWarning)
            .pipe(switchMap((referralRes: any) => this.saveNewNote(referralRes.referral, vals.note)))
            .subscribe(
                (res: any) => {
                    // In case of client create, need to get the id.
                    // Do NOT want to come back to save referral after save service, so set backDefault.
                    const navigationExtras = {
                        queryParams: {
                            client: (vals.client.id || res.referral.client.id),
                            referral: res.referral.id,
                            backDefault: 1,
                        },
                    };
                    this.onDestroy('/service-save', navigationExtras);
                },
                (err: any) => this.checkCreateOrUpdateGQLError(err),
            );
    }

    saveNewNote(referral: any, note: PLNote) {
        if (!note || !note.text) {
            return of({ referral });
        }
        return this.clientReferralNotesService.createNewNote({
            referral: referral.id,
            text: note.text,
            user_mention: note.userMentions
        }).pipe(map((newNoteRes: any) => {
            return {
                referral,
                newNote: newNoteRes,
            };
        }));
    }

    /**
     * @param vals The values of the referral that we want to save.
     * @param ignoreDuplicate Relates with the boolean ignoreDuplicateWarning when overriding/duplicating a referral.
     * @returns An observable.
     */
    saveActual(vals: { client: any, referral: any, note: any }, ignoreDuplicate: boolean = false) {
        this.referralValuesForSaving = vals;

        return new Observable((observer: any) => {
            let client: any;
            let variables: any;
            let parameters: any;

            this.isReferralSaving(true);

            client = this.plLodash.pick(vals.client, [
                'id', 'birthday', 'externalId', 'firstName', 'lastName',
                'englishLanguageLearnerStatus',
            ]);
            client = this.setLanguagesOnReferralSaving(vals, client);

            variables = {
                client,
                referral: {
                    productTypeCode: vals.referral.productType.code,
                    providerTypeCode: vals.referral.providerType.code,
                    schoolYearCode: vals.referral.schoolYear.code,
                    notes: vals.referral.notes,
                    grouping: vals.referral.grouping,
                    esy: (vals.referral.esy) ? true : false,
                    // BE fails to parse empty string; omit the field if empty. We do not support unsetting.
                    ...(vals.referral.duration ? { duration: vals.referral.duration } : {}),
                    // BE fails to parse empty string; omit the field if empty. We do not support unsetting.
                    frequency: vals.referral.frequency ? vals.referral.frequency : null,
                    grade: vals.referral.grade,
                    interval: vals.referral.interval,
                    // BE fails to parse empty string; omit the field if empty. We do not support unsetting.
                    dueDate: vals.referral.dueDate ? vals.referral.dueDate : null,
                    ignoreDuplicateWarning: ignoreDuplicate,
                    isShortTerm: (vals.referral.isShortTerm) ? true : false,
                    languageId: vals.referral.language.code,
                    assessmentPlanSignedOn: vals.referral.assessmentPlanSignedOn ?
                        vals.referral.assessmentPlanSignedOn : null,
                    meetingDate: vals.referral.meetingDate ? vals.referral.meetingDate : null,
                },
            };
            variables = this.setExtraPropertiesOnReferralSaving(vals, variables);

            parameters = {
                updateQueries: {
                    ClientReferrals: (prev: any, obj: { mutationResult: any }) => {
                        const newReferral = obj.mutationResult.data.createOrUpdateReferral.referral;
                        const newReferrals: any = prev.referrals;
                        const existsIndex = this.plLodash.findIndex(newReferrals.edges, 'id', newReferral.id);
                        if (existsIndex < 0) {
                            newReferrals.edges.push(newReferral);
                        }
                        return {
                            referrals: newReferrals,
                        };
                    },
                },
            };

            this.plGraphQLMutation$ = this.plGraphQL
                .mutate(createOrUpdateReferralQuery, variables, {}, parameters, true)
                .subscribe(
                    (res: any) => {
                        let text = '';
                        const toastSucessMessage = `Referral Saved for ${vals.client.firstName} ${vals.client.lastName}`;

                        this.isReferralSaving(false);
                        this.plToast.show('success', toastSucessMessage, -1, true);

                        if (!vals.referral.id) {
                            text = `clientReferralSave create referral id: ${res.createOrUpdateReferral.referral.id} | `;
                        }
                        if (!vals.client.id) {
                            // This is e2e testing only so can always use `client` instead of using client-student service.
                            text += `clientReferralSave create referral client id: ${res.createOrUpdateReferral.referral.client.id} | `;
                        }
                        if (text) this.plE2EOutput.setOutput(text);

                        observer.next({ referral: res.createOrUpdateReferral.referral });
                    },
                    (err: any) => observer.error(err),
                );
        });
    }

    cancel() {
        this.onDestroy();
    }

    //#region Privates

    /**
     * Displays/hides the dot loader for when a referral is being saved.
     */
    private isReferralSaving(isSaving: boolean) {
        this.saving = isSaving;
    }

    private isDuplicateWarning(duplicateWarning: boolean) {
        this.ignoreDuplicateWarning = duplicateWarning;
    }

    private checkCreateOrUpdateGQLError(error: any) {
        if (error && error.data && error.data.createOrUpdateReferral) {
            const referralError = error.data.createOrUpdateReferral.errors[0];
            if (referralError.code === 'duplicate_referral_warning') {
                this.displayWarningModal(referralError.message);
            } else {
                this.isReferralSaving(false);
                this.isDuplicateWarning(false);
                this.setSavingMode(SavingMode.NotSaving);
                this.plToast.show('error', referralError.message);
            }
        }
    }

    private displayWarningModal(warningMessage: string) {
        const parameters: any = {
            headerText: 'Potential Duplicate Detected',
            modalMessage: warningMessage,
            cancel: () => {
                this.isReferralSaving(false);
                this.isDuplicateWarning(false);
                this.setSavingMode(SavingMode.NotSaving);
            },
            continue: () => {
                this.saveActual$ = this.saveActual(this.referralValuesForSaving, true)
                    .pipe(switchMap((referralRes: any) => {
                        return this.saveNewNote(referralRes.referral, this.referralValuesForSaving.note);
                    }))
                    .subscribe(
                        (res: any) => {
                            if (this.savingMode === SavingMode.NormalSaving) {
                                this.onDestroy();
                            } else if (this.savingMode === SavingMode.SaveAndConvert) {
                                // In case of client create, need to get the id.
                                // Do NOT want to come back to save referral after save service, so set backDefault.
                                const navigationExtras = {
                                    queryParams: {
                                        client: (this.referralValuesForSaving.client.id || res.referral.client.id),
                                        referral: res.referral.id,
                                        backDefault: 1,
                                    },
                                };
                                this.onDestroy('/service-save', navigationExtras);
                            }
                        },
                        (err: any) => this.checkCreateOrUpdateGQLError(err),
                    );
            },
            reviewExistingReferrals: () => {
                this.isReferralSaving(false);
                this.isDuplicateWarning(false);
                this.setSavingMode(SavingMode.NotSaving);
                window.open(`/c/client/${this.client.id}/services`);
            },
        };

        this.plModalSvc.create(PLClientReferralSaveModalComponent, parameters);
    }

    /**
     * Helps the warning modal when referral is duplicate for redirecting to different page locations
     * @param mode Of enum type SavingMode
     */
    private setSavingMode(mode: SavingMode) {
        this.savingMode = mode;
    }

    /**
     * Backend accepts `null` only to unset. So there are 3 cases:
     *   1. set to a value (e.g. `en` for English).
     *   2. if it is an empty string, we want to un-set it (set to `null`)
     *   3. otherwise (if undefined), do not change it at all.
     */
    private setLanguagesOnReferralSaving(vals: { client: any, referral: any }, client: any): any {
        if (vals.client.primaryLanguage && vals.client.primaryLanguage.code) {
            client.primaryLanguageCode = vals.client.primaryLanguage.code;
        } else if (vals.client.primaryLanguage && vals.client.primaryLanguage.code !== undefined) {
            client.primaryLanguageCode = null;
        }
        if (vals.client.secondaryLanguage && vals.client.secondaryLanguage.code) {
            client.secondaryLanguageCode = vals.client.secondaryLanguage.code;
        } else if (vals.client.secondaryLanguage && vals.client.secondaryLanguage.code !== undefined) {
            client.secondaryLanguageCode = null;
        }

        return client;
    }

    private setExtraPropertiesOnReferralSaving(vals: { client: any, referral: any }, clientReferral: any) {
        if (vals.referral.id) {
            clientReferral.referral.id = vals.referral.id;
        }
        const locationIds = vals.client.locations.map((location: any) => {
            return location.id;
        });
        clientReferral.client.locationIds = locationIds;
        if (vals.client.id) {
            clientReferral.referral.clientId = vals.client.id;
        }
        // Matching only allowed on create, not on edit.
        if (!vals.referral.id) {
            clientReferral.autoMatch = (vals.referral.matching === 'matchPrevious') ? true : false;
            if (vals.referral.matching === 'selfAssign') {
                clientReferral.referral.providerId = vals.referral.provider;
            }
        }

        return clientReferral;
    }

    //#endregion Privates

}

enum SavingMode {
    NotSaving = '',
    NormalSaving = 'save',
    SaveAndConvert = 'saveAndConvert',
}
