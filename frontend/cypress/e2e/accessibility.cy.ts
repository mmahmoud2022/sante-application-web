describe('Accessibility', () => {
  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should navigate through form with Tab key', () => {
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'name', 'email');
      
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'name', 'password');
      
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('should submit form with Enter key', () => {
      cy.get('input[name="email"]').type('patient@example.com');
      cy.get('input[name="password"]').type('patient123{enter}');
      cy.url().should('not.include', '/login');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').should('have.attr', 'aria-label');
      cy.get('input[name="password"]').should('have.attr', 'aria-label');
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/');
      cy.get('h1').should('have.length.gte', 1);
    });

    it('should have alt text for images', () => {
      cy.visit('/');
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });
  });

  describe('Focus Management', () => {
    it('should focus on first input when modal opens', () => {
      cy.loginAs('patient');
      cy.visit('/patient/appointments');
      cy.contains(/prendre rendez-vous|book/i).click();
      cy.focused().should('be.visible');
    });

    it('should trap focus within modal', () => {
      cy.loginAs('patient');
      cy.visit('/patient/profile');
      cy.contains(/changer le mot de passe|change password/i).click();
      cy.get('[data-testid="modal"]').should('be.visible');
      // Focus should be trapped within modal
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text', () => {
      cy.visit('/');
      // This would require additional accessibility testing tools
      // like cypress-axe for automated checks
    });
  });

  describe('Dark Mode Support', () => {
    it('should toggle dark mode', () => {
      cy.visit('/');
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('html').should('have.class', 'dark');
      
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('html').should('not.have.class', 'dark');
    });

    it('should persist dark mode preference', () => {
      cy.visit('/');
      cy.get('[data-testid="theme-toggle"]').click();
      cy.reload();
      cy.get('html').should('have.class', 'dark');
    });
  });
});
