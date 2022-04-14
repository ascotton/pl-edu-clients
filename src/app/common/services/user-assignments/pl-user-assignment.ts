/**
 * Assignment - auth assignment that binds a user and a role to either a location
 * or an organization.
 *
 * Either locationID or orgID properties should be defined.
 */
export interface PLUserAssignment {
    roleCode: string;
    isLocation: boolean;
    id?: string;
    userID?: string;
    locationID?: string;
    locationName?: string;
    orgID?: string;
    orgName?: string;
}

export const plUserAssignmentMock = (options: any = {}): PLUserAssignment => ({
    roleCode: '42',
    isLocation: true,
    ...options,
});
