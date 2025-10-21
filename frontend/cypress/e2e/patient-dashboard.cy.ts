describe('Patient Dashboard', () => {
  beforeEach(() => {
    cy.loginAs('patient');
    cy.visit('/patient/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display dashboard with patient information', () => {
      cy.get('h1, h2').should('contain', /tableau de bord|dashboard/i);
      cy.get('[data-testid="patient-welcome"]').should('be.visible');
    });

    it('should display upcoming appointments', () => {
      cy.intercept('GET', '**/appointments/*').as('getAppointments');
      cy.wait('@getAppointments');
      cy.get('[data-testid="appointments-list"]').should('be.visible');
    });

    it('should display recent prescriptions', () => {
      cy.intercept('GET', '**/prescriptions/*').as('getPrescriptions');
      cy.wait('@getPrescriptions');
      cy.get('[data-testid="prescriptions-list"]').should('be.visible');
    });

    it('should display quick action buttons', () => {
      cy.contains(/prendre rendez-vous|book appointment/i).should('be.visible');
      cy.contains(/mes prescriptions|prescriptions/i).should('be.visible');
      cy.contains(/mes documents|documents/i).should('be.visible');
    });
  });

  describe('Appointments', () => {
    beforeEach(() => {
      cy.visit('/patient/appointments');
    });

    it('should display appointments list', () => {
      cy.get('h1, h2').should('contain', /rendez-vous|appointments/i);
      cy.get('[data-testid="appointments-table"]').should('be.visible');
    });

    it('should filter appointments by status', () => {
      cy.get('[data-testid="filter-status"]').select('scheduled');
      cy.get('[data-testid="appointment-item"]').each(($el) => {
        cy.wrap($el).should('contain', 'Planifié');
      });
    });

    it('should navigate to book appointment page', () => {
      cy.contains(/prendre rendez-vous|book/i).click();
      cy.url().should('include', '/patient/appointments/book');
    });

    it('should display appointment details', () => {
      cy.get('[data-testid="appointment-item"]').first().click();
      cy.get('[data-testid="appointment-details"]').should('be.visible');
      cy.contains(/détails|details/i).should('be.visible');
    });

    it('should cancel an appointment', () => {
      cy.intercept('PATCH', '**/appointments/*/cancel').as('cancelAppointment');
      
      cy.get('[data-testid="appointment-item"]').first().click();
      cy.contains(/annuler|cancel/i).click();
      cy.get('[data-testid="cancel-reason"]').type('Problème personnel');
      cy.get('[data-testid="confirm-cancel"]').click();
      
      cy.wait('@cancelAppointment');
      cy.verifyToast('success', /annulé|cancelled/i);
    });
  });

  describe('Book Appointment', () => {
    beforeEach(() => {
      cy.visit('/patient/appointments/book');
    });

    it('should display booking form', () => {
      cy.get('h1, h2').should('contain', /prendre rendez-vous|book/i);
      cy.get('[data-testid="specialty-select"]').should('be.visible');
      cy.get('[data-testid="doctor-select"]').should('be.visible');
      cy.get('[data-testid="date-picker"]').should('be.visible');
    });

    it('should load doctors by specialty', () => {
      cy.intercept('GET', '**/users/doctors*').as('getDoctors');
      
      cy.get('[data-testid="specialty-select"]').select('Cardiologue');
      cy.wait('@getDoctors');
      cy.get('[data-testid="doctor-option"]').should('have.length.gt', 0);
    });

    it('should load available time slots', () => {
      cy.intercept('GET', '**/appointments/available-slots*').as('getSlots');
      
      cy.get('[data-testid="specialty-select"]').select('Généraliste');
      cy.get('[data-testid="doctor-select"]').select(1);
      cy.get('[data-testid="date-picker"]').type('2025-12-01');
      
      cy.wait('@getSlots');
      cy.get('[data-testid="time-slot"]').should('have.length.gt', 0);
    });

    it('should successfully book an appointment', () => {
      cy.intercept('POST', '**/appointments/').as('createAppointment');
      
      cy.get('[data-testid="specialty-select"]').select('Généraliste');
      cy.get('[data-testid="doctor-select"]').select(1);
      cy.get('[data-testid="date-picker"]').type('2025-12-01');
      cy.get('[data-testid="time-slot"]').first().click();
      cy.get('[data-testid="reason"]').type('Consultation de routine');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@createAppointment');
      cy.verifyToast('success', /rendez-vous créé|appointment created/i);
      cy.url().should('include', '/patient/appointments');
    });
  });

  describe('Prescriptions', () => {
    beforeEach(() => {
      cy.visit('/patient/prescriptions');
    });

    it('should display prescriptions list', () => {
      cy.get('h1, h2').should('contain', /prescriptions|ordonnances/i);
      cy.get('[data-testid="prescriptions-table"]').should('be.visible');
    });

    it('should view prescription details', () => {
      cy.get('[data-testid="prescription-item"]').first().click();
      cy.get('[data-testid="prescription-details"]').should('be.visible');
      cy.contains(/médicaments|medications/i).should('be.visible');
    });

    it('should request prescription renewal', () => {
      cy.intercept('POST', '**/prescriptions/*/renew').as('renewPrescription');
      
      cy.get('[data-testid="prescription-item"]').first().click();
      cy.contains(/renouveler|renew/i).click();
      cy.get('[data-testid="confirm-renew"]').click();
      
      cy.wait('@renewPrescription');
      cy.verifyToast('success', /demande envoyée|request sent/i);
    });
  });

  describe('Medical Records', () => {
    beforeEach(() => {
      cy.visit('/patient/medical-records');
    });

    it('should display medical records', () => {
      cy.get('h1, h2').should('contain', /dossier médical|medical records/i);
      cy.get('[data-testid="medical-records-list"]').should('be.visible');
    });

    it('should view medical record details', () => {
      cy.get('[data-testid="record-item"]').first().click();
      cy.get('[data-testid="record-details"]').should('be.visible');
    });
  });

  describe('Documents', () => {
    beforeEach(() => {
      cy.visit('/patient/documents');
    });

    it('should display documents list', () => {
      cy.get('h1, h2').should('contain', /documents/i);
      cy.get('[data-testid="documents-list"]').should('be.visible');
    });

    it('should upload a document', () => {
      cy.intercept('POST', '**/documents/').as('uploadDocument');
      
      cy.contains(/ajouter|upload/i).click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-document.pdf', {
        force: true,
      });
      cy.get('[data-testid="document-type"]').select('Résultat d\'examen');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@uploadDocument');
      cy.verifyToast('success', /document ajouté|uploaded/i);
    });

    it('should download a document', () => {
      cy.intercept('GET', '**/documents/*/download').as('downloadDocument');
      
      cy.get('[data-testid="download-btn"]').first().click();
      cy.wait('@downloadDocument');
    });
  });

  describe('Profile', () => {
    beforeEach(() => {
      cy.visit('/patient/profile');
    });

    it('should display profile information', () => {
      cy.get('h1, h2').should('contain', /profil|profile/i);
      cy.get('input[name="first_name"]').should('be.visible');
      cy.get('input[name="last_name"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
    });

    it('should update profile information', () => {
      cy.intercept('PUT', '**/users/me').as('updateProfile');
      
      cy.get('input[name="phone_number"]').clear().type('0612345679');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateProfile');
      cy.verifyToast('success', /profil mis à jour|profile updated/i);
    });

    it('should change password', () => {
      cy.intercept('POST', '**/auth/change-password').as('changePassword');
      
      cy.contains(/changer le mot de passe|change password/i).click();
      cy.get('input[name="current_password"]').type('patient123');
      cy.get('input[name="new_password"]').type('NewPassword123!');
      cy.get('input[name="confirm_password"]').type('NewPassword123!');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@changePassword');
      cy.verifyToast('success', /mot de passe changé|password changed/i);
    });
  });

  describe('Notifications', () => {
    it('should display notifications', () => {
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notifications-panel"]').should('be.visible');
    });

    it('should mark notification as read', () => {
      cy.intercept('PATCH', '**/notifications/*/read').as('markRead');
      
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-item"]').first().click();
      
      cy.wait('@markRead');
    });

    it('should mark all notifications as read', () => {
      cy.intercept('POST', '**/notifications/mark-all-read').as('markAllRead');
      
      cy.get('[data-testid="notifications-icon"]').click();
      cy.contains(/tout marquer|mark all/i).click();
      
      cy.wait('@markAllRead');
    });
  });
});
