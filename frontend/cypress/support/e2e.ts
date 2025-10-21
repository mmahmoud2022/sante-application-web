// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import './types';
import './helpers';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Disable uncaught exception handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // This is useful for third-party scripts that might throw errors
  return false;
});

// Custom before hook to clear localStorage
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
