import util from "../util";

function addClient(firstName, lastName, id, dob) {
    cy.get(".x-qa-last-name").type(firstName);
    cy.get(".x-qa-first-name").type(lastName);
    cy.get(".x-qa-external-id").type(id);
    cy.get(".x-qa-birthday").type(dob);

    cy.get(".x-qa-organization-select").click();
    cy.get(".x-qa-organization-select .option").eq(0).click();

    cy.get(".x-qa-location-select").click();
    cy.get(".x-qa-location-select .option").eq(0).click();

    cy.get(".add-client-button").click();
}

function searchClientsAndSelectFirstMatch(lastName) {
    // Search for the user that was created
    cy.get(".pl-input-text input").first().type(lastName);
    cy.get(".pl-dot-loader", { timeout: 5000 }).should("exist");
    cy.get(".pl-dot-loader", { timeout: 5000 }).should("not.exist");
    cy.get("pl-caseload-clients pl-table-wrapper")
        .find("pl-table-row")
        .should("have.length", 1);

    // Click on the first result that is returned for the user that was created
    cy.get("pl-caseload-clients pl-table-wrapper pl-table-row pl-table-cell")
        .first()
        .click();
}

function searchAllClientsAndConfirmResults(firstName, lastName) {
    // Search for the user that was created
    cy.get(".pl-input-text input").first().type(`${firstName} ${lastName}`);
    cy.get(".pl-dot-loader", { timeout: 5000 }).should("exist");
    cy.get(".pl-dot-loader", { timeout: 5000 }).should("not.exist");
    cy.get("pl-all-clients").find("pl-table-row");

    // Click on the first result that is returned for the user that was created
    cy.get("pl-table-cell:nth-child(1)").first().should("have.text", lastName);
    cy.get("pl-table-cell:nth-child(2)").first().should("have.text", firstName);
}

function bulkUploadFile() {
    util.IT_SHOULD("Click upload referrals button", () => {
        cy.get(".x-qa-upload-referrals").click();
    });

    util.IT_SHOULD("Select an organization", () => {
        cy.get(".x-qa-organization-select .pl-input-select").click();
        cy.get(
            ".x-qa-organization-select .options .option:nth-child(3)",
        ).click();
    });

    util.IT_SHOULD("Select a location", () => {
        cy.get(".x-qa-location-select .pl-input-select").click();
        cy.get(".x-qa-location-select .options .option:nth-child(2)").click();
    });

    util.IT_SHOULD("Select a school year", () => {
        cy.get(".x-qa-year-select .pl-input-select").click();
        cy.get(".x-qa-year-select .options .option:nth-child(1)").click();
        cy.get(".x-qa-steps-buttons-next").click();
    });

    util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });

    util.IT_SHOULD("Upload an xlsx file", () => {
        cy.get(".input").attachFile("/transient/Referrals_Bulk_Upload.xlsx");
    });

    util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });

    util.IT_SHOULD("Select a worksheet", () => {
        cy.get(".multi-sheet-select .pl-input-select").click();
        cy.get(".multi-sheet-select .options .option:nth-child(3)").click();
    });

    util.IT_SHOULD("Confirm selection", () => {
        cy.get(".x-qa-dialog-primary-button").click();
    });

    util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function createMetric() {
    cy.get("pl-input-textarea").type("Matric message.");
    cy.get(".add-metric-button").click();
    cy.get(".metric-input input").first().type("Cypress metric.");
    cy.get(".metric-target-accuracy input").first().type("80");
    cy.get(".save-goal-button").first().click();
}

function referralConvertToServiceForm(serviceOptionLabel) {
    cy.get(".x-qa-service .select-and-options").click();
    cy.get(".x-qa-service .option").contains(serviceOptionLabel).click();
    cy.get(".x-qa-input-session-duration input").type(20);
    cy.get(".x-qa-input-session-frequency input").type(2);
    cy.get(".x-qa-session-interval .select-and-options").click();
    cy.get(".x-qa-session-interval .option").contains("Daily").click();
    cy.get("pl-input-datepicker:nth-child(1) pl-input-text input").type(
        `${util.currentDate()}{enter}{esc}`,
    );
    cy.get(".x-qa-minutes-required-input input").type("20");
}

function weeklyReferralConvertToServiceForm(serviceOptionLabel) {
    cy.get(".x-qa-service .select-and-options").click();
    cy.get(".x-qa-service .option").contains(serviceOptionLabel).click();
    if (serviceOptionLabel === "Psychoeducational Assessment") {
        cy.get(".x-qa-evaluation-type").click();
        cy.get(".x-qa-evaluation-type .option").contains("Initial").click();
        return;
    }
    cy.get(".x-qa-session-interval .select-and-options").click();
    cy.get(".x-qa-session-interval .option").contains("Weekly").click();
    cy.get("pl-input-datepicker:nth-child(1) pl-input-text input").type(
        `${util.currentDate()}{enter}{esc}`,
    );
    cy.get(".x-qa-minutes-required-input input").type("0");
}

function createReferralForm(providerTypeCode, productTypeCode) {
    cy.get(`.x-qa-provider-type input.x-qa-${providerTypeCode}`).click();
    cy.get(`.x-qa-product-type input.x-qa-${productTypeCode}`).click();
    if (providerTypeCode === "pa") {
        cy.get("pl-input-datepicker:nth-child(1) pl-input-text input").type(
            `${util.currentDate()}{enter}{esc}`,
        );
        // notes textarea is hidden
        cy.get("textarea").type("Testing Referral", {force: true});
        return;
    }
    cy.get("pl-input-select.grade-input").click();
    cy.get("pl-input-select.grade-input .option").eq(1).click();
    cy.get("pl-input-text.duration-input").first().type("30");
    cy.get("pl-input-text.frequency-input").first().type("1");
    cy.get("pl-input-select.interval-input").click();
    cy.get("pl-input-select.interval-input .option").contains("Weekly").click();
    cy.get(".pl-input-checkbox-group .option input").eq(0).click();
    cy.get("textarea").type("Testing Referral", {force: true});
}

function makeRandomClientInfo() {
    const clientLastName = util.getRandomString(5);
    const clientUserId = util.uuidv4();
    return { clientLastName, clientUserId };
}

export default {
    addClient,
    searchClientsAndSelectFirstMatch,
    createMetric,
    referralConvertToServiceForm,
    weeklyReferralConvertToServiceForm,
    createReferralForm,
    makeRandomClientInfo,
};
