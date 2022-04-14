export interface PLOrganization {
    name: string;
    id: string;
    // IDs of locations for which this organization is the parent.
    children: string[];
}
