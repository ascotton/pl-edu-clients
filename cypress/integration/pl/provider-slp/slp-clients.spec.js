context('Clients', () => {
    const user = 'provider-slp';

    describe(`Clients - test page load - as ${user}`, () => {
        before(() => {
            cy.server().route('**/status/**', `fixture:transient/${user}.json`).as(user);
            cy.visit('/c/clients');
        });

        const labelAllClients = 'All Clients';
        it(`should have page tab "${labelAllClients}" that is not the active tab`, () => {
            cy.get('pl-link:not(.active)').contains(labelAllClients);
            return cy.wait(0);
        });

        const labelMyCaseload = 'My Caseload';
        it(`should have page tab "${labelMyCaseload}" that is the active tab`, () => {
            cy.get('pl-link.active').contains(labelMyCaseload);
            return cy.wait(0);
        });
    });
});
