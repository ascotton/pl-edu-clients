export function notesReportDownloads(state: any = { downloads: [] }, action: any) {
    const type = action.type;
    const payload = action.payload;
    switch (type) {
            case 'CREATE_NOTES_REPORT_DOWNLOAD':
                return {
                    ...state,
                    downloads: state.downloads.concat([payload.download]),
                };
            case 'REMOVE_NOTES_REPORT_DOWNLOAD':
                return {
                    ...state,
                    downloads: state.downloads.filter((download: any) =>  download.id !== payload.download.id),
                };
            case 'UPDATE_NOTES_REPORT_DOWNLOAD':
                return {
                    ...state,
                    downloads: state.downloads.map((download: any) => {
                        if (download.id === payload.download.id) {
                            return { ...download, ...payload.download };
                        }
                        return download;
                    }),
                };
            default:
                return state;
    }
}
