import "cypress-file-upload";
import clients from "../../../../support/helpers/clients";
import util from "../../../../support/util";

const { getRandomString } = util;

context("Smoke / Bulk upload files", () => {
    before(() => {
        util.setCurrentUser(util.CAM_USER);
        util.IT_SHOULD("load the clients screen", () => {
            cy.visit("/c/clients");
        });
    });

    describe(`Bulk upload clients and confirm their creation`, () => {
        it("should navigate to clients tab and bulk upload users", () => {
            clients.bulkUploadFile();

            util.IT_SHOULD("Complete upload", () => {
                cy.get(".x-qa-steps-buttons-next").click();
                cy.get(".x-qa-dialog-primary-button").click();
            });

            util.IT_SHOULD("Confirm referrals were created successfully", () => {
                cy.get(".result-header").should("contain.text", "Referrals were added successfully");
                cy.get(".x-qa-steps-buttons-next").click();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Navigate to clients page", () => {
                util.navigateToClients();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Filter by 2022-2023 school year", () => {
                cy.get(".pl-input-multi-select .select-and-options .select-button .label").click();
                cy.get(".x-qa-active-filters pl-input-dropdown .options > div:nth-child(2) pl-input-checkbox input")
                    .first()
                    .click();
            });

            util.IT_SHOULD("Confirm first user is found", () => {
                clients.searchAllClientsAndConfirmResults("Jimmy", "Rojas");
            });

            util.IT_SHOULD("Clear search field", () => {
                cy.get(".x-qa-active-filters .filter input").first().clear();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Confirm second user is found", () => {
                clients.searchAllClientsAndConfirmResults("Tayjah", "Fry");
            });

            util.IT_SHOULD("Clear search field", () => {
                cy.get(".x-qa-active-filters .filter input").first().clear();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Confirm third user is found", () => {
                clients.searchAllClientsAndConfirmResults("Edward", "Gonzalez");
            });
        });

        it("should navigate to clients tab, bulk upload users and delete two entries", () => {
            clients.bulkUploadFile();

            util.IT_SHOULD("Delete the second user", () => {
                cy.get(".editable-table-rows .editable-table-row:nth-child(4) .row-footer button").click({
                    force: true,
                });
                cy.get(".pl-dialog-alert .x-qa-dialog-primary-button").click();
            });

            util.IT_SHOULD("Delete the third user", () => {
                cy.get(".editable-table-rows .editable-table-row:nth-child(5) .row-footer button").click({
                    force: true,
                });
                cy.get(".pl-dialog-alert .x-qa-dialog-primary-button").click();
            });

            util.IT_SHOULD("Complete upload", () => {
                cy.get(".x-qa-steps-buttons-next").click();
                cy.get(".x-qa-dialog-primary-button").click();
            });

            util.IT_SHOULD("Confirm only one referral upload was attempted", () => {
                cy.get(".result-header span").should(
                    "include.text",
                    "1 Referrals not uploaded, no further action possible at this time."
                );
            });
        });

        it("should navigate to clients tab, bulk upload users and modify provider type", () => {
            util.IT_SHOULD("Navigate to clients page", () => {
                util.navigateToClients();
            });

            const modifiedFirstName = getRandomString(5);
            const modifiedId = getRandomString(5);
            clients.bulkUploadFile();

            util.IT_SHOULD("Modify the provider type", () => {
                cy.get(".editable-table-rows .editable-table-row:nth-child(3) .cell:nth-child(7) .cell-input").select(
                    "Occupational Therapist"
                );
            });

            util.IT_SHOULD("Modify the first name", () => {
                cy.get(".editable-table-rows .editable-table-row:nth-child(3) .cell:nth-child(3) .cell-input").type(
                    modifiedFirstName
                );
            });

            util.IT_SHOULD("Complete upload", () => {
                cy.get(".x-qa-steps-buttons-next").click();
                cy.get(".x-qa-dialog-primary-button").click();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Settle the duplicate client by creating a new one", () => {
                cy.get(".dupe-input input").type(modifiedId);
                cy.get(".dupe-client button").last().click();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Confirm a referral was added", () => {
                cy.get(".result-header").should("contain.text", "Referrals were added successfully");
                cy.get(".x-qa-steps-buttons-next").click();
            });

            util.IT_SHOULD("Filter by 2022-2023 school year", () => {
                cy.get(".pl-input-multi-select .select-and-options .select-button .label").click();
                cy.get(".x-qa-active-filters pl-input-dropdown .options > div:nth-child(2) pl-input-checkbox input")
                    .first()
                    .click();
            });

            util.IT_SHOULD("Confirm modified user is found", () => {
                clients.searchAllClientsAndConfirmResults(`Jimmy${modifiedFirstName}`, "Rojas");
            });

            util.IT_SHOULD("Click into the modified user", () => {
                cy.get("pl-all-clients pl-table-row pl-table-cell").first().click();
            });

            util.waitForNetworkInactivity();

            util.IT_SHOULD("Confirm referral with the correct provider type was created", () => {
                cy.get("pl-client-direct-referral .header .service-type").should(
                    "contain.text",
                    "Referral - Occupational Therapist - Direct Therapy"
                );
            });
        });
    });
});
