export function backLink(state: any = {}, action: any) {
        const type = action.type;
        const payload = action.payload;
        switch (type) {
            case 'UPDATE_BACK_LINK':
                return payload;
        default:
            return state;
    }
};
