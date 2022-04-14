const { test } = require('@playwright/test');
const { initApp } = require('./init-app');
const util = require('./util.js');


test.describe('hello', () => {
    const { config } = initApp('EDU-CLIENTS');
    const user = config.USERS.SLP;

    test.beforeEach(({page: p1}) => {
        p1.route('**/status/*', (route) => route.fulfill(user.status));
    });

    test('Test', async ({page: p1}) => {

        // load the provider landing page
        await p1.goto(user.homepageUrl);

        // click on the Profile icon
        await p1.click(".app-item a:has-text('Profile')");
        // verify page info
        await util.verifyProviderProfilePageInfo(p1, /.*\/overview/, "Overview");

        // Check Caseload sub nav
        const titleCaseload = 'Caseload';
        util.navigateToProviderProfileSubNav(p1, titleCaseload);
        await util.waitForGql(p1, 'query ClientsList');
        await util.verifyProviderProfilePageInfo(p1, /.*\/caseload/, titleCaseload);

        // Check Locations sub nav
        const titleLocations = 'Locations';
        util.navigateToProviderProfileSubNav(p1, titleLocations);
        await util.waitForRest(p1, 'GET', '/api/v1/locations');
        await util.verifyProviderProfilePageInfo(p1, /.*\/locations/, titleLocations);

        // Check Qualifications sub nav
        const titleQualifications = 'Qualifications';
        util.navigateToProviderProfileSubNav(p1, titleQualifications);
        await util.waitForRest(p1, 'GET', '/api/v1/sfproviderqualifications');
        await util.verifyProviderProfilePageInfo(p1, /.*\/qualifications/, titleQualifications);

        // Check Qualifications sub nav
        const titleSchedule = 'Schedule';
        util.navigateToProviderProfileSubNav(p1, titleSchedule);
        await util.waitForRest(p1, 'GET', '/api/v3/appointments');
        await util.verifyPageUrlAndTitle(p1, /.*\/schedule\/calendar\?.*/, titleSchedule);
    });
});
