import "cypress-wait-until";

import {
    PROVIDER_SLP,
    PROVIDER_OT,
    PROVIDER_MHP,
    PROVIDER_PA,
    PROVIDER_W2_PA,
    PROVIDER_SLP_ONBOARDING,
    CAM_USER,
    CAM_BILLING_USER,
    SERVICE_AND_SUPPORT,
} from "./users";

import FIXTURE_PROVIDER_SLP from "../fixtures/transient/provider-slp.json";
import FIXTURE_PROVIDER_OT from "../fixtures/transient/provider-ot.json";
import FIXTURE_PROVIDER_MHP from "../fixtures/transient/provider-mhp.json";
import FIXTURE_PROVIDER_PA from "../fixtures/transient/provider-pa.json";

import FIXTURE_PROVIDER_SLP_ONBOARDING from "../fixtures/transient/provider-slp-onboarding.json";

import FIXTURE_CAM_USER from "../fixtures/transient/cam_user.json";
import FIXTURE_CAM_BILLING_USER from "../fixtures/transient/cam_billing_user.json";
import FIXTURE_CUSTOMER_ADMIN from "../fixtures/transient/customer_admin.json";
import FIXTURE_SERVICE_AND_SUPPORT from "../fixtures/transient/service-and-support.json";

export const PROVIDER_TYPE = {
    SLP: "slp",
    OT: "ot",
    MHP: "mhp",
    PA: "pa",
};

export const PRODUCT_TYPE = {
    directService: "direct_service",
    evaluation: "evaluation_with_assessments",
    supervision: "supervision",
    behaviorInterventionGroup: "groupbmh_bi",
    traumaInformedGroup: "groupbmh_ti",
};

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function getRandomString(length) {
    var randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var result = "";

    for (var i = 0; i < length; i++) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    return result;
}

function currentDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + "/" + dd + "/" + yyyy;

    return today;
}

function waitForAttached(selector, alias, timeout = 1000) {
    cy.wait(timeout);
    return cy
        .get(selector)
        .as(alias)
        .should(($el) => Cypress.dom.isAttached($el))
        .get(`@${alias}`);
}

function waitForNetworkInactivity(
    opts = { verbose: false, interval: null, timeout: null, description: null, initialWait: 0 }
) {
    const description = opts.description ? ` - 🔆 ${opts.description}` : "";
    const initialWait = opts.initialWait ? ` - initialWait: ${opts.initialWait}` : "";

    if (isCypressDebugOn()) {
        cy.log(`[ waiting--for--network${initialWait} ]${description}`);
    }
    let firstInterval = true;

    const config = {
        timeout: opts.timeout || 30000,
        interval: opts.interval || 500,
        verbose: opts.verbose,
    };

    let initialWaitCount = opts.initialWait ? opts.initialWait / opts.interval : 0;

    cy.waitUntil(() => {
        if (initialWaitCount > 0) {
            initialWaitCount--;
            return false;
        }

        const now = Date.now();

        const lastGqlCount = +localStorage.getItem("PL_LAST_GQL_COUNT");
        const lastGqlTime = +localStorage.getItem("PL_LAST_GQL_TIME");
        const lastRestCount = +localStorage.getItem("PL_LAST_REST_COUNT");
        const lastRestTime = +localStorage.getItem("PL_LAST_REST_TIME");

        const lastRequestCount = lastGqlCount + lastRestCount;
        const lastRequestTime = Math.min(lastGqlTime, lastRestTime);

        const duration = !lastRequestTime && firstInterval ? 0 : now - lastRequestTime;
        const result = lastRequestCount === 0 && duration > 2000;

        if (isCypressDebugOn()) {
            console.log(`[ WAIT FOR NETWORK ]${description}`, {
                result,
                lastRequestCount,
                lastRequestTime,
                firstInterval,
                duration,
                opts,
            });
        }
        firstInterval = false;
        return result;
    }, config);
}

function setCurrentUser(user) {
    cy.intercept("**/status/**", { fixture: `transient/${user}.json` }).as(`${user}`);
}

function selectOption(selector, optionLabel) {
    cy.get(`${selector} .select-and-options`).click();
    cy.get(`${selector} .option`).contains(optionLabel).click();
}

function closeToastPopupDialog() {
    cy.get(".pl-toast .close-icon").click();
    cy.get(".pl-toast .success").should("not.exist");
}

function deleteDownloadsFolder() {
    const downloadsFolder = Cypress.config("downloadsFolder");
    cy.task("deleteFolder", downloadsFolder).then(() => {
        cy.log("Downloads folder deleted");
    });
}

function navigateToProviderHomePage() {
    cy.get(".topbar-logo").click();
    cy.url().should("include", "/c/landing");
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToClients() {
    cy.get(".pl-app-nav-links a[href='/c/client']").click();
    cy.url().should("include", "/c/client");
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToLocation() {
    cy.get(".pl-app-nav-links a[href='/c/location']").click();
    cy.url().should("include", "/c/location");
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToSchedule() {
    cy.get(".pl-app-nav-links a[href='/c/schedule']").click();
    cy.url().should("include", "/c/schedule");
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToBilling() {
    cy.get(".pl-app-nav-links a[href='/c/billing']").click();
    cy.url().should("include", "/c/billing");
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToAllClientsTab() {
    cy.get(".pl-tabs a[data-label='All Clients']").click();
    cy.url().should("include", "/c/client/list/all-clients");
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToClientServicesTab() {
    cy.get(".pl-tabs").contains("Services").click();
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function navigateToClientDocumentsTab() {
    cy.get(".pl-tabs").contains("Documents").click();
    waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
}

function ignoreBadGatewayError() {
    window.localStorage.setItem("PL_SUPPRESS_502", 1);
}

function IT_SHOULD(itShouldDescription, fn) {
    cy.log(`🔸🔸 [ Should ${itShouldDescription} ]`);
    fn && fn();
}

function xIT_SHOULD(itShouldDescription) {
    cy.log(`🔴 🔴 [ SKIPPED -- ${itShouldDescription} ]`);
}

function setGqlIntercepts(apiCalls) {
    cy.intercept("POST", "**/graphql/**", (req) => {
        apiCalls.queries &&
            apiCalls.queries.forEach((item) => {
                aliasQuery(req, item);
            });
        apiCalls.mutations &&
            apiCalls.mutations.forEach((item) => {
                aliasMutation(req, item);
            });
    }).as("gql");
}

function setCypressDebug() {
    const DEBUG = isCypressDebugOn();
    if (DEBUG) {
        localStorage.setItem("PL_CYPRESS_DEBUG", 1);
    }
    console.log(`CYPRESS debug is ${DEBUG ? "ON" : "OFF"}`);
}

function setApiDebug() {
    const DEBUG = isApiDebugOn();
    if (DEBUG) {
        localStorage.setItem("PL_API_DEBUG", 1);
    }
    console.log(`API debug is ${DEBUG ? "ON" : "OFF"}`);
}

function isCypressDebugOn() {
    return !!Cypress.env("PL_CYPRESS_DEBUG");
}

function isApiDebugOn() {
    return !!Cypress.env("PL_API_DEBUG");
}

function interceptGql(name) {
    setGqlIntercepts({
        queries: [name],
    });
}

function waitForGql(name) {
    cy.wait(`@${name}Query`);
}

function interceptAndWaitForGql(name) {
    setGqlIntercepts({
        queries: [name],
    });
    cy.wait(`@${name}Query`);
}

function interceptRest(method, routeMatcher, name) {
    cy.intercept(method, routeMatcher).as(`${name}`);
}

function waitForRest(name) {
    cy.wait(`@${name}`);
}

function interceptAndWaitForRest(method, routeMatcher, name) {
    cy.intercept(method, routeMatcher).as(`${name}`);
    cy.wait(`@${name}`);
}

function setNetworkAliases() {
    setGqlIntercepts({
        queries: [
            "tasks",
            "loadAllLocations",
            "ClientsList",
            "ClientsSingleReferral",
            "ProviderTypes",
            "ClientServicesServices",
            "ClientServicesReferrals",
            "Client",
            "ClientsList",
            "ClientsCount",
            "IEPs",
            "FTEHours",
            "loadAllSchoolYears",
            "ProviderAvailability",
        ],
        mutations: ["createOrUpdateReferral", "createDirectService", "serviceSaveUpdateClient"],
    });

    cy.intercept("GET", "**/v1/clients").as("clientsQuery");
}

function visit(path) {
    cy.visit(path, {
        onBeforeLoad(win) {
            cy.stub(win.console, "log").as("consoleLog");
            setDebugConfig();
        },
    });
}

function setDebugConfig() {
    setCypressDebug();
    setApiDebug();
}

const aliasRestQuery = (req, alias) => {
    req.alias = `${alias}Query`;
};

function group(description, testBlock) {
    if (!testBlock) return;
    it(`🔰 START ${description}`);
    testBlock();
    it(`🔰 END ${description}`);
}

export default {
    IT_SHOULD,
    xIT_SHOULD,

    uuidv4,
    getRandomString,
    currentDate,
    setCurrentUser,
    selectOption,
    waitForAttached,
    ignoreBadGatewayError,
    waitForNetworkInactivity,
    setNetworkAliases,
    setGqlIntercepts,
    closeToastPopupDialog,
    deleteDownloadsFolder,

    setCypressDebug,
    setApiDebug,

    isCypressDebugOn,
    isApiDebugOn,

    navigateToProviderHomePage,
    navigateToClients,
    navigateToLocation,
    navigateToSchedule,
    navigateToBilling,
    navigateToAllClientsTab,
    navigateToClientServicesTab,
    navigateToClientDocumentsTab,

    visit,
    setDebugConfig,
    aliasRestQuery,
    interceptGql,
    waitForGql,
    interceptAndWaitForGql,
    waitForRest,
    interceptRest,
    interceptAndWaitForRest,

    group,

    PROVIDER_SLP,
    PROVIDER_OT,
    PROVIDER_MHP,
    PROVIDER_PA,
    PROVIDER_W2_PA,
    SERVICE_AND_SUPPORT,
    PROVIDER_SLP_ONBOARDING,
    CAM_USER,
    CAM_BILLING_USER,

    FIXTURE_PROVIDER_SLP,
    FIXTURE_PROVIDER_OT,
    FIXTURE_PROVIDER_MHP,
    FIXTURE_PROVIDER_PA,
    FIXTURE_PROVIDER_SLP_ONBOARDING,
    FIXTURE_CAM_USER,
    FIXTURE_CAM_BILLING_USER,
    FIXTURE_CUSTOMER_ADMIN,
    FIXTURE_SERVICE_AND_SUPPORT,
    FIXTURE_CUSTOMER_ADMIN,
};

// --------- graphql utils
// Utility to match GraphQL mutation based on the operation name
export const hasOperationName = (req, operationName) => {
    const { body } = req;
    return body.hasOwnProperty("operationName") && body.operationName === operationName;
};

// Alias query if operationName matches
export const aliasQuery = (req, operationName) => {
    if (hasOperationName(req, operationName)) {
        req.alias = `${operationName}Query`;
    }
};

// Alias mutation if operationName matches
export const aliasMutation = (req, operationName) => {
    if (hasOperationName(req, operationName)) {
        req.alias = `${operationName}Mutation`;
    }
};
