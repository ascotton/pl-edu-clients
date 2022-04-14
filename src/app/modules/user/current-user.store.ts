export function currentUser(state: any = {}, action: any) {
    const type = action.type;
    const payload = action.payload;
    switch (type) {
            case 'UPDATE_CURRENT_USER':
                return payload;
            default:
                return state;
    }
}
