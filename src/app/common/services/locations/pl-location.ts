export interface PLLocation {
    id: string;
    isVirtual: boolean;
    name: string;
    organizationId: string | null; // null indicates the caller lacks an assignment to that org
    organizationName: string;
    state: string;
    camName?: string;
}

interface GraphQlLocationNode {
    name: string;
    id: string;
    locationType: string;
    organizationName: string;
    organization?: {
        id: string;
    };
    state: string;
    accountCam?: {
        firstName: string;
        lastName: string;
    };
}

export const nodeToLocation = (node: GraphQlLocationNode): PLLocation => ({
    name: node.name,
    id: node.id,
    isVirtual: node.locationType === 'VIRTUAL',
    organizationName: node.organizationName,
    organizationId: node.organization ? node.organization.id : null,
    state: node.state,
    // node accountCam is optional, as is camName. If it's not included in the query result (node),
    // then do not include it in the PLLocation
    ...(node.accountCam ? { camName: `${node.accountCam.firstName} ${node.accountCam.lastName}` } : {}),
});
