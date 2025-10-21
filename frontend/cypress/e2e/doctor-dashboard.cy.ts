describe('Doctor Dashboard', () => {
  beforeEach(() => {
    cy.loginAs('doctor');
    cy.visit('/doctor/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display doctor dashboard', () => {
      cy.get('h1, h2').should('contain', /tableau de bord|dashboard/i);
      cy.get('[data-testid="doctor-welcome"]').should('be.visible');
    });

    it('should display today\'s appointments', () => {
      cy.intercept('GET', '**/appointments/*').as('getAppointments');
      cy.wait('@getAppointments');
      cy.get('[data-testid="todays-appointments"]').should('be.visible');
    });

    it('should display statistics cards', () => {
      cy.get('[data-testid="stats-card"]').should('have.length.gte', 3);
      cy.contains(/patients|consultations|rendez-vous/i).should('be.visible');
    });

    it('should display upcoming appointments', () => {
      cy.get('[data-testid="upcoming-appointments"]').should('be.visible');
    });
  });

  describe('Appointments Management', () => {
    beforeEach(() => {
      cy.visit('/doctor/appointments');
    });

    it('should display appointments calendar', () => {
      cy.get('[data-testid="appointments-calendar"]').should('be.visible');
    });

    it('should filter appointments by date', () => {
      cy.get('[data-testid="date-filter"]').type('2025-12-01');
      cy.get('[data-testid="appointment-item"]').should('be.visible');
    });

    it('should filter appointments by status', () => {
      cy.get('[data-testid="status-filter"]').select('scheduled');
      cy.get('[data-testid="appointment-item"]').each(($el) => {
        cy.wrap($el).should('contain', /planifié|scheduled/i);
      });
    });

    it('should view appointment details', () => {
      cy.get('[data-testid="appointment-item"]').first().click();
      cy.get('[data-testid="appointment-details"]').should('be.visible');
      cy.contains(/patient|raison|reason/i).should('be.visible');
    });

    it('should confirm an appointment', () => {
      cy.intercept('PATCH', '**/appointments/*/confirm').as('confirmAppointment');
      
      cy.get('[data-testid="appointment-item"]').first().click();
      cy.contains(/confirmer|confirm/i).click();
      
      cy.wait('@confirmAppointment');
      cy.verifyToast('success', /rendez-vous confirmé|appointment confirmed/i);
    });

    it('should complete an appointment with notes', () => {
      cy.intercept('PATCH', '**/appointments/*/complete').as('completeAppointment');
      
      cy.get('[data-testid="appointment-item"]').first().click();
      cy.contains(/terminer|complete/i).click();
      cy.get('[data-testid="consultation-notes"]').type('Patient en bonne santé générale');
      cy.get('[data-testid="diagnosis"]').type('Contrôle de routine');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@completeAppointment');
      cy.verifyToast('success', /consultation terminée|completed/i);
    });

    it('should cancel an appointment', () => {
      cy.intercept('PATCH', '**/appointments/*/cancel').as('cancelAppointment');
      
      cy.get('[data-testid="appointment-item"]').first().click();
      cy.contains(/annuler|cancel/i).click();
      cy.get('[data-testid="cancel-reason"]').type('Urgence médicale');
      cy.get('[data-testid="confirm-cancel"]').click();
      
      cy.wait('@cancelAppointment');
      cy.verifyToast('success', /rendez-vous annulé|cancelled/i);
    });
  });

  describe('Patients Management', () => {
    beforeEach(() => {
      cy.visit('/doctor/patients');
    });

    it('should display patients list', () => {
      cy.get('h1, h2').should('contain', /patients/i);
      cy.get('[data-testid="patients-table"]').should('be.visible');
    });

    it('should search for patients', () => {
      cy.get('[data-testid="search-input"]').type('Dupont');
      cy.get('[data-testid="patient-item"]').should('contain', 'Dupont');
    });

    it('should view patient details', () => {
      cy.get('[data-testid="patient-item"]').first().click();
      cy.get('[data-testid="patient-details"]').should('be.visible');
      cy.contains(/informations|information/i).should('be.visible');
    });

    it('should view patient medical history', () => {
      cy.get('[data-testid="patient-item"]').first().click();
      cy.contains(/historique médical|medical history/i).click();
      cy.get('[data-testid="medical-history"]').should('be.visible');
    });

    it('should create a medical record for patient', () => {
      cy.intercept('POST', '**/medical-records/').as('createRecord');
      
      cy.get('[data-testid="patient-item"]').first().click();
      cy.contains(/ajouter un dossier|add record/i).click();
      cy.get('[data-testid="diagnosis"]').type('Hypertension artérielle');
      cy.get('[data-testid="treatment"]').type('Régime hyposodé et surveillance');
      cy.get('[data-testid="notes"]').type('Suivi dans 3 mois');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@createRecord');
      cy.verifyToast('success', /dossier créé|record created/i);
    });
  });

  describe('Prescriptions Management', () => {
    beforeEach(() => {
      cy.visit('/doctor/prescriptions');
    });

    it('should display prescriptions list', () => {
      cy.get('h1, h2').should('contain', /prescriptions|ordonnances/i);
      cy.get('[data-testid="prescriptions-table"]').should('be.visible');
    });

    it('should create a new prescription', () => {
      cy.intercept('POST', '**/prescriptions/').as('createPrescription');
      
      cy.contains(/nouvelle prescription|new prescription/i).click();
      cy.get('[data-testid="patient-select"]').select(1);
      cy.get('[data-testid="medication-name"]').type('Amoxicilline');
      cy.get('[data-testid="dosage"]').type('500mg');
      cy.get('[data-testid="frequency"]').type('3 fois par jour');
      cy.get('[data-testid="duration"]').type('7 jours');
      cy.get('[data-testid="instructions"]').type('Prendre pendant les repas');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@createPrescription');
      cy.verifyToast('success', /prescription créée|prescription created/i);
    });

    it('should view prescription details', () => {
      cy.get('[data-testid="prescription-item"]').first().click();
      cy.get('[data-testid="prescription-details"]').should('be.visible');
    });

    it('should approve a renewal request', () => {
      cy.intercept('POST', '**/prescriptions/*/renew').as('renewPrescription');
      
      cy.get('[data-testid="renewal-requests"]').click();
      cy.get('[data-testid="renewal-item"]').first().click();
      cy.contains(/approuver|approve/i).click();
      
      cy.wait('@renewPrescription');
      cy.verifyToast('success', /renouvellement approuvé|renewal approved/i);
    });
  });

  describe('Schedule Management', () => {
    beforeEach(() => {
      cy.visit('/doctor/schedule');
    });

    it('should display schedule calendar', () => {
      cy.get('h1, h2').should('contain', /horaires|schedule/i);
      cy.get('[data-testid="schedule-calendar"]').should('be.visible');
    });

    it('should add availability slot', () => {
      cy.intercept('POST', '**/schedules/').as('createSchedule');
      
      cy.contains(/ajouter|add/i).click();
      cy.get('[data-testid="day-select"]').select('Lundi');
      cy.get('[data-testid="start-time"]').type('09:00');
      cy.get('[data-testid="end-time"]').type('12:00');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@createSchedule');
      cy.verifyToast('success', /créneau ajouté|slot added/i);
    });

    it('should update availability slot', () => {
      cy.intercept('PUT', '**/schedules/*').as('updateSchedule');
      
      cy.get('[data-testid="schedule-slot"]').first().click();
      cy.get('[data-testid="start-time"]').clear().type('10:00');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateSchedule');
      cy.verifyToast('success', /horaire mis à jour|schedule updated/i);
    });

    it('should delete availability slot', () => {
      cy.intercept('DELETE', '**/schedules/*').as('deleteSchedule');
      
      cy.get('[data-testid="schedule-slot"]').first().click();
      cy.contains(/supprimer|delete/i).click();
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.wait('@deleteSchedule');
      cy.verifyToast('success', /créneau supprimé|slot deleted/i);
    });
  });

  describe('Reviews Management', () => {
    beforeEach(() => {
      cy.visit('/doctor/reviews');
    });

    it('should display reviews list', () => {
      cy.get('h1, h2').should('contain', /avis|reviews/i);
      cy.get('[data-testid="reviews-list"]').should('be.visible');
    });

    it('should view review details', () => {
      cy.get('[data-testid="review-item"]').first().click();
      cy.get('[data-testid="review-details"]').should('be.visible');
    });

    it('should respond to a review', () => {
      cy.intercept('POST', '**/reviews/*/respond').as('respondToReview');
      
      cy.get('[data-testid="review-item"]').first().click();
      cy.contains(/répondre|respond/i).click();
      cy.get('[data-testid="response-text"]').type('Merci pour votre retour !');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@respondToReview');
      cy.verifyToast('success', /réponse envoyée|response sent/i);
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.visit('/doctor/profile');
    });

    it('should display doctor profile', () => {
      cy.get('h1, h2').should('contain', /profil|profile/i);
      cy.get('input[name="first_name"]').should('be.visible');
      cy.get('input[name="specialization"]').should('be.visible');
    });

    it('should update profile information', () => {
      cy.intercept('PUT', '**/users/me').as('updateProfile');
      
      cy.get('[data-testid="bio"]').clear().type('Spécialiste en médecine générale avec 10 ans d\'expérience');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateProfile');
      cy.verifyToast('success', /profil mis à jour|profile updated/i);
    });

    it('should update consultation fees', () => {
      cy.intercept('PUT', '**/users/me').as('updateProfile');
      
      cy.get('input[name="consultation_fee"]').clear().type('50');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateProfile');
      cy.verifyToast('success', /tarif mis à jour|fee updated/i);
    });
  });
});
