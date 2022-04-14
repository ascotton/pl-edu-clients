import { PLNotesReportDownload } from './pl-notes-report-download';
import { toDownloadItem } from './pl-notes-report-download-item';

describe('toDownloadItem', () => {
    const notesReportDownload: PLNotesReportDownload = {
        id: '1',
        filePath: '',
        fileFormat: '',
        progress: 0,
        error: '',
        name: '',
        hasEmptyResults: false,
        hasError: false,
        downloadUrl: '',
        downloadUrlExpiresOn: '',
        xCreatedAt: '',
        xUpdatedAt: '',
        xTimedOut: false,
        xExpired: false,
    };

    describe('file name trimming', () => {
        it('null if path is null', () => {
            const download = { ...notesReportDownload, filePath: <string> null };

            expect(toDownloadItem(download).filename).toEqual(null);
        });

        it('is an empty string if path is empty', () => {
            const download = { ...notesReportDownload, filePath: '' };

            expect(toDownloadItem(download).filename).toEqual('');
        });

        it('is full string if contains no slashes', () => {
            const download = { ...notesReportDownload, filePath: 'file.zip' };

            expect(toDownloadItem(download).filename).toEqual('file.zip');
        });

        it('clips leading slash', () => {
            const download = { ...notesReportDownload, filePath: '/file.zip' };

            expect(toDownloadItem(download).filename).toEqual('file.zip');
        });

        it('drops all segments except last for relative paths', () => {
            const download = { ...notesReportDownload, filePath: 'some/relative/path/to/file.zip' };

            expect(toDownloadItem(download).filename).toEqual('file.zip');
        });

        it('drops all segments except last', () => {
            const download = { ...notesReportDownload, filePath: '/some_path/to-a/file.zip' };

            expect(toDownloadItem(download).filename).toEqual('file.zip');
        });
    });

});
