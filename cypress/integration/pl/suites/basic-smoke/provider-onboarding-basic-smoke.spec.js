import util from "../../../../support/util";
import schedule from "../../../../support/helpers/schedule";
import onboarding from "../../../../support/helpers/provider-onboarding";

context("Smoke / Complete onboarding flow", () => {
    describe(`Complete onboarding - as ${util.PROVIDER_SLP_ONBOARDING}`, () => {
        it("Should complete onboarding process", () => {
            util.setCurrentUser(util.PROVIDER_SLP_ONBOARDING);
            cy.visit("/c/");

            const userFixture = util.FIXTURE_PROVIDER_SLP_ONBOARDING;

            // Check header includes user's name
            cy.get(".pl-provider-onboarding-welcome h3").should(
                "have.text",
                `Welcome to PresenceLearning, ${userFixture.user.first_name}!`
            );
            cy.get(".primary").click();

            // Check rates
            // cy.get(
            //     "body > app-root > div > div > pl-provider-onboarding > div > div.flexbox.columns > div.center-column.flex1 > pl-provider-onboarding-agreement > div > div.flexbox.form-input.ng-star-inserted > div > span"
            // ).should("have.text", "35.25");
            // cy.get(
            //     "body > app-root > div > div > pl-provider-onboarding > div > div.flexbox.columns > div.center-column.flex1 > pl-provider-onboarding-agreement > div > div.margin-large-t.grid-container > div:nth-child(2)"
            // ).should("have.text", "47.75");
            // cy.get(".primary").click();

            // Check user info
            cy.get("pl-provider-onboarding-contact-info .flexbox:nth-child(1) .flex1").should(
                "include.text",
                `${userFixture.user.first_name} ${userFixture.user.last_name}`
            );
            cy.get("pl-provider-onboarding-contact-info .flexbox:nth-child(2) .flex1").should(
                "include.text",
                "1234 camino a cualquier lugar"
            );
            cy.get("pl-provider-onboarding-contact-info .flexbox:nth-child(2) .flex1").should(
                "include.text",
                "Reno, WA, 23502"
            );
            cy.get("pl-provider-onboarding-contact-info .flexbox:nth-child(3) .flex1").should(
                "include.text",
                "555-123-4567"
            );
            cy.get("pl-provider-onboarding-contact-info .flexbox:nth-child(4) .flex1").should(
                "include.text",
                `${userFixture.user.email}`
            );
            cy.get(".primary").click();

            // Check timezone and add availability
            cy.get(".pl-provider-onboarding-availability b").should("include.text", "America/Los Angeles");
            cy.get(".primary").first().click();

            schedule.setAvailability();

            // cy.get(".x-qa-total-working-hours-text").should(
            //     "include.text",
            //     "total working hours per week, including all meetings, direct sessions, and paperwork."
            // );
            cy.get(".primary").first().click();

            // Skip qualifications
            cy.get(".primary").click();

            // Areas of Specialty
            cy.get("pl-provider-onboarding-areas-of-specialty .pl-input-checkbox-group", { timeout: 5000 }).should(
                "be.visible"
            );
            cy.get(".pl-provider-areas-of-specialty pl-input-checkbox input").first().click(); // Click fluent in other languages
            // cy.get(".pl-provider-areas-of-specialty pl-input-checkbox input").first().click(); // Click fluent in other languages again cuz once doesnt work apparently
            cy.get(".languageList", { timeout: 10000 }).should("be.visible");
            cy.get(".languageList .pl-input-checkbox-group .options .option:nth-child(12) input").click(); // Click Japanese

            // Click Aphasia checkbox
            cy.get(
                "pl-provider-onboarding > div > div.flexbox.columns > div.center-column.flex1 > pl-provider-onboarding-areas-of-specialty > div > pl-input-checkbox-group > div > div > div > div:nth-child(2) > pl-input-checkbox > div > div"
            ).click();

            // Click Literacy checkbox
            cy.get(
                "pl-provider-onboarding > div > div.flexbox.columns > div.center-column.flex1 > pl-provider-onboarding-areas-of-specialty > div > pl-input-checkbox-group > div > div > div > div:nth-child(33) > pl-input-checkbox > div > div"
            ).click();
            cy.get(".primary").click();
            cy.get(".primary").click();

            // Skip payment
            cy.get(".primary").click();

            // Go to dashboard
            cy.get(".primary").click();

            cy.contains('PresenceLearning Resources');

            util.waitForAttached('.pl-dashboard-right-column .app-item:nth-child(1)', 'profileIcon')
                .click();

            // Assertions
            onboarding.assertSelections();
        });

        it("Should verify the provider is in the correct state as a cam user", () => {
            util.setCurrentUser(util.CAM_USER);
            cy.visit("/c/");

            const userFixture = util.FIXTURE_PROVIDER_SLP_ONBOARDING;

            //navigate to the providers tab
            cy.get('[ng-reflect-router-link="/providers"]').click();

            // last name
            cy.get("pl-providers-list .x-qa-active-filters .filter input").first().type(userFixture.user.last_name);

            // first name
            cy.get("pl-providers-list .x-qa-active-filters .filter input").last().type(userFixture.user.first_name);
            cy.get(".pl-dot-loader", { timeout: 5000 }).should("exist");
            cy.get(".pl-dot-loader", { timeout: 5000 }).should("not.exist");
            cy.get("pl-table-wrapper").find("pl-table-row").should("have.length", 1);
            // navigate into the provider
            cy.get("pl-table-row pl-table-cell").first().click();

            // Assertions
            onboarding.assertSelections();
        });
    });
});
