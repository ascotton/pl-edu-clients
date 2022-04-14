/**
 * PLApiUserAssignment - user assignments produced and received by the auth API
 */
export interface PLApiUserAssignment {
    location_id?: string;
    is_active?: boolean;
    organization_id?: string;
    role_code: string;
    user_id: string;
    uuid: string;
    account: any;
}
