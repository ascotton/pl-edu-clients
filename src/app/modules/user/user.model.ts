export interface User {
    uuid?: string;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    groups?: string[];
    xAuthPermissions?: string[];
    xPermissions?: any;
    xGlobalPermissions?: { [key: string]: boolean };
    xEnabledUiFlags?: string[];
    xEnabledFeatures?: string[];
    xProvider?: any;
    xAssignments?: any;
}
