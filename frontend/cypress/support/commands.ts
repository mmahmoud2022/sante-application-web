/// <reference types="cypress" />

// ***********************************************
// Custom commands for Cypress E2E tests
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login
       * @example cy.login('patient@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login as a specific user type
       * @example cy.loginAs('patient')
       */
      loginAs(userType: 'patient' | 'doctor' | 'admin'): Chainable<void>;

      /**
       * Custom command to setup authenticated user
       * @example cy.setupAuthenticatedUser('patient@example.com', 'access_token_here')
       */
      setupAuthenticatedUser(email: string, token: string): Chainable<void>;

      /**
       * Custom command to seed test data
       * @example cy.seedTestData('appointments')
       */
      seedTestData(dataType: string): Chainable<void>;

      /**
       * Custom command to wait for API call
       * @example cy.waitForApi('@getAppointments')
       */
      waitForApi(alias: string): Chainable<void>;

      /**
       * Custom command to check for loading state
       * @example cy.checkLoadingState()
       */
      checkLoadingState(): Chainable<void>;

      /**
       * Custom command to fill form field
       * @example cy.fillFormField('email', 'test@example.com')
       */
      fillFormField(fieldName: string, value: string): Chainable<void>;

      /**
       * Custom command to verify toast notification
       * @example cy.verifyToast('Success', 'Appointment created')
       */
      verifyToast(type: 'success' | 'error' | 'info', message: string | RegExp): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Login as specific user type
Cypress.Commands.add('loginAs', (userType: 'patient' | 'doctor' | 'admin') => {
  const credentials = {
    patient: {
      email: 'patient@example.com',
      password: 'patient123',
    },
    doctor: {
      email: 'doctor@example.com',
      password: 'doctor123',
    },
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
    },
  };

  const { email, password } = credentials[userType];
  cy.login(email, password);
});

// Setup authenticated user without going through login flow
Cypress.Commands.add('setupAuthenticatedUser', (email: string, token: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', token);
    win.localStorage.setItem('user_email', email);
  });
});

// Seed test data
Cypress.Commands.add('seedTestData', (dataType: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed/${dataType}`,
    failOnStatusCode: false,
  });
});

// Wait for API call with better error handling
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(alias).its('response.statusCode').should('be.oneOf', [200, 201, 204]);
});

// Check for loading state
Cypress.Commands.add('checkLoadingState', () => {
  cy.get('[data-testid="loading-spinner"]').should('be.visible');
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});

// Fill form field
Cypress.Commands.add('fillFormField', (fieldName: string, value: string) => {
  cy.get(`input[name="${fieldName}"]`).clear().type(value);
});

// Verify toast notification
Cypress.Commands.add('verifyToast', (type: 'success' | 'error' | 'info', message: string | RegExp) => {
  const assertion = typeof message === 'string' ? 'contain' : 'match';
  cy.get('[data-testid="toast"]')
    .should('be.visible')
    .and(assertion, message)
    .and('have.class', `toast-${type}`);
});

export {};
