import moment from "moment";
import { createMetric } from "../../../support/clients/clients";
import userTypes from "../../../support/user_types";

context("Manage an IEP", () => {
    describe(`Create goal - as ${userTypes.providerSlp}`, () => {
        it("Should create an IEP for a client", () => {
            cy.server()
                .route("**/status/**", `fixture:transient/${userTypes.providerSlp}.json`)
                .as(userTypes.providerSlp);
            cy.visit("/c/clients");
            //Create a client here and search for it before doing
            // Add an active IEP for this year and a future one for next year
            cy.get("pl-table-cell").last().click();

            // Add IEP
            cy.get(".pl-client-iep-tab button").click();
            cy.get(".date-fields:nth-child(4) .date-input input").first().type(moment().format("MM/DD/YYYY"));
            cy.get(".date-fields:nth-child(4) .date-input:nth-child(2) input").type(
                moment().add(1, "year").format("MM/DD/YYYY")
            );

            //Triennial dates
            cy.get(".date-fields:nth-child(5) .date-input input")
                .first()
                .type(moment().subtract(1, "year").format("MM/DD/YYYY"));
            cy.get(".date-fields:nth-child(5) .date-input:nth-child(2) input").type(
                moment().add(2, "years").format("MM/DD/YYYY")
            );
            cy.get(".container").click();
            cy.get(".action-save").click();

            // Confirm IEP added
            cy.get(".future-iep .iep-columns .title").should("include.text", "Future");
            cy.get(".future-iep .iep-columns .title").should(
                "include.text",
                `${moment().format("MM/DD/YYYY")} - ${moment().add(1, "year").format("MM/DD/YYYY")}`
            );
        });

        it("Should add a metric to an existing goal", () => {
            cy.get(".goal-header .col:nth-child(2) pl-icon").first().click();

            createMetric();
        });

        it("Should remove a metric to an existing goal", () => {
            cy.get(".goal-header .col:nth-child(2) pl-icon").first().click();

            cy.get(".delete-metric-button").first().click();
            cy.get(".delete-metric-button").first().should("have.text", "Restore");

            cy.get(".save-goal-button").first().click();
            cy.get(".metrics-item").should("not.exist");
        });

        it("Should remove IEP from client", () => {
            cy.get(".remove-iep-button").click();
            cy.get(".future-iep").should("not.exist");
        });

        it("Should remove Goal from an existing IEP", () => {
            cy.get(".goal-header .col:nth-child(2) pl-icon:nth-child(2)").click();
            cy.get(".x-qa-dialog-primary-button").click();
            cy.get(".empty-goals-instructions").should("include.text", "Copy your goals from your IEP");
        });

        it("Should create a Goal for an existing IEP", () => {
            cy.get(".add-goal-button").click();
            cy.get(".goal-status-select .select-and-options").click();
            cy.get(".options-container .option:nth-child(3)").click();
            cy.get(".iep-textarea textarea").type("Goal partially completed.");

            createMetric();

            // Check goal was added
            cy.get(".goal-content > div:nth-child(2) > div > div > div").should("include.text", "Matric message.");
            cy.get(".metrics-item").should("include.text", "Cypress metric.");
            cy.get(".metrics-item").should("include.text", "80%");
        });

        it("Should complete current goal", () => {
            cy.get(".goal-status-select .select-and-options").click();
            cy.get(".options-container .option:nth-child(4)").click();

            cy.get(".goal-status-bars").find(".green").should("have.length", 4);
        });

        it("Should end current IEP", () => {
            cy.get(".end-iep-button").click();
            cy.get(".goal-status-bars").find(".green").should("have.length", 4);

            cy.get(".primary").click();
            cy.get(".primary").click();

            cy.get(".header-toggle").should("include.text", "(ENDED)");
        });
    });
});
