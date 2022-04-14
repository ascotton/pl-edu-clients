export const reassignEvaluationMutation = `mutation reassignEvaluation($reassignEvaluationInput: ReassignEvaluationInput!) {
    reassignEvaluation(input: $reassignEvaluationInput) {
        errors {
            code
            field
            message
        }
        status
        referral {
            id
        }
        evaluation {
            id
        }
    }
}`;
