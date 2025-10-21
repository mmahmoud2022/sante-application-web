# Tests End-to-End (E2E) - Santé Medical Application

## 📋 Table des matières

- [Introduction](#introduction)
- [Configuration](#configuration)
- [Structure des tests](#structure-des-tests)
- [Exécution des tests](#exécution-des-tests)
- [Commandes personnalisées](#commandes-personnalisées)
- [Fixtures](#fixtures)
- [Bonnes pratiques](#bonnes-pratiques)
- [Debugging](#debugging)

## 🎯 Introduction

Cette suite de tests E2E utilise **Cypress** pour tester l'application Santé Medical de bout en bout, simulant l'expérience utilisateur réelle.

### Couverture des tests

- ✅ **Authentification** : Login, registration, password reset
- ✅ **Dashboard Patient** : Appointments, prescriptions, documents
- ✅ **Dashboard Médecin** : Patients, consultations, horaires
- ✅ **Dashboard Admin** : Gestion des utilisateurs, paramètres
- ✅ **Navigation** : Routes, breadcrumbs, sidebar
- ✅ **Accessibilité** : Keyboard navigation, ARIA labels
- ✅ **Responsive Design** : Mobile, tablet, desktop
- ✅ **Performance** : Load times, bundle size
- ✅ **Gestion d'erreurs** : Network errors, validation

## 🔧 Configuration

### Prérequis

```bash
# Node.js >= 18
# npm ou yarn
```

### Installation

```bash
cd frontend
npm install
```

### Configuration de l'environnement

Créez un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Configuration Cypress

Le fichier `cypress.config.ts` contient la configuration principale :

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

## 📁 Structure des tests

```
frontend/
├── cypress/
│   ├── e2e/                          # Tests E2E
│   │   ├── auth.cy.ts                # Tests d'authentification
│   │   ├── patient-dashboard.cy.ts   # Tests dashboard patient
│   │   ├── doctor-dashboard.cy.ts    # Tests dashboard médecin
│   │   ├── admin-dashboard.cy.ts     # Tests dashboard admin
│   │   ├── navigation.cy.ts          # Tests de navigation
│   │   ├── accessibility.cy.ts       # Tests d'accessibilité
│   │   ├── responsive.cy.ts          # Tests responsive
│   │   ├── performance.cy.ts         # Tests de performance
│   │   └── error-handling.cy.ts      # Tests gestion d'erreurs
│   ├── fixtures/                     # Données de test
│   │   ├── auth-response.json
│   │   ├── patient-user.json
│   │   ├── doctor-user.json
│   │   ├── appointments.json
│   │   ├── prescriptions.json
│   │   └── ...
│   ├── support/
│   │   ├── commands.ts               # Commandes personnalisées
│   │   ├── e2e.ts                    # Configuration E2E
│   │   └── component.ts              # Configuration component
│   └── screenshots/                  # Captures d'écran des échecs
│   └── videos/                       # Vidéos des tests
└── cypress.config.ts                 # Configuration Cypress
```

## 🚀 Exécution des tests

### Mode interactif (avec UI)

```bash
npm run test:e2e
```

Ouvre l'interface Cypress pour sélectionner et exécuter des tests individuellement.

### Mode headless (CI/CD)

```bash
npm run test:e2e:headless
```

Exécute tous les tests en arrière-plan et génère des rapports.

### Exécuter un test spécifique

```bash
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

### Exécuter avec un navigateur spécifique

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

### Exécuter sur différentes résolutions

```bash
# Mobile
npx cypress run --config viewportWidth=375,viewportHeight=667

# Tablet
npx cypress run --config viewportWidth=768,viewportHeight=1024

# Desktop
npx cypress run --config viewportWidth=1920,viewportHeight=1080
```

## 🛠️ Commandes personnalisées

### `cy.login(email, password)`

Connecte un utilisateur avec email et mot de passe.

```typescript
cy.login('patient@example.com', 'password123');
```

### `cy.loginAs(userType)`

Connecte rapidement en tant que patient, médecin ou admin.

```typescript
cy.loginAs('patient');
cy.loginAs('doctor');
cy.loginAs('admin');
```

### `cy.setupAuthenticatedUser(email, token)`

Configure un utilisateur authentifié sans passer par le flux de login.

```typescript
cy.setupAuthenticatedUser('patient@example.com', 'token_here');
```

### `cy.fillFormField(fieldName, value)`

Remplit un champ de formulaire.

```typescript
cy.fillFormField('email', 'test@example.com');
```

### `cy.verifyToast(type, message)`

Vérifie qu'un toast de notification est affiché.

```typescript
cy.verifyToast('success', 'Rendez-vous créé');
cy.verifyToast('error', /erreur|error/i);
```

### `cy.waitForApi(alias)`

Attend une requête API et vérifie le code de statut.

```typescript
cy.intercept('GET', '**/appointments/*').as('getAppointments');
cy.waitForApi('@getAppointments');
```

## 📦 Fixtures

Les fixtures contiennent des données de test réutilisables.

### Utilisation

```typescript
// Charger une fixture
cy.fixture('patient-user.json').then((user) => {
  cy.log(user.email);
});

// Intercepter avec une fixture
cy.intercept('GET', '**/users/me', { fixture: 'patient-user.json' });

// Utiliser dans un test
cy.intercept('GET', '**/appointments/*', { fixture: 'appointments.json' }).as('getAppointments');
cy.visit('/patient/appointments');
cy.wait('@getAppointments');
```

### Fixtures disponibles

- `auth-response.json` : Réponse d'authentification
- `patient-user.json` : Données utilisateur patient
- `doctor-user.json` : Données utilisateur médecin
- `appointments.json` : Liste de rendez-vous
- `prescriptions.json` : Liste d'ordonnances
- `schedules.json` : Horaires du médecin
- `available-slots.json` : Créneaux disponibles
- `medical-records.json` : Dossiers médicaux

## ✅ Bonnes pratiques

### 1. Utiliser des data-testid

```tsx
// ✅ Bon
<button data-testid="submit-btn">Submit</button>
cy.get('[data-testid="submit-btn"]').click();

// ❌ Éviter
<button className="btn-primary">Submit</button>
cy.get('.btn-primary').click(); // Fragile si le CSS change
```

### 2. Éviter les attentes fixes

```typescript
// ❌ Éviter
cy.wait(5000);

// ✅ Bon
cy.get('[data-testid="loading"]').should('not.exist');
cy.intercept('GET', '**/api/*').as('apiCall');
cy.wait('@apiCall');
```

### 3. Isoler les tests

Chaque test doit être indépendant et pouvoir s'exécuter seul.

```typescript
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.loginAs('patient');
});
```

### 4. Utiliser des alias pour les intercepts

```typescript
cy.intercept('POST', '**/appointments/').as('createAppointment');
cy.get('button[type="submit"]').click();
cy.wait('@createAppointment').its('response.statusCode').should('eq', 201);
```

### 5. Tester les états de chargement

```typescript
cy.checkLoadingState(); // Custom command
cy.get('[data-testid="appointments-table"]').should('be.visible');
```

### 6. Gérer les états asynchrones

```typescript
cy.intercept('GET', '**/appointments/*').as('getAppointments');
cy.visit('/patient/appointments');
cy.wait('@getAppointments');
cy.get('[data-testid="appointment-item"]').should('have.length.gt', 0);
```

## 🐛 Debugging

### 1. Utiliser `.debug()`

```typescript
cy.get('[data-testid="button"]').debug().click();
```

### 2. Utiliser `.pause()`

```typescript
cy.get('[data-testid="form"]').pause();
// Le test s'arrête ici, vous pouvez inspecter l'état
```

### 3. Logs personnalisés

```typescript
cy.log('Test démarré');
cy.task('log', 'Message de debug');
```

### 4. Captures d'écran

```typescript
cy.screenshot('error-state');
```

### 5. Mode interactif

Exécutez les tests en mode interactif pour voir ce qui se passe :

```bash
npm run test:e2e
```

### 6. Vidéos de test

Les vidéos sont enregistrées automatiquement dans `cypress/videos/`.

### 7. Time travel debugging

Dans l'interface Cypress, cliquez sur chaque étape pour voir l'état de l'application à ce moment.

## 🔍 Exemples de tests

### Test d'authentification

```typescript
describe('Login', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('patient@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/patient/dashboard');
  });
});
```

### Test avec intercept

```typescript
it('should create appointment', () => {
  cy.intercept('POST', '**/appointments/', {
    statusCode: 201,
    fixture: 'appointments.json'
  }).as('createAppointment');
  
  cy.visit('/patient/appointments/book');
  cy.get('[data-testid="doctor-select"]').select(1);
  cy.get('[data-testid="date-picker"]').type('2025-12-01');
  cy.get('[data-testid="time-slot"]').first().click();
  cy.get('button[type="submit"]').click();
  
  cy.wait('@createAppointment');
  cy.verifyToast('success', 'Rendez-vous créé');
});
```

### Test responsive

```typescript
it('should display mobile menu', () => {
  cy.viewport('iphone-x');
  cy.visit('/');
  cy.get('[data-testid="mobile-menu-button"]').click();
  cy.get('[data-testid="mobile-menu"]').should('be.visible');
});
```

## 📊 Rapports de tests

### Configuration des rapports

Pour générer des rapports HTML, installez un reporter :

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

Configurez dans `cypress.config.ts` :

```typescript
reporter: 'mochawesome',
reporterOptions: {
  reportDir: 'cypress/reports',
  overwrite: false,
  html: true,
  json: true
}
```

### Génération des rapports

```bash
npm run test:e2e:headless
npx mochawesome-merge cypress/reports/*.json > cypress/reports/report.json
npx marge cypress/reports/report.json -o cypress/reports/html
```

## 🎯 Intégration CI/CD

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Cypress run
        uses: cypress-io/github-action@v5
        with:
          working-directory: frontend
          start: npm run dev
          wait-on: 'http://localhost:3000'
          browser: chrome
```

## 📚 Ressources

- [Documentation Cypress](https://docs.cypress.io/)
- [Best Practices Cypress](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Examples](https://example.cypress.io/)

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. Créez un nouveau fichier `.cy.ts` dans `cypress/e2e/`
2. Suivez la convention de nommage existante
3. Utilisez les commandes personnalisées
4. Ajoutez des fixtures si nécessaire
5. Testez localement avant de commit

## 📝 License

MIT
