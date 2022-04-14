module.exports =
`mutation supportSummaryCreateIdeaFeedback($summary: String!, $description: String,
 $component: String) {
    createIdeaFeedback(input: {summary: $summary, description: $description, component: $component}) {
        status
    }
}`;