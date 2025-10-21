describe('Navigation and Routing', () => {
  describe('Guest Navigation', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display home page', () => {
      cy.get('[data-testid="hero-section"]').should('be.visible');
    });

    it('should navigate to login page', () => {
      cy.contains(/connexion|login/i).click();
      cy.url().should('include', '/login');
    });

    it('should navigate to register page', () => {
      cy.contains(/inscription|register|sign up/i).click();
      cy.url().should('include', '/register');
    });

    it('should navigate to about page', () => {
      cy.contains(/à propos|about/i).click();
      cy.url().should('include', '/about');
    });

    it('should navigate to doctors list page', () => {
      cy.contains(/nos médecins|doctors/i).click();
      cy.url().should('include', '/doctors');
    });

    it('should redirect protected routes to login', () => {
      cy.visit('/patient/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Patient Navigation', () => {
    beforeEach(() => {
      cy.loginAs('patient');
    });

    it('should display patient sidebar navigation', () => {
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="nav-dashboard"]').should('be.visible');
      cy.get('[data-testid="nav-appointments"]').should('be.visible');
      cy.get('[data-testid="nav-prescriptions"]').should('be.visible');
    });

    it('should navigate through patient pages', () => {
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/patient/dashboard');

      cy.get('[data-testid="nav-appointments"]').click();
      cy.url().should('include', '/patient/appointments');

      cy.get('[data-testid="nav-prescriptions"]').click();
      cy.url().should('include', '/patient/prescriptions');

      cy.get('[data-testid="nav-profile"]').click();
      cy.url().should('include', '/patient/profile');
    });

    it('should not access doctor or admin routes', () => {
      cy.visit('/doctor/dashboard');
      cy.url().should('not.include', '/doctor/dashboard');
      cy.contains(/accès refusé|unauthorized/i).should('be.visible');
    });
  });

  describe('Doctor Navigation', () => {
    beforeEach(() => {
      cy.loginAs('doctor');
    });

    it('should display doctor sidebar navigation', () => {
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="nav-dashboard"]').should('be.visible');
      cy.get('[data-testid="nav-appointments"]').should('be.visible');
      cy.get('[data-testid="nav-patients"]').should('be.visible');
    });

    it('should navigate through doctor pages', () => {
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/doctor/dashboard');

      cy.get('[data-testid="nav-patients"]').click();
      cy.url().should('include', '/doctor/patients');

      cy.get('[data-testid="nav-schedule"]').click();
      cy.url().should('include', '/doctor/schedule');
    });
  });

  describe('Admin Navigation', () => {
    beforeEach(() => {
      cy.loginAs('admin');
    });

    it('should display admin sidebar navigation', () => {
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="nav-dashboard"]').should('be.visible');
      cy.get('[data-testid="nav-users"]').should('be.visible');
      cy.get('[data-testid="nav-settings"]').should('be.visible');
    });

    it('should navigate through admin pages', () => {
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/admin/dashboard');

      cy.get('[data-testid="nav-users"]').click();
      cy.url().should('include', '/admin/users');

      cy.get('[data-testid="nav-settings"]').click();
      cy.url().should('include', '/admin/settings');
    });
  });

  describe('Breadcrumbs Navigation', () => {
    it('should display and navigate using breadcrumbs', () => {
      cy.loginAs('patient');
      cy.visit('/patient/appointments/book');
      
      cy.get('[data-testid="breadcrumbs"]').should('be.visible');
      cy.get('[data-testid="breadcrumbs"]').contains(/rendez-vous|appointments/i).click();
      cy.url().should('include', '/patient/appointments');
    });
  });
});
