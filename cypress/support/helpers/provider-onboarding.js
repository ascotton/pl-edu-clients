
// rename this to describe what it's doing
function assertSelections() {
    //Change these flex selectors to target divs instead
    cy.get("pl-provider-account-settings .card-body .flex1:nth-child(1) .label-value:nth-child(1) .value")
        .first()
        .should("have.text", "Speech-Language Pathologist");
    cy.get("pl-provider-account-settings .card-body .flex1:nth-child(1) .ng-star-inserted:nth-child(2) .value")
        .first()
        .should("have.text", "Onboarding");
    cy.get("pl-provider-account-settings .card-body .flex1:nth-child(2) div:nth-child(2) .value ul li").should(
        "include.text",
        "Japanese"
    );
    cy.get(
        "pl-provider-account-settings .card-body .flex1:nth-child(2) div:nth-child(3) .value ul li:nth-child(1)"
    ).should("include.text", "Aphasia");
    cy.get(
        "pl-provider-account-settings .card-body .flex1:nth-child(2) div:nth-child(3) .value ul li:nth-child(2)"
    ).should("include.text", "Literacy");
}

export default {
    assertSelections,
}