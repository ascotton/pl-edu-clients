export interface PLPlatformUser {
    uuid?: string;
    lastName: string;
    firstName: string;
    email: string;
    licenseType: string;
    occupation?: string;
    assessmentAccess?: boolean;
    adminAccess?: boolean;
}

export interface PLLicenseType {
    uuid: string;
    license_name: string;
    allowed_discipline_groups: string[];
    occupations: string[];
    groups: any[];
    is_admin: boolean;
    // To be added to the BE
    has_assessments?: boolean;
    total_quantity?: number;
    quantity_remaining?: number;
    quantity_used?: number;
}
