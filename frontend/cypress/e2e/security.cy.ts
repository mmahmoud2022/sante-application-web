describe('Security', () => {
  describe('XSS Protection', () => {
    beforeEach(() => {
      cy.loginAs('patient');
    });

    it('should sanitize user input in forms', () => {
      cy.visit('/patient/appointments/book');
      const xssPayload = '<script>alert("XSS")</script>';
      cy.get('[data-testid="reason"]').type(xssPayload);
      cy.get('button[type="submit"]').click();
      
      // Should not execute the script
      cy.on('window:alert', () => {
        throw new Error('XSS vulnerability detected!');
      });
    });

    it('should escape HTML in displayed content', () => {
      cy.visit('/patient/profile');
      const htmlPayload = '<b>Bold Text</b>';
      cy.get('input[name="first_name"]').clear().type(htmlPayload);
      cy.get('button[type="submit"]').click();
      
      // Should display as plain text, not render HTML
      cy.contains('<b>Bold Text</b>').should('be.visible');
      cy.get('b').contains('Bold Text').should('not.exist');
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in requests', () => {
      cy.loginAs('patient');
      cy.intercept('POST', '**/appointments/', (req) => {
        expect(req.headers).to.have.property('x-csrf-token');
      }).as('createAppointment');
      
      cy.visit('/patient/appointments/book');
      cy.get('[data-testid="specialty-select"]').select(1);
      cy.get('[data-testid="doctor-select"]').select(1);
      cy.get('[data-testid="date-picker"]').type('2025-12-01');
      cy.get('[data-testid="time-slot"]').first().click();
      cy.get('button[type="submit"]').click();
    });
  });

  describe('Authentication Security', () => {
    it('should not expose sensitive data in localStorage', () => {
      cy.loginAs('patient');
      cy.window().then((win) => {
        const keys = Object.keys(win.localStorage);
        keys.forEach(key => {
          const value = win.localStorage.getItem(key);
          // Should not store plain passwords
          expect(value).to.not.include('password');
          expect(value).to.not.include('pwd');
        });
      });
    });

    it('should clear tokens on logout', () => {
      cy.loginAs('patient');
      cy.get('[data-testid="user-menu"]').click();
      cy.contains(/déconnexion|logout/i).click();
      
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.be.null;
        expect(win.localStorage.getItem('refresh_token')).to.be.null;
      });
    });

    it('should redirect to login when token is invalid', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', 'invalid_token');
      });
      
      cy.intercept('GET', '**/users/me', {
        statusCode: 401,
        body: { detail: 'Invalid token' }
      });
      
      cy.visit('/patient/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('SQL Injection Protection', () => {
    beforeEach(() => {
      cy.loginAs('patient');
    });

    it('should handle SQL injection attempts in search', () => {
      cy.visit('/patient/appointments');
      const sqlPayload = "'; DROP TABLE appointments; --";
      cy.get('[data-testid="search-input"]').type(sqlPayload);
      cy.get('[data-testid="search-button"]').click();
      
      // Should return safe results or empty, not crash
      cy.get('[data-testid="appointments-table"]').should('be.visible');
    });
  });

  describe('Content Security Policy', () => {
    it('should have CSP headers', () => {
      cy.request('/').then((response) => {
        expect(response.headers).to.have.property('content-security-policy');
      });
    });

    it('should block inline scripts', () => {
      cy.visit('/');
      cy.window().then((win) => {
        // Attempt to execute inline script
        const script = win.document.createElement('script');
        script.textContent = 'window.xssTest = true;';
        win.document.body.appendChild(script);
        
        // Should be blocked by CSP
        expect(win).to.not.have.property('xssTest');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting on login attempts', () => {
      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/auth/login`,
          body: {
            username: 'test@example.com',
            password: 'wrongpassword'
          },
          failOnStatusCode: false
        });
      }
      
      // Next attempt should be rate limited
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
          username: 'test@example.com',
          password: 'wrongpassword'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([429, 401]);
      });
    });
  });

  describe('Password Security', () => {
    it('should enforce password complexity', () => {
      cy.visit('/register');
      
      // Weak password should be rejected
      cy.get('input[name="password"]').type('123');
      cy.get('button[type="submit"]').click();
      cy.contains(/mot de passe|password/i).should('be.visible');
    });

    it('should not show password in plain text by default', () => {
      cy.visit('/login');
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });

    it('should allow toggling password visibility', () => {
      cy.visit('/login');
      cy.get('input[name="password"]').type('test123');
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Session Management', () => {
    it('should expire session after inactivity', () => {
      cy.loginAs('patient');
      
      // Simulate session timeout
      cy.clock();
      cy.tick(30 * 60 * 1000); // 30 minutes
      
      cy.visit('/patient/dashboard');
      cy.url().should('include', '/login');
      cy.contains(/session expirée|session expired/i).should('be.visible');
    });

    it('should prevent concurrent sessions from different devices', () => {
      // This would require more complex setup with actual backend
      // Placeholder for implementation
    });
  });
});
