export interface PLNotesReportDownload {
    id: string;
    filePath: string;
    fileFormat: string;
    name: string;
    progress: number;
    error: string;
    hasEmptyResults: boolean;
    hasError: boolean;
    downloadUrl: string;
    downloadUrlExpiresOn: string;
    xCreatedAt: string;
    xUpdatedAt: string;
    xTimedOut: boolean;
    xExpired: boolean;
}
