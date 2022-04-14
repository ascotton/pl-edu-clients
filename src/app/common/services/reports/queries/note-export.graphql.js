module.exports =
`query NoteExports(
    $id: ID!
) {
    noteExport(
        id: $id
    ) {
        id
        filePath
        fileFormat
        progress
        error
        hasEmptyResults
        hasError
        downloadUrl
        downloadUrlExpiresOn
    }
}`;
