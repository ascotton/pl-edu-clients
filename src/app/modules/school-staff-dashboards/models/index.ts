export interface PLMenuItem {
    label: string;
    href?: string;
    icon?: string;
    target?: string;
    material?: boolean; // To Identify if icon is from material
}

export interface PLOrganization {
    id: string;
    name: string;
    isGroupOrganization?: boolean;
    sfAccountId: string;
    accountCam?: {
        firstName: string;
        lastName: string;
    };
    accountOwner?: {
        email: string;
        firstName: string;
        lastName: string;
    };
}

export * from './licenses.interface';
