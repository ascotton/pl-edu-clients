export function handbookRoutingActionStore(state: any = {}, action: any) {
    let result = null;
    const type = action.type;
    const payload = action.payload;

    if (type === 'HANDBOOK_ROUTING_ACTION') {
        result = payload;
    }

    return result;
}
