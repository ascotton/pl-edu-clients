import util from "../../../../../support/util";
import providerOrganization from "../../../../../support/helpers/provider-organization";

const CURRENT_USER = util.PROVIDER_SLP;

context(`Regression / Organization Profile - as ${CURRENT_USER}`, () => {
    describe(`Verify Sub Nav items`, () => {
        beforeEach(() => {
            util.setApiDebug();
        });

        before(() => {
            util.setCurrentUser(CURRENT_USER);
            util.IT_SHOULD("load the landing page", () => {
                util.visit("/c/landing");
                util.waitForNetworkInactivity({ verbose: true });
            });
        });

        // TC_OP_1
        it("Should send user to landing page on login", () => {
            cy.url().should("include", "/c/landing");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_OP_1.1
        it("Should have the landing page title", () => {
            cy.title().should("eq", "Landing - PresenceLearning");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_OP_1.2 & TC_OP_1.2.2
        it("should click on the location nav item and check API request", () => {
            const ROUTE_ALIAS = "locations";
            util.interceptGql(ROUTE_ALIAS);
            util.navigateToLocation();
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_OP_1.2.1
        it("Should have the locations page title", () => {
            cy.title().should("eq", "Locations - Locations - PresenceLearning");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_OP_1.3 and TC_OP_1.3.3
        it("Should click on the first organization link and check API request", () => {
            const ROUTE_ALIAS = "organizationOverview";
            util.interceptGql(ROUTE_ALIAS);
            cy.get(".pl-locations-list pl-table-row a").first().click();
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_OP_1.3.1
        it.skip("Should have the overview page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Overview - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.3.2
        it("Should check overview subnav links", () => {
            providerOrganization.verifySubNavItems();
        });

        // TC_OP_1.4 and TC_OP_1.4.3 API
        it("should click on the clients subnav item and check API request", () => {
            const ROUTE_ALIAS = "organizationClients";
            util.interceptGql(ROUTE_ALIAS);
            providerOrganization.navigateToSubNav("Clients");
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_OP_1.4.1
        it.skip("Should have the clients page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Clients - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.4.2
        it("Should check client subnav links", () => {
            providerOrganization.verifySubNavItems();
        });

        // TC_OP_1.5 and TC_OP_1.5.3
        it("should click on providers subnav item and check API request", () => {
            const ROUTE_ALIAS = "providerProfiles";
            util.interceptGql(ROUTE_ALIAS);
            providerOrganization.navigateToSubNav("Providers");
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_OP_1.5.1
        it.skip("Should have the providers page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Providers - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.5.2
        it("Should check providers subnav links", () => {
            providerOrganization.verifySubNavItems();
        });

        // TC_OP_1.6
        it("should click on school staff subnav item and check API request", () => {
            providerOrganization.navigateToSubNav("School Staff");
        });

        // TC_OP_1.6.1
        it.skip("Should have the school staff page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `School Staff - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.6.2
        it("Should check school staff subnav links", () => {
            providerOrganization.verifySubNavItems();
        });

        // TC_OP_1.7
        it("should click on documents subnav item", () => {
            providerOrganization.navigateToSubNav("Documents");
        });

        // TC_OP_1.7.1
        it.skip("Should have the documents page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Documents - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.7.2
        it("Should check documents subnav links", () => {
            providerOrganization.verifySubNavItems();
        });

        // TC_OP_1.8
        it("should click on organization handbook subnav item", () => {
            providerOrganization.navigateToSubNav("Organization Handbook");
        });

        // TC_OP_1.8.1
        it.skip("Should have the organization handbook page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Summary - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.8.2
        it("Should check organization handbook subnav links", () => {
            providerOrganization.verifySubNavItems();
        });

        // TC_OP_1.9 and TC_OP_1.9.3
        it("should click on availability subnav item and check API request", () => {
            const ROUTE_ALIAS = "getLocationAvailabilityBlocks";
            util.interceptGql(ROUTE_ALIAS);
            providerOrganization.navigateToSubNav("Availability");
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_OP_1.9.1
        it.skip("Should have the availability page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Availability - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_OP_1.9.2
        it("Should check availability subnav links", () => {
            providerOrganization.verifySubNavItems();
        });
    });
});
