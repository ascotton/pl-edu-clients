import util from "../../../../../support/util";
import providerLocation from "../../../../../support/helpers/provider-location";

const CURRENT_USER = util.PROVIDER_SLP;

context(`Regression / Location Profile - as ${CURRENT_USER}`, () => {
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

        // TC_LP_1
        it("Should send user to landing page on login", () => {
            cy.url().should("include", "/c/landing");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_LP_1.1
        it("Should have the landing page title", () => {
            cy.title().should("eq", "Landing - PresenceLearning");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_LP_1.2 & TC_LP_1.2.2
        it("should click on the location nav item and check API request", () => {
            const ROUTE_ALIAS = "locations";
            util.interceptGql(ROUTE_ALIAS);
            util.navigateToLocation();
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_LP_1.2.1
        it("Should have the locations page title", () => {
            cy.title().should("eq", "Locations - Locations - PresenceLearning");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_LP_1.3 and TC_LP_1.3.3
        it("Should click on the first location link and check API request", () => {
            const ROUTE_ALIAS = "Location";
            util.interceptGql(ROUTE_ALIAS);
            cy.get(".pl-locations-list pl-table-row a[href*='/c/location']").first().click();
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_LP_1.3.1
        it.skip("Should have the overview page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Overview - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.3.2
        it("Should check overview subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.4 and TC_LP_1.4.3 API
        it("should click on the clients subnav item and check API request", () => {
            const ROUTE_ALIAS = "locationClients";
            util.interceptGql(ROUTE_ALIAS);
            providerLocation.navigateToSubNav("Clients");
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_LP_1.4.1
        it.skip("Should have the clients page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Clients - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.4.2
        it("Should check client subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.5 and TC_LP_1.5.3
        it("should click on providers subnav item and check API request", () => {
            const ROUTE_ALIAS = "providerProfiles";
            util.interceptGql(ROUTE_ALIAS);
            providerLocation.navigateToSubNav("Providers");
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_LP_1.5.1
        it.skip("Should have the providers page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Providers - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.5.2
        it("Should check providers subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.6
        it("should click on school staff subnav item and check API request", () => {
            providerLocation.navigateToSubNav("School Staff");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_LP_1.6.1
        it.skip("Should have the school staff page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `School Staff - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.6.2
        it("Should check school staff subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.7
        it("should click on documents subnav item", () => {
            providerLocation.navigateToSubNav("Documents");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_LP_1.7.1
        it.skip("Should have the documents page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Documents - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.7.2
        it("Should check documents subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.8
        it("should click on organization handbook subnav item", () => {
            providerLocation.navigateToSubNav("Organization Handbook");
        });

        // TC_LP_1.8.1
        it.skip("Should have the organization handbook page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Summary - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.8.2
        it("Should check organization handbook subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.9 and TC_LP_1.9.3
        it("should click on availability subnav item and check API request", () => {
            const ROUTE_ALIAS = "getLocationAvailabilityBlocks";
            util.interceptGql(ROUTE_ALIAS);
            providerLocation.navigateToSubNav("Availability");
            util.waitForGql(ROUTE_ALIAS);
        });

        // TC_LP_1.9.1
        it.skip("Should have the availability page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Availability - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.9.2
        it("Should check availability subnav links", () => {
            providerLocation.verifySubNavItems();
        });

        // TC_LP_1.10
        it("should click on scheduler subnav item and check API request", () => {
            providerLocation.navigateToSubNav("Scheduler");
            util.waitForNetworkInactivity({ verbose: true });
        });

        // TC_LP_1.10.1
        it.skip("Should have the scheduler page title", () => {
            cy.get("h1")
                .invoke("text")
                .then((location) => {
                    cy.title().should("eq", `Scheduler - ${location} - PresenceLearning`);
                    util.waitForNetworkInactivity({ verbose: true });
                });
        });

        // TC_LP_1.10.2
        it("Should check scheduler subnav links", () => {
            providerLocation.verifySubNavItems();
        });
    });
});
