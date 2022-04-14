export interface PLDownloadItem {
    id: string;
    error: string;
    errorDescription: string;
    filename: string;
    progress: number;
    status: 'in-progress' | 'error' | 'complete';
    title: string;
    url: string;
}
