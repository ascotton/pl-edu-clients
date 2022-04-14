const { expect } = require('@playwright/test');

const UTIL = {
    addClientForm: async (p1, clientLastName, clientUserId) => {
        await p1.fill(".x-qa-last-name input", clientLastName);
        await p1.fill(".x-qa-first-name input", 'TEST');
        await p1.fill(".x-qa-external-id input", clientUserId);
        await p1.fill(".x-qa-birthday input", "10/10/2001");
        await p1.click(".x-qa-organization-select");
        await p1.click(".x-qa-organization-select .option:nth-child(1)");
        await p1.click(".x-qa-location-select");
        await p1.click(".x-qa-location-select .option:nth-child(1)");
        await p1.click("button.add-client-button:not([disabled])");
    },
    submitReferralForm: async (p1) => {
        await p1.click(`.x-qa-provider-type input.x-qa-slp`);
        await p1.click(`.x-qa-product-type input.x-qa-direct_service`);
        await p1.click("button:has-text('Save & Convert to Service')");
    },
    convertReferralForm: async (p1) => {
        await p1.url().includes("/service-save/identify");
        await p1.click(".pl-toast .close-icon");
        await p1.click(".x-qa-service .select-and-options");
        await p1.click(".x-qa-service .option:has-text('Speech-Language Therapy')");
        await p1.fill(".x-qa-input-session-duration input", "20");
        await p1.fill(".x-qa-input-session-frequency input", "2");
        await p1.click(".x-qa-session-interval .select-and-options");
        await p1.click(".x-qa-session-interval .option:has-text('Weekly')");
        await p1.fill("pl-input-datepicker:nth-child(1) pl-input-text input", '10/10/2022');
        await p1.fill(".x-qa-minutes-required-input input", "0");
    },
    submitConvertToServiceForm: async (p1) => {
        await p1.click("button.x-qa-steps-buttons-next");
        await p1.url().includes("/service-save/client-details");
        await p1.click("button.x-qa-steps-buttons-next");
        // order of operations
        await UTIL.waitForGql(p1, 'mutation serviceSaveUpdateClient');
    },
    scheduleAppointmentForm: async (p1, clientLastName, documentAfterSave=true) => {
        await p1.click("pl-input-time-double[options='timeOptsStart']");
        await p1.click("pl-input-time-double[options='timeOptsStart'] .option-hr:has-text('09')");

        await p1.click("pl-input-time-double[options='timeOptsStart']");
        await p1.click("pl-input-time-double[options='timeOptsStart'] .option-min:has-text('30')");

        await p1.click("pl-input-time-double[options='timeOptsStart']");
        await p1.click("pl-input-time-double[options='timeOptsStart'] .option-meridiem:has-text('AM')");

        const CLIENTS_DROPDOWN_SELECTOR = "pl-input-search-below[label='Clients'] .select-and-options";
        // Click into the client search and type the user created above
        await p1.click(`${CLIENTS_DROPDOWN_SELECTOR}`);
        await p1.click(`${CLIENTS_DROPDOWN_SELECTOR} .option:has-text('${clientLastName}')`);

        if (documentAfterSave) {
            await p1.click("button:has-text('Save & Document')");
        } else {
            await p1.click("button:has-text('Save & Exit')");
        }
    },
    documentAndSignForDirectServiceAppointment: async (p1) => {
        await p1.click(".soap-tab:has-text('S')");
        await p1.fill("#soap_note_subjective textarea", "Test Notes");

        await p1.click(".soap-tab:has-text('O')");
        await p1.fill("#soap_note_objective textarea", "Test Notes for Objective");

        await p1.click(".soap-tab:has-text('A')");
        await p1.fill("#soap_note_assessment textarea", "Test Notes for Assessment");

        await p1.click(".soap-tab:has-text('P')");
        await p1.fill("#soap_note_plan textarea", "Test Notes for Planning");

        await p1.fill("#general-notes textarea", "Generic Notes");

        await p1.click(".signoff input");
        await p1.click(".save-and-exit");
        // order of operations - after signing, allow GET invoices/preview to complete before navigating to billing
        UTIL.waitForRest(p1, 'GET', '/api/v3/invoices/preview');
    },
    submitInvoice: async (p1) => {
        await p1.click(".invoice-info button:has-text('Preview Invoice')");
        await expect(p1.locator("text=Your Invoice has not been submitted")).toHaveCount(1);
        await p1.click(".sign-off input[type='checkbox']");
        await p1.click(".header-submit button:has-text('Submit')");
        await p1.click(".pl-toast .close-icon");
    },
    retractInvoice: async (p1) => {
        await p1.click(".pl-past-billings input[type='checkbox']");
        await p1.click(".body-row:has-text('Submitted')");
        await p1.click(".pl-billing-preview button:has-text('Retract Invoice')");
        await p1.click(".pl-toast .close-icon");
    },
    navigateToSchedule: async (p1) => {
        await p1.click(".x-qa-page-links >> div:has-text('Schedule')");
    },
    navigateToBilling: async (p1) => {
        await p1.click(".x-qa-page-links a[href='/c/billing']");
    },
    navigateToAllClientsTab: async(p1) => {
        await p1.click(".pl-tabs a[data-label='All Clients']");
    },
    navigateToProviderProfileSubNav: async(p1, name) => {
        await p1.click(`.pl-tabs pl-link:has-text('${name}')`);
    },
    verifyProviderProfilePageInfo: async(p1, url, tabName) => {
        await UTIL.verifyPageUrlAndTitle(p1, url, tabName);
        // check that tab is active
        await expect(p1.locator(`.pl-tabs pl-link:has-text("${tabName}")`)).toHaveClass(/active/);
        await UTIL.verifyProviderProfileSubNavs(p1);
    },
    verifyPageUrlAndTitle: async(p1, url, name) => {
        // check that the page url is correct
        await p1.url().match(url);
        // check that the page title is correct
        await p1.title().then(title => title.includes(`${name} - PresenceLearning`));
    },
    verifyProviderProfileSubNavs: async(p1) => {
        const navItems = ['Overview', 'Caseload', 'Locations', 'Qualifications', 'Schedule'];
        await expect((await p1.locator(".pl-tabs pl-link").count())).toBe(navItems.length);
        await navItems.forEach(async (navItem, index) => {
            await p1.locator(`.pl-tabs pl-link:nth-child(${index+1}):has-text(${navItem})`);
        });
    },
    waitForRest: async(p1, method, url) => {
        await p1.waitForRequest( req =>
            req.url().includes(url)
                && req.method() === method
                && req.response()
        );
    },
    waitForGql: async(p1, query) => {
        await p1.waitForRequest( req =>
            req.url().includes('/graphql/v1/')
                && req.postDataJSON().query.startsWith(query)
                && req.response()
        );
    }
}

module.exports = UTIL;