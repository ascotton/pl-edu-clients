// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your other test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/guides/configuration#section-global
// ***********************************************************

// Import commands.js and defaults.js
// using ES2015 syntax:
import "./commands/commands";
import "./defaults";

// Alternatively you can use CommonJS syntax:
// require("./commands")
// require("./defaults")

const responseStub = result => Promise.resolve({
  json() {
    return Promise.resolve(result);
  },
  text() {
    return Promise.resolve(JSON.stringify(result));
  },
  ok: true,
});

Cypress.Commands.add('mockGraphQL', (handler) => {
  cy.on('window:before:load', (win) => {
    const originalFunction = win.fetch;

    function fetch(path, { body, method }) {
      if (path.includes('/graphql') && method === 'POST') {
        return responseStub(handler(JSON.parse(body)));
      }

      return originalFunction.apply(this, arguments);
    }

    cy.stub(win, 'fetch', fetch).as('graphqlStub');
  });
});
