module.exports =
`mutation ExportNotes(
    $fileFormat: NoteExportFileFormat!,
    $filterClientServices: ExportNotesClientServiceFilterInput,
    $filterRecords: ExportNotesRecordFilterInput,
    $reportTitle: String!,
    $reportFilenameTitle: String!,
    $reportTemplate: ReportTemplate!,
) {
    exportNotes(
        input: {
            fileFormat: $fileFormat,
            filterClientServices: $filterClientServices,
            filterRecords: $filterRecords,
            reportTitle: $reportTitle,
            reportFilenameTitle: $reportFilenameTitle,
            reportTemplate: $reportTemplate
        }
    ) {
        errors {
            code
            field
            message
        }
        noteExport {
            id
            filePath
            fileFormat
            progress
            hasEmptyResults
            downloadUrl
            downloadUrlExpiresOn
        }
    }
}`;
