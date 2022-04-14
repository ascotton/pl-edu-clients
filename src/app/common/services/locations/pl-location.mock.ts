import { PLLocation } from './pl-location';

export function plLocationMock(mockProperties: any): PLLocation {
    const baseMockProperties = {
        name: '',
        id: '',
        organizationId: '',
        organizationName: '',
        state: '',
        isVirtual: false,
    };

    return Object.assign({}, baseMockProperties, mockProperties);
}
