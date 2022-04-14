const { test } = require('@playwright/test');
const { initApp } = require('./init-app');
const util = require('./util.js');

const clientLastName = `T-${Math.random()}`;
const clientUserId = `T-${Math.random()}`;

test.describe('hello', () => {
    const { config } = initApp('EDU-CLIENTS');
    const user = config.USERS.SLP;

    test.beforeEach(({page: p1}) => {
        p1.route('**/status/*', (route) => route.fulfill(user.status));
    });

    test('Test', async ({page: p1}) => {

        // load the app at the clients screen
        await p1.goto(user.clientsUrl);

        // click the All Clients tab
        await util.navigateToAllClientsTab(p1);

        // click the Add Referral button
        await p1.click("button:has-text('Add a Single Referral')");

        // complete & submit add new client form
        await util.addClientForm(p1, clientLastName, clientUserId);

        // complete & submit the referral form for the new client
        await util.submitReferralForm(p1);

        // complete convert referral to service form
        await util.convertReferralForm(p1);

        // submit the convert referral to service form
        await util.submitConvertToServiceForm(p1);

        // click the schedule page, create appointment, document appointment
        await util.navigateToSchedule(p1);
        await p1.click("button:has-text('+ Add Event')");
        await util.scheduleAppointmentForm(p1, clientLastName);
        await util.documentAndSignForDirectServiceAppointment(p1);

        // navigate to billing page, submit invoice, retract invoice
        await util.navigateToBilling(p1);
        await util.submitInvoice(p1);
        await util.retractInvoice(p1);
    });
});
