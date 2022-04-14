import { PLDownloadItem } from '@common/interfaces';
import { PLNotesReportDownload } from './pl-notes-report-download';

/**
 * toDownloadItem - decorator function that converts a note report download into
 * a more generic download item.
 * 
 */
export const toDownloadItem = function(downloadItem: PLNotesReportDownload): PLDownloadItem {
    const { error, errorDescription } = errorMessaging(downloadItem);

    return {
        error,
        errorDescription,
        id: downloadItem.id,
        filename: filename(downloadItem.filePath),
        progress: downloadItem.progress,
        status: status(downloadItem),
        title: downloadItem.name,
        url: downloadItem.downloadUrl,
    };
};

const filename = function(path: string): string {
    // strips file path down to basename + any extension.
    const match = (path || '').match(/^\/?(?:[^\/\s]+\/)*([^\/\s]+)$/);

    return match ? match[1] : path;
};

const status = function(downloadItem: PLNotesReportDownload) {
    if (downloadItem.hasError || downloadItem.xTimedOut || downloadItem.hasEmptyResults || downloadItem.xExpired) {
        return 'error';
    }

    if (downloadItem.downloadUrl) {
        return 'complete';
    }

    return 'in-progress';
};

const errorMessaging = function(downloadItem: PLNotesReportDownload): { error: string, errorDescription: string } {
    if (downloadItem.xTimedOut) {
        return {
            error: 'Report taking too long',
            errorDescription: 'Please generate the report again.',
        };
    }

    if (downloadItem.hasEmptyResults) {
        return {
            error: 'Report is empty',
            errorDescription: 'This report does not include any data.',
        };
    }

    if (downloadItem.xExpired) {
        return {
            error: 'URL expired',
            errorDescription: 'Expires after 1 hour. Please generate report again to download.',
        };
    }

    if (downloadItem.hasError) {
        return {
            error: 'Failed',
            errorDescription: 'Please generate the report again.',
        };
    }

    return {
        error: '',
        errorDescription: '',
    };
};
