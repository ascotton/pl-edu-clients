export function app(state: any = {}, action: any) {
        const type = action.type;
        const payload = action.payload;
        switch (type) {
            case 'UPDATE_APP':
                return payload;
        default:
            return state;
    }
};
