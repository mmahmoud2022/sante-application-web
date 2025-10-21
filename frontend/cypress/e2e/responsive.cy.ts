describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ];

  viewports.forEach(({ name, width, height }) => {
    describe(`${name} viewport (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
      });

      it('should display home page correctly', () => {
        cy.visit('/');
        cy.get('[data-testid="hero-section"]').should('be.visible');
      });

      it('should display login page correctly', () => {
        cy.visit('/login');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
      });

      if (name === 'mobile') {
        it('should show mobile menu', () => {
          cy.visit('/');
          cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
          cy.get('[data-testid="mobile-menu-button"]').click();
          cy.get('[data-testid="mobile-menu"]').should('be.visible');
        });

        it('should hide sidebar by default after login', () => {
          cy.loginAs('patient');
          cy.get('[data-testid="sidebar"]').should('not.be.visible');
          cy.get('[data-testid="menu-toggle"]').click();
          cy.get('[data-testid="sidebar"]').should('be.visible');
        });
      }

      if (name === 'desktop') {
        it('should show desktop navigation', () => {
          cy.visit('/');
          cy.get('[data-testid="desktop-nav"]').should('be.visible');
        });

        it('should show sidebar after login', () => {
          cy.loginAs('patient');
          cy.get('[data-testid="sidebar"]').should('be.visible');
        });
      }
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should handle touch events on buttons', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.contains(/requis/i).should('be.visible');
    });

    it('should handle swipe gestures on carousel', () => {
      cy.visit('/');
      // This would require additional touch event simulation
    });
  });
});
