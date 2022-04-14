import util from '../util';

// providers are W2 (full-time-equivalent) or 1099 (contractor)
function invoiceSignOff(isW2Provider = false) {
    util.waitForNetworkInactivity({verbose: true, initialWait: 2000});
    if (isW2Provider) {
        util.navigateToSchedule()
        util.navigateToBilling()
        cy.get('.invoice-info button').contains('Preview Timesheet').click();
        cy.contains('Your Timesheet has not been submitted');
    }
    else {
        cy.get('.invoice-info button').contains('Preview Invoice').click();
        cy.contains('Your Invoice has not been submitted');
    }


    cy.get('.sign-off input[type="checkbox"]').click();
    cy.get('.header-submit button').contains('Submit').click();
    util.waitForNetworkInactivity();
}

// providers are W2 (full-time-equivalent) or 1099 (contractor)
function retractInvoice(isW2Provider = false) {
    cy.get('.pl-past-billings input[type="checkbox"]').click();
    cy.get('.body-row').contains('Submitted').click();
    if (isW2Provider) {
        cy.get('.pl-billing-preview button').contains('Retract Timesheet').click();
        cy.wait(['@retractTimesheet', '@timesheetPreview']);
        cy.get('.invoice-info button').contains('Preview Timesheet');
        cy.url().should('include', '/c/billing/billings');
    } else {
        cy.get('.pl-billing-preview button').contains('Retract Invoice').click();
        cy.get('.invoice-info button').contains('Preview Invoice');
        util.waitForNetworkInactivity();
        cy.url().should('include', '/c/billing/billings');
    }
}

export default {
    invoiceSignOff,
    retractInvoice,
}