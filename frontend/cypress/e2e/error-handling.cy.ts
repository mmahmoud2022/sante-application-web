describe('Error Handling', () => {
  describe('Network Errors', () => {
    beforeEach(() => {
      cy.loginAs('patient');
    });

    it('should handle 404 errors gracefully', () => {
      cy.intercept('GET', '**/appointments/99999', {
        statusCode: 404,
        body: { detail: 'Appointment not found' }
      }).as('notFound');

      cy.visit('/patient/appointments/99999', { failOnStatusCode: false });
      cy.contains(/non trouvé|not found/i).should('be.visible');
    });

    it('should handle 500 errors gracefully', () => {
      cy.intercept('GET', '**/appointments/*', {
        statusCode: 500,
        body: { detail: 'Internal server error' }
      }).as('serverError');

      cy.visit('/patient/appointments');
      cy.wait('@serverError');
      cy.contains(/erreur|error/i).should('be.visible');
    });

    it('should handle network timeout', () => {
      cy.intercept('GET', '**/appointments/*', {
        delay: 15000,
        statusCode: 408,
      }).as('timeout');

      cy.visit('/patient/appointments');
      cy.contains(/délai|timeout/i, { timeout: 20000 }).should('be.visible');
    });

    it('should retry failed requests', () => {
      let attempts = 0;
      cy.intercept('GET', '**/appointments/*', (req) => {
        attempts++;
        if (attempts < 3) {
          req.reply({ statusCode: 500 });
        } else {
          req.reply({ fixture: 'appointments.json' });
        }
      }).as('retryRequest');

      cy.visit('/patient/appointments');
      cy.get('[data-testid="appointments-table"]').should('be.visible');
    });
  });

  describe('Form Validation Errors', () => {
    it('should display validation errors for empty form', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.contains(/requis|required/i).should('be.visible');
    });

    it('should display validation error for invalid email', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.contains(/email invalide|invalid email/i).should('be.visible');
    });

    it('should display validation error for weak password', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('123');
      cy.get('button[type="submit"]').click();
      cy.contains(/mot de passe|password/i).should('be.visible');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle expired token', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', 'expired_token');
      });

      cy.intercept('GET', '**/users/me', {
        statusCode: 401,
        body: { detail: 'Token expired' }
      }).as('expiredToken');

      cy.visit('/patient/dashboard');
      cy.url().should('include', '/login');
    });

    it('should handle invalid credentials', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { detail: 'Invalid credentials' }
      }).as('invalidLogin');

      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@invalidLogin');
      cy.contains(/identifiants invalides|invalid credentials/i).should('be.visible');
    });

    it('should handle unauthorized access', () => {
      cy.loginAs('patient');
      cy.visit('/admin/dashboard', { failOnStatusCode: false });
      cy.contains(/accès refusé|unauthorized/i).should('be.visible');
    });
  });

  describe('Data Errors', () => {
    beforeEach(() => {
      cy.loginAs('patient');
    });

    it('should handle empty data gracefully', () => {
      cy.intercept('GET', '**/appointments/*', {
        statusCode: 200,
        body: []
      }).as('emptyAppointments');

      cy.visit('/patient/appointments');
      cy.wait('@emptyAppointments');
      cy.contains(/aucun rendez-vous|no appointments/i).should('be.visible');
    });

    it('should handle malformed data', () => {
      cy.intercept('GET', '**/appointments/*', {
        statusCode: 200,
        body: { invalid: 'data' }
      }).as('malformedData');

      cy.visit('/patient/appointments');
      cy.wait('@malformedData');
      cy.contains(/erreur|error/i).should('be.visible');
    });
  });

  describe('Offline Mode', () => {
    it('should display offline message when network is unavailable', () => {
      cy.visit('/');
      cy.window().then((win) => {
        // Simulate offline
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      cy.contains(/hors ligne|offline/i).should('be.visible');
    });

    it('should cache data for offline access', () => {
      cy.loginAs('patient');
      cy.visit('/patient/appointments');
      
      // Wait for data to load
      cy.get('[data-testid="appointments-table"]').should('be.visible');
      
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
      });
      
      // Reload page
      cy.reload();
      
      // Should still show cached data
      cy.get('[data-testid="appointments-table"]').should('be.visible');
    });
  });
});
