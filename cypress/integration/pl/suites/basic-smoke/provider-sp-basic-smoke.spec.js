import util, { PROVIDER_TYPE, PRODUCT_TYPE } from "../../../../support/util";
import clients from "../../../../support/helpers/clients";
import schedule from "../../../../support/helpers/schedule";
import billing from "../../../../support/helpers/billing";

const CURRENT_USER = util.PROVIDER_W2_PA;

context(`Smoke / Provider SP basic smoke - as ${CURRENT_USER}`, () => {
    const { clientLastName, clientUserId } = clients.makeRandomClientInfo();

    before(() => {
        util.setCurrentUser(CURRENT_USER);
        util.IT_SHOULD("load the clients screen", () => {
            util.visit("/c/clients");
        });
        cy.intercept('GET', '**/api/v1/timesheet/preview').as('timesheetPreview');
        cy.intercept('PUT', '**/api/v1/timesheet/*/retract').as('retractTimesheet');
    });

    describe(`Exercise several major features of the provider app`, () => {
        it("Should perform all the steps", () => {
            cy.log(
                "---------------- provider sp basic smoke test ----------------",
            );
            cy.log("create referral, convert to service, create appointment");
            cy.log("document appointment, submit timesheet, retract timesheet");
            cy.log(
                "-----------------------------------------------------------",
            );

            util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });

            util.IT_SHOULD("click the All Clients tab", () => {
                util.navigateToAllClientsTab();
            });

            util.IT_SHOULD("click the Add Referral button", () => {
                cy.get("button").contains("Add a Single Referral").click();
                util.waitForNetworkInactivity();
            });

            util.IT_SHOULD(
                "complete and submit the add new client form",
                () => {
                    clients.addClient(
                        "Test",
                        clientLastName,
                        clientUserId,
                        "10/10/2001",
                    );
                },
            );

            util.IT_SHOULD(
                "complete and submit the referral form for the new client",
                () => {
                    clients.createReferralForm(
                        PROVIDER_TYPE.PA,
                        PRODUCT_TYPE.evaluation,
                    );
                    cy.get("button").contains("Save Referral").click();
                    util.waitForNetworkInactivity();
                },
            );
            util.IT_SHOULD("complete convert referral to service form", () => {
                util.navigateToClients();
                cy.get("pl-table-row").contains(clientLastName).click();
                cy.get(".expand-button").click();
                cy.get("button").contains("Convert to Service").click();
                clients.weeklyReferralConvertToServiceForm(
                    "Psychoeducational Assessment",
                );
            });

            util.IT_SHOULD(
                "submit the convert referral to service form",
                () => {
                    cy.get(".x-qa-steps-buttons-next").click();
                    cy.url().should("match", /.*\/c\/service-save/);
                    cy.get(".x-qa-steps-buttons-next").click();
                    cy.get(".x-qa-steps-buttons-next").click();
                },
            );

            util.IT_SHOULD(
                "click the schedule tab and complete scheduling appt for client",
                () => {
                    cy.url().should("include", "/c/client");
                    util.navigateToSchedule();
                    cy.get(".fc-addEvent-button").click();
                    schedule.scheduleAppointment(clientLastName, { documentAfterSave: false, isProviderPA: true });
                    util.waitForNetworkInactivity({ verbose: true });
                },
            );

            util.IT_SHOULD("select create service and document", () => {
                util.navigateToSchedule();
                cy.get(".fc-event")
                    .contains(clientLastName)
                    .parent()
                    .parent()
                    .click();
                cy.get("button.button-document").contains("Document").click();
                util.waitForNetworkInactivity({ verbose: true });
                schedule.documentAndSignForSpProviderService();
                util.waitForNetworkInactivity({ verbose: true });
            });

            util.IT_SHOULD("navigate to billing", () => {
                util.navigateToClients();
                util.navigateToBilling();
            });

            util.IT_SHOULD("submit invoice", () => {
                billing.invoiceSignOff(true);
            });

            util.IT_SHOULD("retract invoice", () => {
                billing.retractInvoice(true);
            });
        });
    });
});
