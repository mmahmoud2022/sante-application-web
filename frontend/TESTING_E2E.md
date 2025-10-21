# Guide de Tests End-to-End (E2E)

## 🎯 Vue d'ensemble

Suite complète de tests E2E pour l'application Santé Medical, couvrant :
- ✅ **155+ tests** répartis sur 10 catégories
- ✅ **3 navigateurs** : Chrome, Firefox, Edge
- ✅ **3 viewports** : Mobile, Tablette, Desktop
- ✅ Tests d'accessibilité, performance, sécurité
- ✅ Intégration CI/CD avec GitHub Actions

## 📦 Installation rapide

```bash
cd frontend
npm install
```

## 🚀 Lancement des tests

### Mode interactif (recommandé pour le développement)

```bash
npm run test:e2e
```

### Mode headless (pour CI/CD)

```bash
npm run test:e2e:headless
```

### Avec le script helper

```bash
# Tous les tests
./scripts/run-e2e-tests.sh

# Firefox en mode headless
./scripts/run-e2e-tests.sh -b firefox -h

# Test spécifique
./scripts/run-e2e-tests.sh -s cypress/e2e/auth.cy.ts

# Environment staging en parallèle
./scripts/run-e2e-tests.sh -e staging -p
```

## 📋 Catégories de tests

### 1. Authentication (15 tests)
Tests de connexion, inscription, réinitialisation de mot de passe.

```bash
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

### 2. Patient Dashboard (25 tests)
Tests du tableau de bord patient : rendez-vous, prescriptions, documents.

```bash
npx cypress run --spec "cypress/e2e/patient-dashboard.cy.ts"
```

### 3. Doctor Dashboard (22 tests)
Tests du tableau de bord médecin : patients, consultations, horaires.

```bash
npx cypress run --spec "cypress/e2e/doctor-dashboard.cy.ts"
```

### 4. Admin Dashboard (18 tests)
Tests du tableau de bord admin : gestion utilisateurs, paramètres.

```bash
npx cypress run --spec "cypress/e2e/admin-dashboard.cy.ts"
```

### 5. Navigation (12 tests)
Tests de navigation et routing.

```bash
npx cypress run --spec "cypress/e2e/navigation.cy.ts"
```

### 6. Accessibility (10 tests)
Tests d'accessibilité : clavier, lecteurs d'écran, ARIA.

```bash
npx cypress run --spec "cypress/e2e/accessibility.cy.ts"
```

### 7. Responsive Design (15 tests)
Tests sur différents viewports.

```bash
npx cypress run --spec "cypress/e2e/responsive.cy.ts"
```

### 8. Performance (8 tests)
Tests de performance et optimisation.

```bash
npx cypress run --spec "cypress/e2e/performance.cy.ts"
```

### 9. Error Handling (16 tests)
Tests de gestion d'erreurs.

```bash
npx cypress run --spec "cypress/e2e/error-handling.cy.ts"
```

### 10. Security (14 tests)
Tests de sécurité : XSS, CSRF, injections.

```bash
npx cypress run --spec "cypress/e2e/security.cy.ts"
```

## 🛠️ Commandes personnalisées

### Login
```typescript
// Login avec credentials
cy.login('patient@example.com', 'password123');

// Login rapide par rôle
cy.loginAs('patient');
cy.loginAs('doctor');
cy.loginAs('admin');
```

### Vérifications
```typescript
// Vérifier un toast
cy.verifyToast('success', 'Rendez-vous créé');

// Attendre une API
cy.intercept('GET', '**/appointments/*').as('getAppointments');
cy.waitForApi('@getAppointments');

// Vérifier le chargement
cy.checkLoadingState();
```

### Formulaires
```typescript
// Remplir un champ
cy.fillFormField('email', 'test@example.com');
```

## 📁 Fixtures disponibles

- `auth-response.json` - Réponse d'authentification
- `patient-user.json` - Données patient
- `doctor-user.json` - Données médecin
- `appointments.json` - Liste de rendez-vous
- `prescriptions.json` - Liste d'ordonnances
- `schedules.json` - Horaires médecin
- `available-slots.json` - Créneaux disponibles
- `medical-records.json` - Dossiers médicaux
- `test-document.pdf` - Document de test

### Utilisation des fixtures

```typescript
// Charger une fixture
cy.fixture('appointments.json').then((appointments) => {
  // Utiliser les données
});

// Intercepter avec fixture
cy.intercept('GET', '**/appointments/*', { 
  fixture: 'appointments.json' 
}).as('getAppointments');
```

## 🎨 Tests par viewport

```bash
# Mobile (iPhone X)
npx cypress run --config viewportWidth=375,viewportHeight=667

# Tablet (iPad)
npx cypress run --config viewportWidth=768,viewportHeight=1024

# Desktop
npx cypress run --config viewportWidth=1920,viewportHeight=1080
```

## 🌐 Tests par navigateur

```bash
# Chrome (default)
npx cypress run --browser chrome

# Firefox
npx cypress run --browser firefox

# Edge
npx cypress run --browser edge
```

## 🔄 Intégration CI/CD

Le fichier `.github/workflows/e2e-tests.yml` configure :

- ✅ Exécution sur push et pull request
- ✅ Tests sur Chrome, Firefox, Edge
- ✅ Tests mobile séparés
- ✅ Upload des screenshots et vidéos
- ✅ Commentaires automatiques sur PR

## 📊 Rapports de tests

Les rapports sont générés dans :
- `cypress/screenshots/` - Captures d'écran des échecs
- `cypress/videos/` - Vidéos des exécutions
- `cypress/reports/` - Rapports JSON/HTML

## 🐛 Debugging

### Mode interactif
Le meilleur moyen de debugger est d'utiliser le mode interactif :
```bash
npm run test:e2e
```

### Debug dans le code
```typescript
// Pauser l'exécution
cy.pause();

// Debugger un élément
cy.get('[data-testid="button"]').debug().click();

// Log personnalisé
cy.log('Valeur actuelle:', value);

// Screenshot manuel
cy.screenshot('debug-point');
```

### Logs détaillés
```bash
DEBUG=cypress:* npm run test:e2e:headless
```

## ✅ Checklist avant commit

- [ ] Tous les tests passent localement
- [ ] Nouveaux tests ajoutés pour nouvelles fonctionnalités
- [ ] Tests existants mis à jour si nécessaire
- [ ] Pas de `cy.wait()` avec durée fixe
- [ ] Utilisation de `data-testid` pour les sélecteurs
- [ ] Documentation mise à jour

## 🔗 Ressources

- [Documentation Cypress](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Reference](https://docs.cypress.io/api/table-of-contents)

## 📞 Support

Pour toute question :
1. Consulter la documentation dans `cypress/README.md`
2. Vérifier les exemples dans les tests existants
3. Ouvrir une issue sur GitHub

---

**Dernière mise à jour** : 21 octobre 2025
