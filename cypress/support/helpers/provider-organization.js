import util from "../util";

function verifySubNavItems() {
    const navItems = [
        "Overview",
        "Clients",
        "Providers",
        "School Staff",
        "Documents",
        "Organization Handbook",
        "Availability",
    ];

    util.IT_SHOULD(`should have ${navItems.length} subnav items`, () => {
        cy.get(".pl-tabs pl-link").should("have.length", navItems.length);
    });

    navItems.forEach((navItem, index) => {
        util.IT_SHOULD(`sub nav ${index + 1} should be ${navItem}`, () => {
            cy.get(".pl-tabs pl-link").eq(index).contains(navItem);
        });
    });
}

function navigateToSubNav(name) {
    cy.get(".pl-tabs .pl-link span").contains(name).click();
}

export default {
    verifySubNavItems,
    navigateToSubNav,
};
