import util, { PROVIDER_TYPE, PRODUCT_TYPE } from "../../../../support/util";
import clients from "../../../../support/helpers/clients";
import schedule from "../../../../support/helpers/schedule";
import billing from "../../../../support/helpers/billing";

const CURRENT_USER = util.PROVIDER_SLP;

context(`Smoke / Provider basic smoke test - as ${CURRENT_USER}`, () => {
    const { clientLastName, clientUserId } = clients.makeRandomClientInfo();

    before(() => {
        util.setCurrentUser(CURRENT_USER);
        util.IT_SHOULD("load the clients screen", () => {
            util.visit("/c/clients");
        });
    });

    describe(`Exercise several major features of the provider app`, () => {
        it("Should perform all the steps", () => {
            cy.log(
                "---------------- provider basic smoke test ----------------",
            );
            cy.log("create referral, convert to service, create appointment");
            cy.log("document appointment, submit invoice, retract invoice");
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
                        PROVIDER_TYPE.SLP,
                        PRODUCT_TYPE.directService,
                    );
                    cy.get("button")
                        .contains("Save & Convert to Service")
                        .click();
                    util.waitForNetworkInactivity();
                },
            );
            util.IT_SHOULD("complete convert referral to service form", () => {
                clients.weeklyReferralConvertToServiceForm("Speech-Language Therapy");
            });

            util.IT_SHOULD(
                "submit the convert referral to service form",
                () => {
                    cy.get("button");
                    cy.get(".x-qa-steps-buttons-next").click();
                    cy.url().should(
                        "match",
                        /.*\/c\/service-save\/client-details/,
                    );
                    cy.get(".x-qa-steps-buttons-next").click();
                },
            );

            util.IT_SHOULD(
                "click the schedule tab and complete scheduling appt for client",
                () => {
                    cy.url().should("include", "/c/client");
                    util.navigateToSchedule();
                    cy.get(".fc-addEvent-button").click();
                    schedule.scheduleAppointment(clientLastName);
                },
            );

            util.IT_SHOULD("fill out billing information", () => {
                schedule.documentAndSignForDirectServiceAppointment();
            });

            util.IT_SHOULD("navigate to billing", () => {
                util.navigateToClients();
                util.navigateToBilling();
            });

            util.IT_SHOULD("submit invoice", () => {
                billing.invoiceSignOff();
            });

            util.IT_SHOULD("retract invoice", () => {
                billing.retractInvoice();
            });
        });
    });
});
