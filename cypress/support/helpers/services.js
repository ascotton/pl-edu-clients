import helper from "../util";

export function createReferralAsService(duration = null) {
    cy.log("INFO: services: createReferralAsService()", { duration });

    // -----------------------------------------
    // NOTE: jh.2022.01.09
    // -----------------------------------------
    // Clicking an option right after opening a dropdown led to an error due to DOM manipulation
    //   - cy.get('.x-qa-service .option:nth-child(1)').click()
    //
    // SEE: https://docs.cypress.io/guides/references/error-messages#cy-failed-because-the-element-you-are-chaining-off-of-has-become-detached-or-removed-from-the-dom
    //
    // To avoid the error
    //   - use { waitForAnimations: false } or { force: true }
    //   - OR requery the DOM using various operators (PREFERRED)
    //     - .first()
    //     - .eq(0)
    cy.get(".x-qa-service").first().click(); // Service dropdown selection

    if (duration) {
        cy.get("pl-input-text").eq(0).get("input").first().type(duration); // Session duration
        cy.get("pl-input-text:nth-child(2) input").type("1"); // Session frequency
        cy.get("pl-input-select:nth-child(3)").first().click(); // Session interval dropdown
        cy.get("pl-input-select:nth-child(3) .select-and-options .option").first().click(); // Session interval selection
        cy.get("pl-input-datepicker:nth-child(1) pl-input-text input").type(helper.currentDate()); // Date selection
        cy.get("pl-input-text:nth-child(4) input").click(); // Minutes required field
        cy.get(".primary").click();
    } else {
        cy.get(".x-qa-service .select-and-options .options .option").first().click(); // Service type dropdown selection
        cy.get(".x-qa-evaluation-type").click(); // Click evaluation type dropdown selection
        cy.get(".x-qa-evaluation-type .select-and-options .options .option").first().click(); // Evaluation type dropdown selection
        cy.get(".primary").click();
        cy.get(".x-qa-evaluation-due-date").first().type(helper.currentDate()); // Evaluation due date field
        cy.get(".pl-service-save").click();
    }

    cy.get(".primary").click();
}

export function createReferralAsServicePA() {
    cy.get(".x-qa-service").click();
    cy.get(
        "pl-service-save > section > div:nth-child(4) > div.padding-large > pl-service-save-identify > div > form > div.section-body.margin-b > div:nth-child(3) > pl-input-select > div > div > pl-input-dropdown > div > div > div.options > div:nth-child(1)"
    ).click(); // Service dropdown selection

    cy.get(":nth-child(1) > pl-input-radio > .pl-input-radio > .ng-untouched").click();

    cy.get(
        ".margin-large-r > .pl-input-datepicker > :nth-child(2) > :nth-child(1) > pl-input-text > :nth-child(1) > .pl-input-text > .ng-pristine"
    ).type(helper.currentDate()); // Date selection
    cy.get(
        "pl-service-save > section > div:nth-child(4) > div.padding-large > pl-service-save-identify > div > form > div.section-body.margin-b > div:nth-child(3) > div:nth-child(3) > form > pl-input-text > div > div > input"
    ).click(); // Minutes required field

    cy.get(".primary").click();
    cy.get(".primary").click();
}
