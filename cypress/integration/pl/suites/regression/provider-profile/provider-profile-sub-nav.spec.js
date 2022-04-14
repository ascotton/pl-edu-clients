import util from "../../../../../support/util";
import providerProfile from "../../../../../support/helpers/provider-profile";
import schedule from "../../../../../support/helpers/schedule";

const CURRENT_USER = util.PROVIDER_SLP;

context(`Regression / Provider Profile - as ${CURRENT_USER}`, () => {

    describe(`Verify Sub Nav items`, () => {

        beforeEach(() => {
            util.setApiDebug();
        });

        before(() => {
            util.setCurrentUser(CURRENT_USER);
            util.IT_SHOULD("load the landing page", () => {
                util.visit("/c/landing");
                util.waitForNetworkInactivity({verbose: true});
            });
        });

        // TC_PP_1
        it("should click on the profile icon", () => {
            cy.get(".app-item a").contains("Profile").click();
            util.waitForNetworkInactivity({verbose: true});
        });

        util.group("test provider profile page case steps",() => {

            // TC_PP_1.1
            it('should be on the Provider Overview page', () => {
                cy.url().should("match", /.*\/c\/provider\/.*\/overview/);
            });

            // TC_PP_1.1.1
            it("should have page title Overview", () => {
                cy.title().should("have.string", "Overview - PresenceLearning");
            });

            // TC_PP_1.1.2
            it("should check subnav...", () => {
                providerProfile.verifySubNavItems();
            });

            // TC_PP_1.2.0
            // TC_PP_1.2.3
            it('should click on the Caseload subnav', () => {
                const ROUTE_ALIAS = 'ClientsList';
                util.interceptGql(ROUTE_ALIAS)
                providerProfile.navigateToSubNav('Caseload');
                util.waitForGql(ROUTE_ALIAS);
                util.waitForNetworkInactivity();
            });

            // TC_PP_1.2.1
            it('should be on the Provider Caseload page', () => {
                cy.url().should("match", /.*\/c\/provider\/.*\/caseload/);
            });

            // TC_PP_1.2.1
            it("should have page title Caseload", () => {
                cy.title().should("have.string", "Caseload - PresenceLearning");
            });

            // TC_PP_1.2.2
            it("should check subnav...", () => {
                providerProfile.verifySubNavItems();
            });

            // TC_PP_1.3.0
            it('should click on the Locations subnav', () => {
                providerProfile.navigateToSubNav('Locations');
            });

            it("should check Locations API", () => {
                util.interceptAndWaitForRest('GET', /\/api\/v1\/locations\//, 'Locations');
                util.waitForNetworkInactivity();
            });

            // TC_PP_1.3.1
            it('should be on the Provider Locations page', () => {
                cy.url().should("match", /.*\/c\/provider\/.*\/locations/);
            });

            // TC_PP_1.3.2
            it("should have page title Locations", () => {
                cy.title().should("have.string", "Locations - PresenceLearning");
            });

            // TC_PP_1.3.3
            it("should check subnav...", () => {
                providerProfile.verifySubNavItems();
            });

            // TC_PP_1.4.0
            it('should click on the Qualifications subnav', () => {
                const ROUTE_ALIAS = 'Qualifications';
                util.interceptRest('GET', /\/api\/v1\/sfproviderqualifications\/.*/, ROUTE_ALIAS);
                providerProfile.navigateToSubNav('Qualifications');
                util.waitForRest(ROUTE_ALIAS);
                util.waitForNetworkInactivity();
            });

            // TC_PP_1.4.1
            it('should be on the Provider Qualifications page', () => {
                cy.url().should("match", /.*\/c\/provider\/.*\/qualifications/);
            });

            // TC_PP_1.4.2
            it("should have page title Qualifications", () => {
                cy.title().should("have.string", "Qualifications - PresenceLearning");
            });

            // TC_PP_1.4.3
            it("should check subnav...", () => {
                providerProfile.verifySubNavItems();
            });

            // TC_PP_1.5.0
            it('should click on the Schedule subnav', () => {
                const ROUTE_ALIAS = 'Appointments';
                util.interceptRest('GET', /\/api\/v3\/appointments\/.*/, ROUTE_ALIAS);
                providerProfile.navigateToSubNav('Schedule');
                util.waitForRest(ROUTE_ALIAS);
            });

            // TC_PP_1.5.1
            it('should be on the Provider Schedule page', () => {
                cy.url().should("match", /.*\/c\/schedule\/calendar\?.*/);
            });

            // TC_PP_1.4.2
            it("should have page title Schedule", () => {
                cy.title().should("have.string", "Schedule - PresenceLearning");
            });

            it("should check subnav", () => {
                schedule.verifySubNavItems();
            });
        });
    });
});
