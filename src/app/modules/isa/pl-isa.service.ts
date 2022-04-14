import moment from 'moment';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { PLHttpService } from '@root/index';
import { AppStore } from '../../appstore.model';
import { ISAInfo, ISAFeatureStates, ISATableMode } from './index';
import { forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import { selectIsCustomerAdmin } from '../../common/store/user.selectors';
import { filter, first, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { selectCurrentUser, selectCurrentUserLoaded } from '../../common/store';

@Injectable()
export class PLISAService {

    schoolOrgIdUpdatedSubject = new Subject(); // Tells the buttons in the dashboard to check the ISAs again.
    isasSignedOrRemovedSubject = new Subject(); // Tells the tables at `pl-isa-table` to reload after signing/removing ISAs.

    private school: {currentYearCode: string, hasISAs: boolean, orgId: string, orgName: string} = {
        orgId: '',
        orgName: '',
        hasISAs: false, // Updated from within `getNumberOfSignedAndUnsignedISAs`.
        currentYearCode: '',
    }

    private isas = {
        featureState: ISAFeatureStates.notChecked,
        tableMode: ISATableMode.readOnlyISA,
    }

    private user: { fullName: string, title: string, isAssignedToOneSchool: boolean } = {
        fullName: '-',
        title: '-',
        isAssignedToOneSchool: true, // Meant for telling if the user is assigned to one school or more than one.
    }

    constructor(
        private store$: Store<AppStore>,
        private plHttpSvc: PLHttpService,
    ) { }

    //#region Getters and Setters

    get currentSchoolOrgName() {
        return this.school.orgName;
    }

    set currentSchoolOrgName(orgName: string) {
        this.school.orgName = orgName;
    }

    get currentSchoolYearCode() {
        return this.school.currentYearCode;
    }

    set currentSchoolYearCode(currentYear: string) {
        this.school.currentYearCode = currentYear;
    }

    get isasFeatureState() {
        return this.isas.featureState;
    }

    set isasFeatureState(state: ISAFeatureStates) {
        this.isas.featureState = state;
    }

    get isasModeSelectedFromDashboard() {
        return this.isas.tableMode;
    }

    set isasModeSelectedFromDashboard(viewMode: ISATableMode) {
        this.isas.tableMode = viewMode;
    }

    get isUserAssignedToOneSchoolOnly () {
        return this.user.isAssignedToOneSchool;
    }

    /**
     * On notification a new ISA retrieve will be made from the subscriber using the new ID.
     */
     set schoolOrgId(orgId: string) {
        this.school.orgId = orgId;
        this.schoolOrgIdUpdatedSubject.next('org/loc ID updated');
    }

    get userFullName() {
        return this.user.fullName;
    }

    get userTitle() {
        return this.user.title;
    }

    set userTitle(title: string) {
        this.user.title = title;
    }

    //#endregion

    /**
     * Used for knowing the number of signed and unsigned ISAs.
     * If there are any of both; the user asigned to the school can access to ISAs.
     * 
     * @param useCurrentSchoolYear - Boolean telling if the signed ISAs of the current year are the ones required.
     * @returns - The number of signed and unsigned ISAs
     */
    getNumberOfSignedAndUnsignedISAs(useCurrentSchoolYear = false): Observable<{signedISAs: number, unsignedISAs: number}> {
        return forkJoin([this.getNumberOfSignedISAs(useCurrentSchoolYear), this.getNumberOfUnsignedISAs()])
            .pipe(
                first(),
                map(([signedISAs, unsignedISAs]: number[]) =>  {
                    this.school.hasISAs = !!(signedISAs || unsignedISAs);
                    return { signedISAs, unsignedISAs };
                })
            );
    }

    /**
     * @param useCurrentSchoolYear - Boolean telling if the signed ISAs of the current year are the ones required.
     */
    getNumberOfSignedISAs(useCurrentSchoolYear = false) {
        if (this.school.orgId) {
            const params ={
                limit: 1,
                is_signed: true,
                org_uuid: this.school.orgId,
                school_year_code: useCurrentSchoolYear ? this.school.currentYearCode : '',
            }
            
            return this.getISAs(params).pipe(map(({ count }) => count));   
        } else {            
            this.logAndThrowRxJSError('ISAs can\'t be retrieved without org id.');
        }
    }
    
    getNumberOfUnsignedISAs() {
        if (this.school.orgId) {
            const params ={
                limit: 1,
                is_signed: false,
                org_uuid: this.school.orgId,
            }
    
            return this.getISAs(params).pipe(map(({ count }) => count));   
        } else {
            this.logAndThrowRxJSError('ISAs can\'t be retrieved without org id.');
        }
    }

    /**
     * @param signed - Whether the ISAs to get are signed or unsigned.
     */
    getISAsWithFormatForTable(signed: boolean, tableParams: { fullName: string, discipline: string, page: number, schoolYear: string }) {        
        const params ={
            limit: 50,
            is_signed: signed,
            org_uuid: this.school.orgId,
            page: tableParams.page ? tableParams.page : 1,
            full_name: tableParams.fullName ? tableParams.fullName : '',
            provider_type_code: tableParams.discipline ? tableParams.discipline : '',
            school_year_code: tableParams.schoolYear ? tableParams.schoolYear : '',
        }

        return this.getISAs(params).pipe(map((isa: ISAInfo) => {
            if (isa.results) {
                isa.results = isa.results.map((isa: any) => {
                    isa.service_period_start = isa.service_period_start ? moment(isa.service_period_start).format('MM/DD/YYYY') : '--';
                    isa.service_period_end = isa.service_period_end ? moment(isa.service_period_end).format('MM/DD/YYYY') : '--';

                    return isa = {
                        uuid: isa.uuid,
                        id: isa.external_id,
                        fullName: `${isa.first_name} ${isa.last_name}`,
                        birthday: moment(isa.birthday).format('MM/DD/YYYY'),
                        grade: isa.grade ? isa.grade : '--',
                        discipline: isa.discipline ? isa.discipline : '--',
                        servicePeriod: `${isa.service_period_start} - ${isa.service_period_end}`,
                        rate: isa.rate,
                        location: isa.location_name ? isa.location_name : '--',
                    };
                });
            }

            return isa;
        }));
    }

    /**
     * Get plain response of ISAs withouth any computation before its return.
     * 
     * @param params - {is_signed: boolean, org_uuid: string}  
     * @returns - A plain response of the ISAs requested.
     */
    getISAs(params: {is_signed: boolean, org_uuid: string}) {
        return this.plHttpSvc.get('isas', params).pipe(first());
    }

    /**
     * For removing ISAs the title and name are not required at UI label but are required at API level.
     * 
     * @param referralIds 
     * @param reasonCodes 
     * @param reasonsOther 
     * @returns 
     */    
    removeISAs(referralIds: string[], reasonCodes: string[], reasonsOther: string[]): Observable<any> {
        if (this.user.title && this.user.fullName) {
            const params = {
                is_approved: false,
                reason_codes: reasonCodes,
                referral_uuids: referralIds,
                reasons_other: reasonsOther,
                name: this.user.fullName,
                title: this.user.title
            }
    
            return this.plHttpSvc.save('isas', params).pipe(
                first(),
                tap(() => this.isasSignedOrRemovedSubject.next('isas removed'))
            );
        } else {
            this.logAndThrowRxJSError('ISAs can\'t be removed without name and title.');
        }
    }

    signISAs(referralIds: string[]): Observable<any> {
        const emptyReferrals = referralIds.filter((referralId: string) => !referralId);
        
        if (!emptyReferrals.length && this.user.title && this.user.fullName) {            
            const params = {
                is_approved: true,
                title: this.user.title,
                name: this.user.fullName,
                referral_uuids: referralIds,
            }
    
            return this.plHttpSvc.save('isas', params).pipe(
                first(),
                tap(() => this.isasSignedOrRemovedSubject.next('isas signed'))
            );
        } else {
            this.logAndThrowRxJSError('ISAs can\'t be signed without name, title, or empty referrals.');
        }
    }

    /**
     * Checks if the ISAs feature is enabled for the user.
     * Enabled when:
     *  - User is a Customer Admin and has either signed or unsigned ISAs to view
     *
     * Sets properties needed for the ISAs
     * 
     * By default takes the first index of the assignments of the current user.
     * If the assignment is changed by the user, the update happens thorugh the setter `schoolOrgId`.
     */
    isISAFeatureEnabled(): Observable<{signedISAs: number, unsignedISAs: number, featureState: any}> {
        if (this.isas.featureState === ISAFeatureStates.notChecked) {
            return this.store$.select(selectCurrentUserLoaded).pipe(
                filter(loaded => loaded),
                switchMap(() => this.store$.select(selectIsCustomerAdmin)),
                filter(isCustomerAdmin => {
                    if (!isCustomerAdmin) throw throwError('Not a Customer Admin user.'); 
                    return isCustomerAdmin;
                }),
                withLatestFrom(this.store$.select(selectCurrentUser)),
                tap(([_, currentUser]) => {
                    if (currentUser) {
                        if (currentUser.xAssignments && currentUser.xAssignments.length) {
                            // If the assignment (orgID) is updated by the Customer Admin in the dashboard; the `orgID` will b updated from there.
                            this.school.orgId = currentUser.xAssignments[0].orgID; // By default the `orgID` is taken from the first index.
                            this.school.orgName = currentUser.xAssignments[0].orgName;
                            this.isas.featureState = this.school.orgId ? ISAFeatureStates.notChecked : ISAFeatureStates.unavailable;
                        }
                        
                        if (currentUser.first_name && currentUser.last_name) {
                            this.user.fullName = `${currentUser.first_name} ${currentUser.last_name}`;
                        }

                        // Needed for knowing across ISAs whether we are dealing with a user assigned to one or many schools (orgs).
                        this.user.isAssignedToOneSchool = currentUser.xAssignments.length === 1;
                    }
                }),
                switchMap(() => {
                    if (this.isas.featureState !== ISAFeatureStates.unavailable) return this.getNumberOfSignedAndUnsignedISAs();
                    return of({ signedISAs: 0, unsignedISAs: 0 }) // Will make the feature unavailable to the user.
                }),
                map((isas: {signedISAs: number, unsignedISAs: number}) => {
                    if (this.user.isAssignedToOneSchool) {
                        this.isas.featureState = (isas.signedISAs || isas.unsignedISAs) ? ISAFeatureStates.available : ISAFeatureStates.unavailable;
                    } else {
                        // Scenario for when the user has more than one school assigned.
                        // The feature is set to available because for some schools there could be ISAs and for others couldn't.
                        // The available state will allow to make API calls based on the school org id later on.
                        this.isas.featureState = ISAFeatureStates.available;
                    }

                    return {
                        signedISAs: isas.signedISAs,
                        unsignedISAs: isas.unsignedISAs,
                        featureState: this.isas.featureState,
                    }
                })
            );
        }
    }

    /**
     * Helper for the scenario where a decision has to be made based on if the user has one or more schools assigned.
     * If the user has more schools assigned, a check has to be made and see if the current school has ISAs or not.
     * 
     * @returns - A boolean
     */
    isUserAssignedToOneSchoolOrCurrentSchoolHasISAs() {
        if (this.user.isAssignedToOneSchool) {
            return true;
        } else if (this.school.hasISAs) {
            return true;
        } else {
            return false;
        }
    }

    private logAndThrowRxJSError(errorMessage: string) {
        if (errorMessage) {
            console.log(errorMessage);
            throw throwError(errorMessage);
        }
    }
}
