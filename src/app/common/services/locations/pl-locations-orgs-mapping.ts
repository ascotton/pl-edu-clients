import { Option } from '@common/interfaces';
import { PLLocation } from './pl-location';
import { PLOrganization } from './pl-organization';
import { sortBy } from 'lodash';

const toOption = (o: PLLocation | PLOrganization) => ({
    label: o.name,
    value: o.id,
});

/**
 * Given an array of locations, provides functions to search for locations and
 * their organizations, and to convert them to Options suitable for PL components
 * inputs.
 *
 * Queries for organizations assume that the locations (and organizations) provided
 * are those to which the logged in user has assignments. Therefore, organizations
 * that do not have IDs in the locations list will not be included in the
 * results of the organization query functions.
 */
export class PLLocationsOrgsMapping {
    private locations: PLLocation[] = [];

    constructor(locations: PLLocation[]) {
        // Guard against unintended consequences if the consumer modifies
        // the original locations array.
        this.locations = [...locations];
    }

    /**
     * Returns organizations culled from the list of locations. Does not inlcude
     * orgs that have not been assigned to the user (i.e., lack an ID).
     *
     * @param options.includeChildren If true, the returned organizations will
     * include location IDs in their children lists. If false, the lists will
     * be empty
     */
    private organizations(options: { includeChildren: boolean } = { includeChildren: false }): PLOrganization[] {
        const orgChildren = (locations: PLLocation[], orgId: string): string[] => {
            return locations.filter(loc => loc.organizationId === orgId).map(loc => loc.id);
        };

        // Filter returning true if organization ID of location is unique within the array. Variation on
        // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
        const isUnique = (location: PLLocation, index: number, locations: PLLocation[]): boolean => {
            const orgId = location.organizationId;

            return locations.findIndex(l => l.organizationId === orgId) === index;
        };

        return this.locations
        .filter(loc => loc.organizationId)
        .filter(isUnique)
        // Create organizations
        .map((loc): PLOrganization => ({
            name: loc.organizationName,
            id: loc.organizationId,
            children: options.includeChildren ? orgChildren(this.locations, loc.organizationId) : [],
        }));
    }

    getLocationCount(): number {
        return this.locations.length;
    }

    getOrganizationCount(): number {
        return this.organizations().length;
    }

    getLocationOptions(): Option[] {
        const options = this.locations.map(toOption);

        return sortBy(options, ['label']);
    }

    getOrganizationOptions(): Option[] {
        const options = this.organizations().map(toOption);

        return sortBy(options, ['label']);
    }

    getLocationForID(id: string): PLLocation {
        return this.locations.find(location => location.id === id);
    }

    getLocationNameForID(id: string): string {
        const location = this.getLocationForID(id);

        return location ? location.name : '';
    }

    getOrganizationForID(id: string): PLOrganization {
        return this.organizations({ includeChildren: true }).find(org => org.id === id);
    }

    getOrganizationNameForID(id: string): string {
        const org = this.getOrganizationForID(id);

        return org ? org.name : '';
    }

    getLocationOptionsForParentOrg(parentOrgId: string): Option[] {
        if (parentOrgId === null) {
            return this.getLocationOptions();
        }

        const org = this.getOrganizationForID(parentOrgId);
        const locationIDs = org ? org.children : [];
        const locationOptions = locationIDs.map((id: string) => toOption(this.getLocationForID(id)));

        return sortBy(locationOptions, 'label');
    }

    getOrganizationOptionsByLabel(searchTerm: string): Option[] {
        const bySearchTerm = (option: Option) => option.label.toLowerCase().includes(searchTerm.toLowerCase());

        return this.getOrganizationOptions().filter(bySearchTerm);
    }

    getOrganizationOptionsByIDs(orgIDs: string[]): Option[] {
        return orgIDs
        .map((id): PLOrganization => this.getOrganizationForID(id))
        // filter to keep only orgs with matching IDs
        .filter(org => org)
        .map(toOption);
    }
}
