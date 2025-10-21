describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.loginAs('admin');
    cy.visit('/admin/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display admin dashboard', () => {
      cy.get('h1, h2').should('contain', /tableau de bord|dashboard/i);
      cy.get('[data-testid="admin-stats"]').should('be.visible');
    });

    it('should display system statistics', () => {
      cy.get('[data-testid="total-users"]').should('be.visible');
      cy.get('[data-testid="total-appointments"]').should('be.visible');
      cy.get('[data-testid="total-doctors"]').should('be.visible');
      cy.get('[data-testid="total-patients"]').should('be.visible');
    });

    it('should display recent activities', () => {
      cy.get('[data-testid="recent-activities"]').should('be.visible');
    });
  });

  describe('Users Management', () => {
    beforeEach(() => {
      cy.visit('/admin/users');
    });

    it('should display users list', () => {
      cy.get('h1, h2').should('contain', /utilisateurs|users/i);
      cy.get('[data-testid="users-table"]').should('be.visible');
    });

    it('should filter users by role', () => {
      cy.get('[data-testid="role-filter"]').select('doctor');
      cy.get('[data-testid="user-item"]').each(($el) => {
        cy.wrap($el).should('contain', /médecin|doctor/i);
      });
    });

    it('should search for users', () => {
      cy.get('[data-testid="search-input"]').type('patient@example.com');
      cy.get('[data-testid="user-item"]').should('contain', 'patient@example.com');
    });

    it('should view user details', () => {
      cy.get('[data-testid="user-item"]').first().click();
      cy.get('[data-testid="user-details"]').should('be.visible');
    });

    it('should edit user information', () => {
      cy.intercept('PUT', '**/users/*').as('updateUser');
      
      cy.get('[data-testid="user-item"]').first().click();
      cy.contains(/modifier|edit/i).click();
      cy.get('input[name="phone_number"]').clear().type('0612345680');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateUser');
      cy.verifyToast('success', 'Utilisateur mis à jour');
    });

    it('should verify a doctor', () => {
      cy.intercept('POST', '**/users/*/verify').as('verifyDoctor');
      
      cy.get('[data-testid="role-filter"]').select('doctor');
      cy.get('[data-testid="unverified-badge"]').first().parent().click();
      cy.contains(/vérifier|verify/i).click();
      cy.get('[data-testid="confirm-verify"]').click();
      
      cy.wait('@verifyDoctor');
      cy.verifyToast('success', 'Médecin vérifié');
    });

    it('should delete a user', () => {
      cy.intercept('DELETE', '**/users/*').as('deleteUser');
      
      cy.get('[data-testid="user-item"]').first().click();
      cy.contains(/supprimer|delete/i).click();
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.wait('@deleteUser');
      cy.verifyToast('success', 'Utilisateur supprimé');
    });
  });

  describe('Appointments Management', () => {
    beforeEach(() => {
      cy.visit('/admin/appointments');
    });

    it('should display all appointments', () => {
      cy.get('h1, h2').should('contain', /rendez-vous|appointments/i);
      cy.get('[data-testid="appointments-table"]').should('be.visible');
    });

    it('should filter appointments by status', () => {
      cy.get('[data-testid="status-filter"]').select('cancelled');
      cy.get('[data-testid="appointment-item"]').each(($el) => {
        cy.wrap($el).should('contain', /annulé|cancelled/i);
      });
    });

    it('should export appointments data', () => {
      cy.contains(/exporter|export/i).click();
      cy.get('[data-testid="export-format"]').select('csv');
      cy.contains(/télécharger|download/i).click();
    });
  });

  describe('System Settings', () => {
    beforeEach(() => {
      cy.visit('/admin/settings');
    });

    it('should display settings page', () => {
      cy.get('h1, h2').should('contain', /paramètres|settings/i);
    });

    it('should update general settings', () => {
      cy.intercept('PUT', '**/settings/general').as('updateSettings');
      
      cy.get('input[name="site_name"]').clear().type('Santé Medical App');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateSettings');
      cy.verifyToast('success', 'Paramètres mis à jour');
    });

    it('should update email settings', () => {
      cy.contains(/email/i).click();
      cy.get('input[name="smtp_host"]').clear().type('smtp.example.com');
      cy.get('input[name="smtp_port"]').clear().type('587');
      cy.get('button[type="submit"]').click();
      cy.verifyToast('success', 'Configuration email mise à jour');
    });
  });

  describe('Reports', () => {
    beforeEach(() => {
      cy.visit('/admin/reports');
    });

    it('should display reports dashboard', () => {
      cy.get('h1, h2').should('contain', /rapports|reports/i);
    });

    it('should generate appointments report', () => {
      cy.contains(/rendez-vous|appointments/i).click();
      cy.get('[data-testid="date-range-start"]').type('2025-01-01');
      cy.get('[data-testid="date-range-end"]').type('2025-12-31');
      cy.contains(/générer|generate/i).click();
      cy.get('[data-testid="report-chart"]').should('be.visible');
    });

    it('should generate revenue report', () => {
      cy.contains(/revenus|revenue/i).click();
      cy.get('[data-testid="report-chart"]').should('be.visible');
    });
  });
});
