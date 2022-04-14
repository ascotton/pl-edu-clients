export function clientsList(state: any = {}, action: any) {
        const type = action.type;
        const payload = action.payload;
        switch (type) {
            case 'REMOTE_UPDATE_CLIENTS_LIST':
                return type;
        }
};
