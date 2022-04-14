export enum PLActionTypes {
    User = 'UI',
    Backend = 'API',
    Device = 'Device',
}

export const userActionName = (feature: string, component: string) =>
    `[${feature}][${PLActionTypes.User}.${component}]`;
export const backendActionName = (feature: string, endpoint: string) =>
    `[${feature}][${PLActionTypes.Backend}.${endpoint}]`;
export const deviceActionName = (feature: string, api: string) =>
    `[${feature}][${PLActionTypes.Device}.${api}]`;
