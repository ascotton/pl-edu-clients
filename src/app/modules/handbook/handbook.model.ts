export interface Handbook {
    schoolYearId: string;
    orgId: string;
    orgName: string;
}

export interface UserEditor {
    firstName: string;
    lastName: string;
    timezone: string;
    dataOnCheckOut: string;
}

export interface TinyConfig {
    height: number;
    menubar: boolean;
    plugins: string[];
    toolbar: string;
}

export const HANDBOOK_ROUTING_STORE = {
    FUNCTION_NAME: 'handbookRoutingActionStore',
    STOP: 'routingStoppedOnEdit',
    CONTINUE: 'continueRouting',
    STOP_ROUTE: { type: 'HANDBOOK_ROUTING_ACTION', payload: 'routingStoppedOnEdit' },
    CONTINUE_ROUTE: { type: 'HANDBOOK_ROUTING_ACTION', payload: 'continueRouting' },
};
