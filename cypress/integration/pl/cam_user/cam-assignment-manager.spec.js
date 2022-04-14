context('Assignment Manager Feature', () => {
    const user = 'cam_user';

    describe(`Assignment Manager - test page load - as ${user}`, () => {
        before(() => {
            cy.server().route('**/status/**', `fixture:transient/${user}.json`).as(user);
            cy.visit('/c/assignment-manager');
        });
        it('should have a checkbox filter labeled "My Accounts Only"', () => {
            const checkboxLabels = 'pl-input-checkbox-group label';
            cy.get(checkboxLabels)
                .eq(0)
                .contains('My Accounts Only');

            return cy.wait(0)
        });
    });
});
