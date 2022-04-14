export function currentClient(state: any = {}, action: any) {
        const type = action.type;
        const payload = action.payload;
        switch (type) {
            case 'UPDATE_CURRENT_CLIENT':
                return payload;
        default:
            return state;
    }
};
