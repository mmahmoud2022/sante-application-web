# 🚀 Quick Start - Tests E2E

## Installation (30 secondes)

```bash
cd frontend
npm install
```

## Lancer les tests (10 secondes)

### Mode visuel (recommandé) 👁️
```bash
npm run test:e2e
```

### Mode automatique 🤖
```bash
npm run test:e2e:headless
```

## Tests disponibles

| Catégorie | Tests | Commande |
|-----------|-------|----------|
| 🔐 Auth | 15 | `npx cypress run --spec "cypress/e2e/auth.cy.ts"` |
| 🏥 Patient | 25 | `npx cypress run --spec "cypress/e2e/patient-dashboard.cy.ts"` |
| 👨‍⚕️ Doctor | 22 | `npx cypress run --spec "cypress/e2e/doctor-dashboard.cy.ts"` |
| 👑 Admin | 18 | `npx cypress run --spec "cypress/e2e/admin-dashboard.cy.ts"` |
| 🧭 Navigation | 12 | `npx cypress run --spec "cypress/e2e/navigation.cy.ts"` |
| ♿ Accessibility | 10 | `npx cypress run --spec "cypress/e2e/accessibility.cy.ts"` |
| 📱 Responsive | 15 | `npx cypress run --spec "cypress/e2e/responsive.cy.ts"` |
| ⚡ Performance | 8 | `npx cypress run --spec "cypress/e2e/performance.cy.ts"` |
| ❌ Errors | 16 | `npx cypress run --spec "cypress/e2e/error-handling.cy.ts"` |
| 🔒 Security | 14 | `npx cypress run --spec "cypress/e2e/security.cy.ts"` |

**Total : 155+ tests**

## Script Helper

```bash
# Tout exécuter
./scripts/run-e2e-tests.sh

# Firefox headless
./scripts/run-e2e-tests.sh -b firefox -h

# Test spécifique
./scripts/run-e2e-tests.sh -s cypress/e2e/auth.cy.ts

# Environnement staging
./scripts/run-e2e-tests.sh -e staging
```

## Commandes personnalisées

```typescript
// Login rapide
cy.loginAs('patient')  // ou 'doctor', 'admin'

// Vérifier notification
cy.verifyToast('success', 'Message')

// Attendre API
cy.intercept('GET', '**/api/**').as('apiCall')
cy.waitForApi('@apiCall')
```

## Viewports

```bash
# Mobile
npx cypress run --config viewportWidth=375,viewportHeight=667

# Tablet
npx cypress run --config viewportWidth=768,viewportHeight=1024

# Desktop (default)
npm run test:e2e:headless
```

## Navigateurs

```bash
# Chrome (default)
npm run test:e2e:headless

# Firefox
npx cypress run --browser firefox

# Edge
npx cypress run --browser edge
```

## Structure des fichiers

```
frontend/
├── cypress/
│   ├── e2e/              # 📝 Tests (10 fichiers)
│   ├── fixtures/         # 📦 Données test (10 fichiers)
│   ├── support/          # 🛠️ Config & helpers
│   │   ├── commands.ts   # Commandes custom
│   │   ├── helpers.ts    # Fonctions utilitaires
│   │   └── e2e.ts       # Configuration
│   ├── README.md         # 📚 Doc complète
│   └── ADVANCED_EXAMPLES.md  # 🎓 Exemples avancés
├── scripts/
│   └── run-e2e-tests.sh  # 🚀 Script helper
├── TESTING_E2E.md        # 📖 Guide E2E
└── cypress.config.ts     # ⚙️ Configuration
```

## Debugging

### Mode interactif
```bash
npm run test:e2e  # Ouvre l'interface Cypress
```

### Dans le code
```typescript
cy.pause()        // Pause l'exécution
cy.debug()        // Debug un élément
cy.screenshot()   # Capture d'écran
```

### Logs
```bash
DEBUG=cypress:* npm run test:e2e:headless
```

## Résultats

Les résultats sont dans :
- `cypress/screenshots/` - Captures d'erreurs
- `cypress/videos/` - Vidéos des tests
- `cypress/reports/` - Rapports JSON/HTML

## CI/CD

Le workflow GitHub Actions est déjà configuré dans :
`.github/workflows/e2e-tests.yml`

S'exécute automatiquement sur :
- ✅ Push vers `main` ou `develop`
- ✅ Pull requests
- ✅ 3 navigateurs en parallèle
- ✅ Tests mobile séparés

## Aide

```bash
# Voir l'aide du script
./scripts/run-e2e-tests.sh --help

# Voir les options Cypress
npx cypress --help
```

## Documentation complète

- 📚 [README Cypress](./cypress/README.md)
- 📖 [Guide E2E](./TESTING_E2E.md)
- 🎓 [Exemples avancés](./cypress/ADVANCED_EXAMPLES.md)
- 📝 [Résumé implémentation](../E2E_IMPLEMENTATION_SUMMARY.md)

## Support

- [Documentation Cypress](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Discord Cypress](https://discord.gg/cypress)

---

**🎉 Prêt à tester !** Lancez `npm run test:e2e` pour commencer.
