import { Component, OnDestroy, OnInit } from '@angular/core';

import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PLAddReferralsNavigationService } from '../pl-add-referrals-navigation.service';
import { PLAddReferralsLocationYearService } from '../pl-add-referrals-location-year.service';
import { PLAddReferralsDataTableService } from '../pl-add-referrals-table-data.service';
import { PLAddReferralsGraphQLService } from '../pl-add-referrals-graphql.service';
import { PLConfirmDialogService, PLClientStudentDisplayService } from '@root/index';

import { PLSpreadsheetService } from '@common/services/pl-spreadsheet.service';

import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLStylesService } from '@root/src/lib-components';

interface NameChange {
    oldFirst: string;
    oldLast: string;
    newFirst: string;
    newLast: string;
}

@Component({
    selector: 'pl-referrals-confirmation',
    templateUrl: './pl-referrals-confirmation.component.html',
    styleUrls: ['./pl-referrals-confirmation.component.less', '../pl-add-referrals.component.less'],
    providers: [PLSpreadsheetService],
})
export class PLReferralsConfirmationComponent implements OnInit, OnDestroy {
    currentUser: User;

    locationName: string = '';
    organizationName: string = '';
    errorRows: any[] = [];
    warningRows: any[] = [];
    successRows: any[] = [];
    templateErrors: any[] = [];
    loading = true;

    successCount = 0;
    clientReferralsInput: any[] = [];
    duplicatesToResolve: any[] = [];
    dupeCount: number | any = 0;
    dupeIndex = 0;

    nameChanges: NameChange[] = [];
    displayNameChanges = false;

    tableDataSubject: Subject<any> = new Subject();

    serverErrorMessages = {};
    isResendEnabled = false;

    destroyed$ = new Subject<boolean>();

    meterBackgroundColor: string;
    uploadMeterColor: string;
    checkUploadMeterColor: string;
    uploadPercent = 0;
    uploadText = '';
    checkUploadPercent = 0;
    checkUploadText = '';
    isUploading = false;
    isUploadDone = false;
    isCheckingUpload = false;
    isCheckingUploadDone = false;
    loadingResend = false;

    readonly MAX_BATCH_SIZE = 5;

    private warningErrors: any = ['duplicate_referral'];

    get clientStudentTexts(): any {
        const clientStudentText = PLClientStudentDisplayService.get(this.currentUser);
        const clientStudentCapital = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        return {
            lower: clientStudentText,
            capital: clientStudentCapital,
        };
    }

    constructor(
        private pLAddReferralsNavigationService: PLAddReferralsNavigationService,
        private plSpreadsheet: PLSpreadsheetService,
        private locationService: PLAddReferralsLocationYearService,
        private tableDataService: PLAddReferralsDataTableService,
        private graphQLService: PLAddReferralsGraphQLService,
        private plConfirm: PLConfirmDialogService,
        private store: Store<AppStore>,
        private plStyles: PLStylesService,
    ) {
        this.locationName = locationService.getSelectedLocationName();
        this.organizationName = locationService.getSelectedOrganizationName();
        store.select('currentUser').pipe(takeUntil(this.destroyed$))
            .subscribe((user: any) => {
                this.currentUser = user;
                this.formServeErrorMessages();
            });
    }

    updateChildTables() {
        this.tableDataSubject.next('');
    }

    buildLocalConfirmationRows() {
        this.errorRows = [];
        this.warningRows = [];
        this.successRows = [];
        this.templateErrors = [];
        this.templateErrors = this.templateErrors.concat(this.tableDataService.templateErrorRows);
    }

    ngOnInit() {
        this.resetMeters();
        this.initTables();
        setTimeout(() => (this.pLAddReferralsNavigationService.showNavigation = false), 0);
    }

    initTables() {
        this.buildLocalConfirmationRows();
        this.updateChildTables();
        this.checkUploadData();
    }

    ngOnDestroy() {
        this.tableDataService.reset();
        this.locationService.reset();
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    toggleDisplayNameChanges() {
        this.displayNameChanges = !this.displayNameChanges;
    }

    resolveProblemClient(id: string, message: string) {
        const link = `/c/client/${id}/details`;
        this.plConfirm.show({
            header: `Review ${this.clientStudentTexts.capital}`,
            content: `<div style="padding-right:25px;">${message}</div>`,
            primaryLabel: `View ${this.clientStudentTexts.lower} profile`, secondaryLabel: 'Cancel',
            primaryCallback: () => {
                window.open(link);
            },
            secondaryCallback: () => {
                // console.log('Canceled');
            },
        });

    }

    resolveTransferClient(event: any) {
        const client = event.client;
        const message = `${this.clientStudentTexts.capital} found at ${client.locations[0].name}. View the ${this.clientStudentTexts.lower}'s ` +
            `profile to review ${this.clientStudentTexts.lower} details including ${this.clientStudentTexts.capital} ID and correct if needed. ` +
            `Please contact Support if the ${this.clientStudentTexts.lower} requires a transfer to another location.`;
        this.resolveProblemClient(client.id, message);
    }

    resolveDupeClient(event: any) {
        const client = event.client;
        const message = `Possible duplicate ${this.clientStudentTexts.lower} identified:
                <div style="padding-top:5px; padding-bottom:5px;">
                    <span style="font-weight:bold;">Name: </span><span>${client.firstName} ${client.lastName}</span><br/>
                    <span style="font-weight:bold;">ID: </span>${client.externalId}</span><br/>
                    <span style="font-weight:bold;">Birthday: </span><span>${client.birthday}</span><br/>
                    <span style="font-weight:bold;">Location: </span><span>${client.locations[0].name}</span>
                </div>
            Review the ${this.clientStudentTexts.lower} profile for these fields and correct if needed. ` +
            `Contact Support if the ${this.clientStudentTexts.lower} requires a transfer to another location. Retry when done.`;
        this.resolveProblemClient(client.id, message);
    }

    formServeErrorMessages() {
        this.serverErrorMessages = {
            not_found: 'Invalid data',
            duplicate_client: `Duplicate ${this.clientStudentTexts.lower} id detected at this location or district.`,
            invalid_state: 'Server Error (Inconsistent State). Please contact technical support to resolve this issue.',
            possible_duplicate_client: `Possible duplicate ${this.clientStudentTexts.lower} found.`,
            client_requires_transfer: `${this.clientStudentTexts.capital} found at another location (transfer may be needed).`,
        };
    }

    parseUploadResults(results: any) {
        this.successCount = 0;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];

            if (result.status === 'ok') {
                this.successCount++;
                const successRow = this.tableDataService.finalImportedData[i];
                if (result.priorClient && !result.referralCreated) {
                    const nameChange = {
                        oldFirst: result.priorClient.firstName,
                        oldLast: result.priorClient.lastName,
                        newFirst: result.referral.client.firstName,
                        newLast: result.referral.client.lastName,
                    };

                    this.nameChanges.push(nameChange);
                }
                this.successRows.push(successRow);
            } else if (result.status === 'error') {
                const errorRow = this.tableDataService.finalImportedData[i];
                const originalClient = this.clientReferralsInput[i].client;
                const error = result.error;
                if (error) {
                    if (error.code === 'not_found' && error.field && error.field.length) {
                        // TODO - replace this with the label instead of field name
                        // unfortunately, server changes the key values, so we'll need
                        // a lookup table to go from server keys to our keys
                        errorRow.errorReason = 'Invalid value in field: ' + error.field;
                    } else {
                        if (error.code === 'possible_duplicate_client') {
                            errorRow.dupeClient = error.clients[0];
                        } else if (error.code === 'client_requires_transfer') {
                            errorRow.transferClient = error.clients[0];
                        } else if (error.code === 'duplicate_referral_warning') {
                            if (originalClient.id) {
                                errorRow.clientId = originalClient.id;
                            }
                            errorRow.canResend = true;
                        }

                        if (this.serverErrorMessages[error.code]) {
                            errorRow.errorReason = this.serverErrorMessages[error.code];
                        } else if (error.message) {
                            errorRow.errorReason = error.message;
                        } else {
                            errorRow.errorReason = 'Server error';
                        }
                    }
                } else {
                    errorRow.errorReason = 'Server error';
                }

                if (this.warningErrors.includes(error.code)) {
                    this.warningRows.push(errorRow);
                } else {
                    if (errorRow.errorReason === 'Server error' ||
                        errorRow.errorReason === this.serverErrorMessages[error.code]) {
                        this.templateErrors.push(errorRow);
                    } else {
                        this.errorRows.push(errorRow);
                    }
                }
            } else {
                console.log('not ok or error result ', i);
            }
        }
    }

    parseDuplicateResults(results: any) {
        const duplicates: any[] = [];
        // We want to match the original uploaded data to the possible duplicates.
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'error' && result.error &&
                result.error.code === 'possible_duplicate_client' && result.error.clients
                && result.error.clients.length) {
                // The backend should return the results in the same order as were submitted,
                // so we just pull the index of the original data to match them up.
                // TODO - have the backend return the original data for each result.
                const originalClient = this.clientReferralsInput[i].client;
                const originalReferral = this.clientReferralsInput[i].referral;
                const dupeClient = result.error.clients.find((client: any) => {
                    return originalClient.firstName === client.firstName &&
                        originalClient.lastName === client.lastName &&
                        originalClient.externalId === client.externalId &&
                        originalClient.birthday === client.birthday;
                });
                originalClient.location = this.locationName;
                if (dupeClient) {
                    this.clientReferralsInput[i].client.id = dupeClient.id;
                } else {
                    duplicates.push({
                        originalClient,
                        originalReferral,
                        originalIndex: i,
                        originalLocation: this.locationName,
                        potentialDuplicateClients: result.error.clients,
                    });
                }
            }
        }
        return duplicates;
    }

    // Before we actually upload we do a dry run to find duplicates.
    async checkUploadData() {
        this.loading = true;
        this.pLAddReferralsNavigationService.uploadComplete = false;
        this.clientReferralsInput = this.graphQLService.convertImportedRowsToClientReferrals();
        const referralsBatches =
            this.createReferralsBatches(this.clientReferralsInput, this.MAX_BATCH_SIZE);
        const originalRowsBatches =
            this.createReferralsBatches(this.tableDataService.finalImportedData, this.MAX_BATCH_SIZE);

        const allResults = [];
        const serverErrors = [];
        this.checkUploadPercent = 0;
        this.checkUploadText = '';
        this.isCheckingUpload = true;
        for (let i = 0; i < referralsBatches.length; i++) {
            try {
                const results = await this.graphQLService.uploadData(referralsBatches[i], true, this.MAX_BATCH_SIZE);
                this.checkUploadPercent = (i + 1) * 100 / referralsBatches.length;
                if (results.createReferrals && results.createReferrals.results) {
                    allResults.push(...results.createReferrals.results);
                }
                this.checkUploadText = `(${allResults.length}/${this.clientReferralsInput.length}) Checking referrals...`;
            } catch (error) {
                if (error.errorMessage && error.data) {
                    serverErrors.push(...originalRowsBatches[i]);
                }
            }
        }
        if (serverErrors.length) {
            this.onUploadError(serverErrors);
            this.pLAddReferralsNavigationService.showNavigation = true;
            this.loading = false;
        } else {
            this.duplicatesToResolve = this.parseDuplicateResults(allResults);
            this.dupeCount = this.duplicatesToResolve.length;
            this.dupeIndex = 0;
            if (this.dupeCount === 0) {
                this.checkUploadMeterColor = `#${this.plStyles.getColorForName('green')}`;
                this.checkUploadText = 'Dry run completed!';
                this.isCheckingUploadDone = true;
                this.uploadData();
            } else {
                this.pLAddReferralsNavigationService.showNavigation = false;
                this.loading = false;
            }
        }
    }

    nextDupe() {
        this.dupeIndex += 1;
        if (this.dupeIndex === this.dupeCount) {
            this.dupeIndex = 0;
            this.dupeCount = 0;
            this.pLAddReferralsNavigationService.showNavigation = true;
            this.uploadData();
        }
    }

    handleDupeWithExisting(existing: any, originalIndex: number) {
        this.clientReferralsInput[originalIndex].client = {
            ...this.clientReferralsInput[originalIndex].client,
            ...existing,
        };
        this.tableDataService.finalImportedData[originalIndex] = {
            ...this.tableDataService.finalImportedData[originalIndex],
            ...this.clientReferralsInput[originalIndex].client,
        };
        this.nextDupe();
    }

    handleDupeWithClientUpdate(updateClient: any, originalIndex: number) {
        this.clientReferralsInput[originalIndex].checkForPossibleDuplicates = false;
        this.clientReferralsInput[originalIndex].client = updateClient;
        this.tableDataService.finalImportedData[originalIndex].externalId = updateClient.externalId;
        this.nextDupe();
    }

    /**
     * Generate a spreadsheet containing rows that did not import, using the set of fields in summaryFields
     * Plus the error reason. grab all the fields from row.original, but errorReason is in row.
     */
    downloadSummary() {
        const errorRows = this.errorRows.concat(this.templateErrors);
        this.plSpreadsheet.generateErrorSummary(this.nameChanges, errorRows, this.warningRows, this.locationName);
    }

    async uploadData() {
        this.clientReferralsInput = this.cleanClientReferrals();
        this.loading = true;
        this.pLAddReferralsNavigationService.showNavigation = false;
        this.pLAddReferralsNavigationService.uploadComplete = false;
        const referralsBatches =
            this.createReferralsBatches(this.clientReferralsInput, this.MAX_BATCH_SIZE);
        const originalRowsBatches =
            this.createReferralsBatches(this.tableDataService.finalImportedData, this.MAX_BATCH_SIZE);

        const allResults = [];
        const serverErrors = [];
        this.uploadPercent = 0;
        this.uploadText = '';
        this.isUploading = true;
        for (let i = 0; i < referralsBatches.length; i++) {
            try {
                const results = await this.graphQLService.uploadData(referralsBatches[i], false, this.MAX_BATCH_SIZE);
                this.uploadPercent = (i + 1) * 100 / referralsBatches.length;
                if (results.createReferrals && results.createReferrals.results) {
                    allResults.push(...results.createReferrals.results);
                }
                this.uploadText = `(${allResults.length}/${this.clientReferralsInput.length}) Submitting referrals...`;
            } catch (error) {
                if (error.errorMessage && error.data) {
                    serverErrors.push(...originalRowsBatches[i]);
                }
            }
        }
        if (serverErrors.length) {
            this.onUploadError(serverErrors);
        } else {
            this.uploadMeterColor = `#${this.plStyles.getColorForName('green')}`;
            this.isUploadDone = true;
            this.parseUploadResults(allResults);
            this.updateChildTables();
            if (!this.errorRows.length) {
                this.pLAddReferralsNavigationService.uploadComplete = true;
            }
        }
        this.pLAddReferralsNavigationService.showNavigation = true;
        this.loading = false;
    }

    onUploadError(error: any[]) {
        for (const row of error) {
            row.errorReason = 'Server error';
            this.templateErrors.push(row);
        }
        this.updateChildTables();
        this.pLAddReferralsNavigationService.uploadComplete = true;
        this.tableDataService.reset();
        this.locationService.reset();
    }

    ignoreDuplicate(event: any[]) {
        const ignoreDuplicateRows = event.filter(row => row.ignoreDuplicateWarning);
        this.tableDataService.finalImportedData = ignoreDuplicateRows;
        this.isResendEnabled = !!this.tableDataService.finalImportedData.length;
    }

    async resendDuplicates() {
        this.loadingResend = true;
        this.pLAddReferralsNavigationService.showNavigation = false;
        this.pLAddReferralsNavigationService.uploadComplete = false;
        this.clientReferralsInput = this.graphQLService.convertImportedRowsToClientReferrals();
        this.clientReferralsInput = this.cleanClientReferrals();
        const referralsBatches =
            this.createReferralsBatches(this.clientReferralsInput, this.MAX_BATCH_SIZE);

        const allResults = [];
        const serverErrors = [];
        let resendMessage = '';

        for (let i = 0; i < referralsBatches.length; i++) {
            try {
                const results = await this.graphQLService.uploadData(referralsBatches[i], false, this.MAX_BATCH_SIZE);
                if (results.createReferrals && results.createReferrals.results) {
                    allResults.push(...results.createReferrals.results);
                }
            } catch (error) {
                if (error.errorMessage && error.data) {
                    serverErrors.push(...error.data);
                }
            }
        }
        if (serverErrors.length) {
            resendMessage = 'Server Error: Something went wrong. Please send the referrals again.';
        } else {
            resendMessage = `You have successfully added ${allResults.length} referrals that were originally identified as possible duplicates.`;
            this.arrangeTablesRows(allResults);
        }
        this.loadingResend = false;
        this.isResendEnabled = false;
        this.pLAddReferralsNavigationService.showNavigation = true;
        this.pLAddReferralsNavigationService.uploadComplete = true;
        this.showResendConfirmation(resendMessage);
    }

    arrangeTablesRows(results: any[]) {
        const successRowIndexes = this.tableDataService.finalImportedData.map(row => row.rowIndex);
        this.successRows = this.successRows.concat(this.tableDataService.finalImportedData.map((row, index) => {
            const result = results[index];
            return {
                ...row,
                firstName: result.priorClient && result.priorClient.firstName !== row.firstName ?
                    `${row.firstName} (former: ${result.priorClient.firstName})` : row.firstName,
                lastName: result.priorClient && result.priorClient.lastName !== row.lastName ?
                    `${row.lastName} (former: ${result.priorClient.lastName})` : row.lastName,
                errorReason: '',
            };
        }));
        this.errorRows = this.errorRows.filter(row => !successRowIndexes.includes(row.rowIndex));
    }

    showResendConfirmation(message: string) {
        this.plConfirm.show({
            header: `Add new referrals`,
            content: `<div style="padding-right:25px;">${message}</div>`,
            primaryLabel: `Close`,
            primaryCallback: () => {
                this.updateChildTables();
                this.pLAddReferralsNavigationService.uploadComplete = true;
            },
        });
    }

    cleanClientReferrals() {
        return this.clientReferralsInput.map(
            (ref) => {
                delete ref.client.locations;
                delete ref.client.location;
                return ref;
            },
        );
    }

    createReferralsBatches(clientReferrals: any[], size: number): any[][] {
        const chunks = [];
        for (let i = 0; i < clientReferrals.length; i += size) {
            const chunk = clientReferrals.slice(i, i + size);
            chunks.push(chunk);
        }
        return chunks;
    }

    getMeterInfo(meter: string) {
        return {
            value: meter === 'dryRun' ? this.checkUploadPercent : this.uploadPercent,
            text: meter === 'dryRun' ? this.checkUploadText || 'Loading...' : this.uploadText || 'Loading...',
            color: meter === 'dryRun' ? this.checkUploadMeterColor : this.uploadMeterColor,
            bgColor: this.meterBackgroundColor,
        };
    }

    resetMeters() {
        this.uploadMeterColor = `#${this.plStyles.getColorForName('blue-light')}`;
        this.checkUploadMeterColor = `#${this.plStyles.getColorForName('blue-light')}`;
        this.meterBackgroundColor = `#${this.plStyles.getColorForName('white')}`;

        this.uploadPercent = 0;
        this.uploadText = '';
        this.checkUploadPercent = 0;
        this.checkUploadText = '';
        this.isUploading = false;
        this.isUploadDone = false;
        this.isCheckingUpload = false;
        this.isCheckingUploadDone = false;
    }
}
