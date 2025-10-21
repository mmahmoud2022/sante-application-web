# Advanced Cypress Testing Examples

## 🎯 Table des matières

- [Intercepting Complex APIs](#intercepting-complex-apis)
- [Custom Commands Avancés](#custom-commands-avancés)
- [Testing avec Authentication](#testing-avec-authentication)
- [Données Dynamiques](#données-dynamiques)
- [Testing de Formulaires Complexes](#testing-de-formulaires-complexes)
- [Testing de Graphiques et Visualisations](#testing-de-graphiques-et-visualisations)
- [Performance Testing Avancé](#performance-testing-avancé)
- [Visual Regression Testing](#visual-regression-testing)

## 🌐 Intercepting Complex APIs

### Modifier la réponse d'une API

```typescript
cy.intercept('GET', '**/appointments/*', (req) => {
  req.reply((res) => {
    // Modifier les données
    res.body = res.body.map((appointment: any) => ({
      ...appointment,
      status: 'confirmed'
    }));
    return res;
  });
});
```

### Simuler des erreurs de réseau

```typescript
cy.intercept('POST', '**/appointments/', {
  statusCode: 500,
  body: { detail: 'Internal Server Error' },
  delay: 1000
}).as('createError');
```

### Réponses conditionnelles

```typescript
let requestCount = 0;

cy.intercept('GET', '**/appointments/*', (req) => {
  requestCount++;
  
  if (requestCount === 1) {
    req.reply({ statusCode: 500 });
  } else {
    req.reply({ fixture: 'appointments.json' });
  }
});
```

## 🛠️ Custom Commands Avancés

### Créer un rendez-vous complet

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('createAppointment', (appointmentData) => {
  cy.intercept('POST', '**/appointments/').as('createAppointment');
  cy.intercept('GET', '**/appointments/available-slots*').as('getSlots');
  
  cy.visit('/patient/appointments/book');
  
  cy.get('[data-testid="specialty-select"]').select(appointmentData.specialty);
  cy.get('[data-testid="doctor-select"]').select(appointmentData.doctorId);
  
  cy.wait('@getSlots');
  
  cy.get('[data-testid="date-picker"]').type(appointmentData.date);
  cy.get(`[data-testid="time-slot"][data-time="${appointmentData.time}"]`).click();
  cy.get('[data-testid="reason"]').type(appointmentData.reason);
  cy.get('button[type="submit"]').click();
  
  cy.wait('@createAppointment');
  cy.verifyToast('success', /créé|created/i);
});

// Utilisation
cy.createAppointment({
  specialty: 'Cardiologue',
  doctorId: 2,
  date: '2025-12-01',
  time: '10:00',
  reason: 'Consultation de routine'
});
```

### Vérifier l'état complet d'une page

```typescript
Cypress.Commands.add('verifyDashboardLoaded', () => {
  cy.get('[data-testid="dashboard-header"]').should('be.visible');
  cy.get('[data-testid="stats-cards"]').should('be.visible');
  cy.get('[data-testid="appointments-widget"]').should('be.visible');
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});
```

## 🔐 Testing avec Authentication

### Mock JWT Token

```typescript
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

cy.intercept('POST', '**/auth/login', {
  statusCode: 200,
  body: {
    access_token: mockToken,
    token_type: 'bearer'
  }
}).as('login');

cy.visit('/login');
cy.get('input[name="email"]').type('patient@example.com');
cy.get('input[name="password"]').type('password123');
cy.get('button[type="submit"]').click();

cy.wait('@login');
cy.window().then((win) => {
  expect(win.localStorage.getItem('access_token')).to.equal(mockToken);
});
```

### Test de renouvellement de token

```typescript
it('should refresh token when expired', () => {
  let tokenRefreshed = false;
  
  cy.intercept('GET', '**/users/me', (req) => {
    if (!tokenRefreshed) {
      req.reply({ statusCode: 401 });
    } else {
      req.reply({ fixture: 'patient-user.json' });
    }
  });
  
  cy.intercept('POST', '**/auth/refresh', (req) => {
    tokenRefreshed = true;
    req.reply({
      access_token: 'new_token',
      token_type: 'bearer'
    });
  }).as('refreshToken');
  
  cy.loginAs('patient');
  cy.visit('/patient/dashboard');
  
  cy.wait('@refreshToken');
  cy.get('[data-testid="dashboard-header"]').should('be.visible');
});
```

## 📊 Données Dynamiques

### Générer des données de test

```typescript
const generateAppointment = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  patient_id: 1,
  doctor_id: 2,
  appointment_date: '2025-12-01',
  appointment_time: '10:00:00',
  status: 'scheduled',
  reason: 'Consultation',
  ...overrides
});

cy.intercept('GET', '**/appointments/*', {
  statusCode: 200,
  body: Array.from({ length: 10 }, (_, i) => 
    generateAppointment({ id: i + 1 })
  )
});
```

### Tester avec différentes dates

```typescript
const testDates = [
  { date: '2025-01-01', label: 'Début d\'année' },
  { date: '2025-12-31', label: 'Fin d\'année' },
  { date: '2025-02-29', label: 'Année bissextile' }
];

testDates.forEach(({ date, label }) => {
  it(`should handle ${label}: ${date}`, () => {
    cy.visit('/patient/appointments/book');
    cy.get('[data-testid="date-picker"]').type(date);
    cy.get('[data-testid="time-slot"]').should('be.visible');
  });
});
```

## 📝 Testing de Formulaires Complexes

### Validation en temps réel

```typescript
it('should validate form fields in real-time', () => {
  cy.visit('/register');
  
  // Test email validation
  cy.get('input[name="email"]')
    .type('invalid')
    .blur();
  cy.contains(/email invalide/i).should('be.visible');
  
  cy.get('input[name="email"]')
    .clear()
    .type('valid@example.com')
    .blur();
  cy.contains(/email invalide/i).should('not.exist');
  
  // Test password strength
  cy.get('input[name="password"]')
    .type('123')
    .blur();
  cy.get('[data-testid="password-strength"]')
    .should('have.class', 'weak');
  
  cy.get('input[name="password"]')
    .clear()
    .type('SecurePass123!')
    .blur();
  cy.get('[data-testid="password-strength"]')
    .should('have.class', 'strong');
});
```

### Formulaire multi-étapes

```typescript
it('should complete multi-step booking form', () => {
  cy.visit('/patient/appointments/book');
  
  // Step 1: Select specialty
  cy.get('[data-testid="step-indicator"]')
    .should('contain', 'Étape 1');
  cy.get('[data-testid="specialty-select"]').select('Cardiologue');
  cy.contains(/suivant|next/i).click();
  
  // Step 2: Select doctor
  cy.get('[data-testid="step-indicator"]')
    .should('contain', 'Étape 2');
  cy.get('[data-testid="doctor-card"]').first().click();
  cy.contains(/suivant|next/i).click();
  
  // Step 3: Select date and time
  cy.get('[data-testid="step-indicator"]')
    .should('contain', 'Étape 3');
  cy.get('[data-testid="date-picker"]').type('2025-12-01');
  cy.get('[data-testid="time-slot"]').first().click();
  cy.contains(/suivant|next/i).click();
  
  // Step 4: Confirm
  cy.get('[data-testid="step-indicator"]')
    .should('contain', 'Étape 4');
  cy.get('[data-testid="appointment-summary"]').should('be.visible');
  cy.contains(/confirmer|confirm/i).click();
  
  cy.verifyToast('success', /rendez-vous créé/i);
});
```

## 📈 Testing de Graphiques et Visualisations

### Vérifier Chart.js

```typescript
it('should display appointment statistics chart', () => {
  cy.intercept('GET', '**/appointments/stats/*', {
    fixture: 'appointment-stats.json'
  });
  
  cy.visit('/doctor/dashboard');
  
  cy.get('canvas[data-testid="appointments-chart"]')
    .should('be.visible')
    .then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      expect(ctx).to.not.be.null;
      
      // Vérifier que le canvas a été dessiné
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      const hasData = imageData.data.some(value => value !== 0);
      expect(hasData).to.be.true;
    });
});
```

### Tester les interactions avec les graphiques

```typescript
it('should show tooltip on chart hover', () => {
  cy.visit('/doctor/dashboard');
  
  cy.get('canvas[data-testid="appointments-chart"]')
    .trigger('mousemove', { clientX: 100, clientY: 100 });
  
  cy.get('[data-testid="chart-tooltip"]')
    .should('be.visible')
    .and('contain', 'Rendez-vous');
});
```

## ⚡ Performance Testing Avancé

### Mesurer le temps de rendu

```typescript
it('should render large list efficiently', () => {
  const largeDataset = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Patient ${i}`,
    email: `patient${i}@example.com`
  }));
  
  cy.intercept('GET', '**/patients/*', {
    statusCode: 200,
    body: largeDataset
  });
  
  cy.visit('/doctor/patients');
  
  const startTime = Date.now();
  cy.get('[data-testid="patient-item"]')
    .should('have.length.gte', 10)
    .then(() => {
      const renderTime = Date.now() - startTime;
      cy.log(`Render time: ${renderTime}ms`);
      expect(renderTime).to.be.lessThan(2000);
    });
});
```

### Tester le scroll virtuel

```typescript
it('should load items on scroll', () => {
  cy.visit('/doctor/patients');
  
  // Initial load
  cy.get('[data-testid="patient-item"]')
    .should('have.length', 20);
  
  // Scroll to bottom
  cy.get('[data-testid="patients-list"]')
    .scrollTo('bottom');
  
  // More items should load
  cy.get('[data-testid="patient-item"]')
    .should('have.length.gte', 40);
});
```

## 🎨 Visual Regression Testing

### Prendre des snapshots

```typescript
it('should match dashboard snapshot', () => {
  cy.loginAs('patient');
  cy.visit('/patient/dashboard');
  
  // Attendre que tout soit chargé
  cy.get('[data-testid="dashboard-header"]').should('be.visible');
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
  
  // Prendre un snapshot
  cy.screenshot('patient-dashboard', {
    capture: 'viewport',
    overwrite: true
  });
});
```

### Comparer avec baseline

```typescript
// Nécessite cypress-image-diff ou similaire
it('should not have visual regressions', () => {
  cy.visit('/patient/dashboard');
  cy.compareSnapshot('dashboard', 0.1); // 10% de tolérance
});
```

## 🔄 Testing de WebSockets / Real-time

### Mock WebSocket

```typescript
it('should receive real-time notifications', () => {
  cy.loginAs('patient');
  cy.visit('/patient/dashboard');
  
  cy.window().then((win) => {
    // Simuler un événement WebSocket
    const event = new CustomEvent('notification', {
      detail: {
        type: 'appointment_confirmed',
        message: 'Votre rendez-vous a été confirmé'
      }
    });
    win.dispatchEvent(event);
  });
  
  cy.get('[data-testid="notification-toast"]')
    .should('be.visible')
    .and('contain', 'rendez-vous a été confirmé');
});
```

## 🧪 Testing de Pagination

```typescript
it('should navigate through paginated results', () => {
  cy.visit('/doctor/patients');
  
  // Page 1
  cy.get('[data-testid="page-number"]')
    .should('contain', '1');
  cy.get('[data-testid="patient-item"]')
    .should('have.length', 20);
  
  // Go to page 2
  cy.get('[data-testid="next-page"]').click();
  cy.get('[data-testid="page-number"]')
    .should('contain', '2');
  
  // Go back
  cy.get('[data-testid="prev-page"]').click();
  cy.get('[data-testid="page-number"]')
    .should('contain', '1');
});
```

## 🎭 Testing de Modals et Dialogs

```typescript
it('should handle modal interactions', () => {
  cy.visit('/patient/appointments');
  
  // Ouvrir le modal
  cy.get('[data-testid="appointment-item"]').first().click();
  cy.get('[data-testid="cancel-button"]').click();
  
  // Modal de confirmation
  cy.get('[data-testid="confirmation-modal"]')
    .should('be.visible');
  
  // Fermer avec ESC
  cy.get('body').type('{esc}');
  cy.get('[data-testid="confirmation-modal"]')
    .should('not.exist');
  
  // Réouvrir et confirmer
  cy.get('[data-testid="cancel-button"]').click();
  cy.get('[data-testid="confirm-cancel"]').click();
  
  cy.verifyToast('success', /annulé/i);
  cy.get('[data-testid="confirmation-modal"]')
    .should('not.exist');
});
```

## 🌍 Testing d'Internationalisation (i18n)

```typescript
const languages = ['fr', 'en', 'ar'];

languages.forEach((lang) => {
  it(`should display content in ${lang}`, () => {
    cy.visit('/');
    
    // Changer la langue
    cy.get('[data-testid="language-selector"]').select(lang);
    
    // Vérifier que le contenu est traduit
    cy.get('[data-testid="hero-title"]')
      .should('be.visible')
      .invoke('text')
      .should('not.be.empty');
    
    // Vérifier que l'URL a changé
    cy.url().should('include', `/${lang}`);
  });
});
```

---

**Note**: Ces exemples sont avancés et nécessitent parfois des plugins additionnels ou des configurations spécifiques. Consultez la documentation Cypress pour plus de détails.
