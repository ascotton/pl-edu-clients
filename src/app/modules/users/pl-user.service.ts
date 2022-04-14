import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { first, map, catchError } from 'rxjs/operators';

import { PLHttpService } from '@root/index';

import { PLUserAccount } from './pl-user-account';
import { PLApiUserAssignment } from '@common/services/user-assignments/pl-api-user-assignment';
import { PLUserAssignment } from '@common/services/user-assignments/pl-user-assignment';
import { PLUserAssignmentsService } from '@common/services/user-assignments/pl-user-assignments.service';

// For consumer convenience
export { PLUserAccount };

/**
 * ApiUserAccount - raw API structure for a user account.
 */
interface ApiUserAccount {
    assignments: PLApiUserAssignment[];
    email: string;
    first_name: string;
    is_active: boolean;
    last_name: string;
    username: string;
    uuid: string;
}

interface GetUsersQueryParams {
    // match email, case insensitive
    email__icontains?: String;
    // match full name, case insensitive
    full_name?: String;
    // comma-delimmited list of groups to match, inclusive
    group__in?: String;
    limit?: number;
    ordering?: String;
    page?: number;
    // match username, case insensitive
    username__icontains?: String;
    is_active?: boolean;
}

interface GetUsersResults {
    totalCount: number;
    users: {
        user: PLUserAccount,
        assignments: PLUserAssignment[],
    }[];
}

interface UpdateUserParams {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

/**
 * userAccount - factory for creating an empty PLUserAccount
 */
export function userAccount(): PLUserAccount {
    return {
        email: '',
        firstName: '',
        id: '',
        isActive: false,
        lastName: '',
        username: '',
    };
}

/**
 * PLUserService - utilities for fetching, creating, and updating user accounts.
 */
@Injectable()
export class PLUserService {
    constructor(
        private plHttp: PLHttpService,
        private plAssignmentsService: PLUserAssignmentsService,
    ) {}

    private toUserAccount(user: ApiUserAccount): PLUserAccount {
        return {
            email: user.email,
            firstName: user.first_name,
            id: user.uuid,
            isActive: user.is_active,
            lastName: user.last_name,
            username: user.username,
        };
    }

    /**
     * getUserOnce - fetch a user account
     *
     * @param userId
     *
     * @returns user account and the user's assignments. Emits once and completes.
     */
    getUserOnce(userId: string): Observable<{ user: PLUserAccount, assignments: PLUserAssignment[] }> {
        const params = { uuid: userId };

        return this.plHttp.get('user', params).pipe(
            first(),
            map((user: ApiUserAccount) => ({
                user: this.toUserAccount(user),
                assignments: user.assignments.map(a => this.plAssignmentsService.toAssignment(a)),
            })),
        );
    }

    /**
     * getUsersOnce - fetch a list of user accounts
     *
     * @param params - see interface GetUsersQueryParams
     *
     * @returns total number of user accounts matching parameters, a subset of
     * those user accounts and their respective assignments. Emits once and completes.
     */
    getUsersOnce(params: GetUsersQueryParams): Observable<GetUsersResults> {
        return this.plHttp.get('users', params).pipe(
            first(),
            map((results: { count: number, results: ApiUserAccount[] }) => ({
                users: results.results.map(apiUser => ({
                    user: this.toUserAccount(apiUser),
                    assignments: apiUser.assignments.map(a => this.plAssignmentsService.toAssignment(a)),
                })),
                totalCount: results.count,
            })),
        );
    }

    /**
     * createUser - create a user on auth and give that user assignments
     *
     * @param {string} user.email
     * @param {string} user.firstName
     * @param {string} user.lastName
     * @param {PLUserAssignment[]} assignments assignments to create
     *
     * @return {Observable<string>} observable that emits the user's ID upon success.
     * Emits once and completes.
     */
    createUser(user: {
        email: string,
        firstName: string,
        lastName: string,
        assignments: PLUserAssignment[],
    }): Observable<string> {
        const locationAssignments = user.assignments.filter(a => a.locationID);
        const orgAssignments = user.assignments.filter(a => a.orgID);

        const params = {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            assignments: [
                ...locationAssignments.map(a => ({ role_code: a.roleCode, location_id: a.locationID })),
                ...orgAssignments.map(a => ({ role_code: a.roleCode, organization_id: a.orgID })),
            ],
        };

        return this.plHttp.save('users', params, '', { suppressError: true }).pipe(
            catchError((response: HttpErrorResponse) => throwError(response.error)),
            map(({ uuid }: ApiUserAccount) => uuid),
        );
    }

    /**
     * updateUser - triggers REST request to update user account
     *
     * @return {Observable<string>} observable that emits the user's ID upon success.
     * Emits once and completes.
     */
    updateUser(user: UpdateUserParams): Observable<string> {
        const params = {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            uuid: user.id,
        };

        return this.plHttp.save('users', params, '', { suppressError: true }).pipe(
            catchError((response: HttpErrorResponse) => throwError(response.error)),
            map(() => user.id),
        );
    }

    /**
     * changeActiveStatus - updates isActive property of a user.
     *
     * Guard against using this mutation with PLMayService#changeActiveStatus
     *
     * @param {string} params.userID UUID of user to update
     * @param {boolean} params.isActive new value of isActive
     *
     * @return {Observable<{ userID: string }>} Observable emitting user ID upon success.
     * Emits once and completes
     */
    changeActiveStatus(params: { userID: string, isActive: boolean }): Observable<{ userID: string }> {
        const requestParams = { uuid: params.userID, is_active: params.isActive };

        return this.plHttp.save('users', requestParams).pipe(
            catchError((response: HttpErrorResponse) => throwError(response.error)),
            map(() => ({ userID: params.userID })),
        );
    }
}
