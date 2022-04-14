import util from "../util";

function selectTimes() {
    cy.get(
        ".time-block-controls .element:nth-child(2) .select-content .select-and-options .select-button",
    ).click(); // Click the start time dropdown
    cy.get(
        ".time-block-controls .element:nth-child(2) .select-content pl-input-dropdown .option:nth-child(17)",
    ).click(); // Click the first dropdown option

    cy.get(
        ".time-block-controls .element:nth-child(3) .select-content .select-and-options .select-button",
    ).click(); // Click the end time dropdown
    cy.get(
        ".time-block-controls .availability-end pl-input-dropdown .option:nth-child(25)",
    ).click(); // Click the last option

    cy.get(".save-button").click(); // Save the availability changes
}

function setAvailability() {
    cy.get(".week-names > :nth-child(2)").click(); // Begin availability setup
    selectTimes();

    cy.get(".week-names > :nth-child(3)").click(); // Click into the next day and repeat the steps above
    selectTimes();

    cy.get(".week-names > :nth-child(4)").click(); // Click into the next day and repeat the steps above
    selectTimes();

    cy.get(".week-names > :nth-child(5)").click(); // Click into the next day and repeat the steps above
    selectTimes();

    cy.get(".week-names > :nth-child(6)").click(); // Click into the next day and repeat the steps above
    selectTimes();

    cy.get(".bottom > :nth-child(2)").click(); // Save availability
    cy.get(
        ".max-hours-select > pl-input-select > .pl-input-select > .select-and-options > .select-button",
    ).click(); // Click the max hours drop down
    cy.get(
        ".max-hours-select > pl-input-select > .pl-input-select > .select-and-options .option:nth-child(63)",
    ).click(); // Select the last option (32 hours)
}

function scheduleAppointment(lastName, options = { documentAfterSave: true, isProviderPA: false }) {
    cy.get(".pl-input-time-double").eq(0).click();
    cy.get(".pl-input-time-double .option-hr").contains("09").click();
    cy.get(".pl-input-time-double").eq(0).click();
    cy.get(".pl-input-time-double .option-min").contains("30").click();
    cy.get(".pl-input-time-double").eq(0).click();
    cy.get(".pl-input-time-double .option-meridiem").contains("AM").click();
    if (options.isProviderPA) {
        cy.get(".pl-event-tabs-item").contains("Pending Evaluations").click();
        cy.get(`pl-table-row:contains(${lastName}) pl-input-radio`).click();
        cy.contains("Save & Exit").click();
        return;
    }
    const CLIENTS_DROPDOWN_SELECTOR = "pl-input-search-below[label='Clients'] ";
    // Click into the client search and type the user created above
    cy.get(`${CLIENTS_DROPDOWN_SELECTOR} .select-and-options`).click();
    cy.get(`${CLIENTS_DROPDOWN_SELECTOR} .select-and-options`)
        .contains(lastName)
        .click();

    // TODO: look for something better than this...
    if (options.documentAfterSave) {
        cy.contains("Save & Document").click();
    } else {
        cy.contains("Save & Exit").click();
    }
    util.waitForNetworkInactivity();
}

function documentAndSignForDirectServiceAppointment() {
    cy.get(".soap-tab").contains("S").click();
    cy.get("#soap_note_subjective textarea").type("Test Notes");

    cy.get(".soap-tab").contains("O").click();
    cy.get("#soap_note_objective textarea").type("Test Notes for Objective");

    cy.get(".soap-tab").contains("A").click();
    cy.get("#soap_note_assessment textarea").type("Test Notes for Assessment");

    cy.get(".soap-tab").contains("P").click();
    cy.get("#soap_note_plan textarea").type("Test Notes for Planning");

    cy.get("#general-notes textarea").type("Generic Notes");

    cy.get(".signoff input").click();
    cy.get(".save-and-exit").click();
    util.waitForNetworkInactivity({ verbose: true });
}

function documentAndSignForSpProviderService() {
    cy.get("#general-notes textarea").type("Test Notes");
    cy.get(".pl-button.add-activity-component").click();
    cy.get(".select-button").contains("Select an item").click();
    cy.get(".pl-input-dropdown .option")
        .contains("Processing Standard Battery")
        .click();
    cy.get(".select-button").contains("Select an item").click();
    cy.get(".pl-input-dropdown .option")
        .contains("ADOS-single observation module")
        .click();
    cy.get("button").contains("Save Component").click();
    cy.get("button").contains("Remove").click();
    cy.get(".select-status").first().click();
    cy.get("pl-input-dropdown .option").contains("Done").click();
    cy.get("a").contains("Select a PDF file from your computer");
    cy.get(".signoff input").click();
    cy.get(".save-and-exit").click();
    cy.wait(['@timesheetPreview']);
}

function verifySubNavItems() {
    const navItems = ['Calendar', 'Availability', 'Assignments'];

    util.IT_SHOULD(`should have ${navItems.length} subnav items`, () => {
        cy.get(".pl-tabs pl-link").should("have.length", navItems.length);
    });

    navItems.forEach((navItem, index) => {
        util.IT_SHOULD(`sub nav ${index+1} should be ${navItem}`, () => {
            cy.get(".pl-tabs pl-link").eq(index).contains(navItem);
        });
    });
}

export default {
    setAvailability,
    scheduleAppointment,
    documentAndSignForDirectServiceAppointment,
    documentAndSignForSpProviderService,
    verifySubNavItems
};
