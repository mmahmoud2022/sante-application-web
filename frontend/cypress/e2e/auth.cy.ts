describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login', () => {
    it('should display login page', () => {
      cy.visit('/login');
      cy.get('h1, h2').should('contain', 'Connexion');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.contains('requis').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      cy.contains(/identifiants invalides|erreur/i).should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.intercept('POST', '**/auth/login').as('loginRequest');
      
      cy.visit('/login');
      cy.get('input[name="email"]').type('patient@example.com');
      cy.get('input[name="password"]').type('patient123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginRequest');
      cy.url().should('not.include', '/login');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.exist;
      });
    });

    it('should remember user when "Remember me" is checked', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('patient@example.com');
      cy.get('input[name="password"]').type('patient123');
      cy.get('input[type="checkbox"]').check();
      cy.get('button[type="submit"]').click();
      
      cy.url().should('not.include', '/login');
    });

    it('should navigate to forgot password page', () => {
      cy.visit('/login');
      cy.contains(/mot de passe oublié/i).click();
      cy.url().should('include', '/forgot-password');
    });
  });

  describe('Registration', () => {
    it('should display registration page', () => {
      cy.visit('/register');
      cy.get('h1, h2').should('contain', 'Inscription');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="first_name"]').should('be.visible');
      cy.get('input[name="last_name"]').should('be.visible');
    });

    it('should show validation errors for invalid data', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('123');
      cy.get('button[type="submit"]').click();
      cy.contains(/email|mot de passe/i).should('be.visible');
    });

    it('should successfully register a new patient', () => {
      cy.intercept('POST', '**/auth/register').as('registerRequest');
      
      const timestamp = Date.now();
      cy.visit('/register');
      cy.get('input[name="email"]').type(`patient${timestamp}@example.com`);
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="first_name"]').type('Jean');
      cy.get('input[name="last_name"]').type('Dupont');
      cy.get('input[name="phone_number"]').type('0612345678');
      cy.get('select[name="role"]').select('patient');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@registerRequest');
      cy.url().should('include', '/login');
    });

    it('should navigate to login page from registration', () => {
      cy.visit('/register');
      cy.contains(/se connecter|connexion/i).click();
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset', () => {
    it('should display forgot password page', () => {
      cy.visit('/forgot-password');
      cy.get('h1, h2').should('contain', /mot de passe/i);
      cy.get('input[name="email"]').should('be.visible');
    });

    it('should send password reset email', () => {
      cy.intercept('POST', '**/auth/request-password-reset').as('resetRequest');
      
      cy.visit('/forgot-password');
      cy.get('input[name="email"]').type('patient@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@resetRequest');
      cy.contains(/email envoyé|vérifiez/i).should('be.visible');
    });
  });

  describe('Logout', () => {
    it('should successfully logout', () => {
      cy.loginAs('patient');
      cy.get('[data-testid="user-menu"], [aria-label*="menu"]').click();
      cy.contains(/déconnexion|logout/i).click();
      cy.url().should('include', '/login');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.be.null;
      });
    });
  });
});
