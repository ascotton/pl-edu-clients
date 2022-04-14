import { Injectable } from '@angular/core';

import { PLUserAssignment } from './pl-user-assignment';
import { PLApiUserAssignment } from './pl-api-user-assignment';


/**
 * PLUserAssignmentsService - API fetch and utilities for managing user assignments.
 */
@Injectable()
export class PLUserAssignmentsService {
    /**
     * toAssignment - converts a raw assignment from the API to a PLUserAssignment
     */
    toAssignment(assignment: PLApiUserAssignment): PLUserAssignment {
        return {
            id: assignment.uuid,
            locationID: assignment.location_id,
            orgID: assignment.organization_id,
            roleCode: assignment.role_code,
            userID: assignment.user_id,
            orgName: (assignment.organization_id)
                ? assignment.account.name
                : assignment.account.clinical_coordinator_name,
            locationName: (assignment.location_id) ? assignment.account.name : '(All Locations)',
            isLocation: !assignment.organization_id && !!assignment.location_id, /* case where account is org AND loc */
        };
    }
}
