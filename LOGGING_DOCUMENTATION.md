# 📊 Système de Logging Frontend - Documentation

**Date**: 21 octobre 2025  
**Version**: 2.0.0  
**Statut**: ✅ Production Ready

---

## 📋 Vue d'Ensemble

Le système de logging frontend de l'application Santé Medical fournit une solution complète et structurée pour le logging, le monitoring et le debugging.

### Fonctionnalités Principales

✅ **Niveaux de Log Multiples** : ERROR, WARN, INFO, DEBUG  
✅ **Catégorisation** : 13 catégories spécialisées  
✅ **Performance Monitoring** : Mesure automatique des temps de réponse  
✅ **API Monitoring** : Tracking complet des appels API  
✅ **Error Boundary** : Capture des erreurs React  
✅ **Session Tracking** : Suivi unique par session utilisateur  
✅ **Context Enrichment** : Ajout automatique d'informations contextuelles  
✅ **Dev Tools** : Interface de debug en mode développement  
✅ **Production Ready** : Logs minimaux en production avec stockage des erreurs  

---

## 🎯 Architecture

### Composants Principaux

```
frontend/src/
├── lib/
│   ├── logger.ts           # Logger principal avec niveaux et catégories
│   ├── api-monitor.ts      # Monitoring des appels API
│   └── api.ts              # Client API avec instrumentation
├── components/
│   ├── ErrorBoundary.tsx   # Capture des erreurs React
│   └── DevTools.tsx        # Interface de debugging
```

---

## 📝 Utilisation

### 1. Logger de Base

```typescript
import logger, { LogCategory } from '@/lib/logger';

// Error logging (avec catégorie et erreur)
try {
  await someOperation();
} catch (error) {
  logger.error(
    'Operation failed',
    { userId: user.id, operation: 'someOperation' },
    error,
    LogCategory.API
  );
}

// Warning logging
logger.warn(
  'Low disk space detected',
  { availableSpace: '10GB' },
  LogCategory.GENERAL
);

// Info logging
logger.info(
  'User logged in successfully',
  { userId: user.id, method: 'email' },
  LogCategory.AUTH
);

// Debug logging (développement seulement)
logger.debug(
  'Component mounted',
  { componentName: 'Dashboard' },
  LogCategory.UI
);
```

### 2. Performance Monitoring

```typescript
import logger from '@/lib/logger';

// Méthode 1: Timer manuel
const endTimer = logger.startTimer('DataFetch');
await fetchData();
endTimer(); // Log automatique du temps écoulé

// Méthode 2: Log direct
const start = performance.now();
await processData();
const duration = performance.now() - start;
logger.performance('DataProcessing', duration, { rows: 1000 });
```

### 3. Error Boundary

```typescript
// app/layout.tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Custom error handling
            sendToAnalytics(error, errorInfo);
          }}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 4. API Monitoring

Le monitoring API est automatique via les intercepteurs Axios, mais vous pouvez aussi l'utiliser manuellement :

```typescript
import apiMonitor from '@/lib/api-monitor';

// Obtenir les métriques
const metrics = apiMonitor.getMetrics();
const summary = apiMonitor.getSummary();

// {
//   totalCalls: 150,
//   successRate: 96.7,
//   averageDuration: 234,
//   slowCalls: 3,
//   failedCalls: 5
// }

// Filtrer par endpoint
const loginMetrics = apiMonitor.getMetricsByEndpoint('/auth/login');

// Exporter pour debugging
const json = apiMonitor.exportMetrics();
console.log(json);
```

### 5. Dev Tools (Développement)

En mode développement, un bouton flottant apparaît en bas à droite :

```typescript
// app/layout.tsx
import DevTools from '@/components/DevTools';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <DevTools /> {/* Apparaît seulement en dev */}
      </body>
    </html>
  );
}
```

**Fonctionnalités DevTools** :
- 📋 Onglet Error Logs : Affiche toutes les erreurs
- 📊 Onglet API Metrics : Statistiques d'API en temps réel
- ⚡ Onglet Performance : Métriques de performance
- 💾 Export JSON : Télécharge tous les logs
- 🗑️ Clear : Efface tous les logs

---

## 🏷️ Catégories de Log

### LogCategory Enum

| Catégorie | Utilisation | Couleur |
|-----------|-------------|---------|
| `AUTH` | Authentification, tokens, sessions | Violet |
| `API` | Appels API, requêtes HTTP | Bleu |
| `UI` | Interactions UI, composants React | Vert |
| `NAVIGATION` | Routing, redirections | Orange |
| `FORM` | Validation de formulaires, soumissions | Violet clair |
| `PERFORMANCE` | Temps de chargement, optimisations | Rouge |
| `SECURITY` | Tentatives d'intrusion, XSS, CSRF | Rouge foncé |
| `VALIDATION` | Validation de données | Orange |
| `PAYMENT` | Transactions, paiements | Vert foncé |
| `NOTIFICATION` | Notifications, toasts, alertes | Cyan |
| `WEBSOCKET` | Connexions temps réel | Indigo |
| `STORAGE` | LocalStorage, SessionStorage, Cookies | Lime |
| `GENERAL` | Autres logs non catégorisés | Gris |

---

## 🎨 Exemples par Cas d'Usage

### Authentification

```typescript
import logger, { LogCategory } from '@/lib/logger';

// Login réussi
logger.info(
  'User logged in',
  {
    userId: user.id,
    email: user.email,
    method: 'email',
    rememberMe: true,
  },
  LogCategory.AUTH
);

// Login échoué
logger.warn(
  'Login failed: invalid credentials',
  {
    email: formData.email,
    ipAddress: req.ip,
  },
  LogCategory.SECURITY
);

// Token expiré
logger.info(
  'Token refresh successful',
  { userId: user.id },
  LogCategory.AUTH
);
```

### Formulaires

```typescript
import logger, { LogCategory } from '@/lib/logger';

// Validation échouée
logger.warn(
  'Form validation failed',
  {
    formName: 'appointmentBooking',
    errors: validationErrors,
  },
  LogCategory.FORM
);

// Soumission réussie
logger.info(
  'Form submitted successfully',
  {
    formName: 'appointmentBooking',
    appointmentId: result.id,
  },
  LogCategory.FORM
);
```

### Navigation

```typescript
import logger, { LogCategory } from '@/lib/logger';

// Page change
logger.debug(
  'Navigation to page',
  {
    from: previousPath,
    to: currentPath,
    userId: user?.id,
  },
  LogCategory.NAVIGATION
);

// Redirection
logger.info(
  'User redirected',
  {
    from: '/unauthorized-page',
    to: '/login',
    reason: 'Authentication required',
  },
  LogCategory.NAVIGATION
);
```

### API Calls

```typescript
import logger, { LogCategory } from '@/lib/logger';

// Avant l'appel (déjà fait automatiquement par api.ts)
logger.debug(
  'Fetching appointments',
  { userId: user.id, filters: queryParams },
  LogCategory.API
);

// Après succès
logger.info(
  'Appointments fetched',
  { count: appointments.length, duration: endTime - startTime },
  LogCategory.API
);

// Erreur API
logger.error(
  'Failed to fetch appointments',
  { userId: user.id, statusCode: error.response?.status },
  error,
  LogCategory.API
);
```

### Performance

```typescript
import logger from '@/lib/logger';

// Component mount
useEffect(() => {
  const endTimer = logger.startTimer('DashboardMount');
  
  // Load data...
  
  return () => endTimer();
}, []);

// Data processing
const processLargeDataset = async (data: any[]) => {
  const start = performance.now();
  
  const result = await heavyComputation(data);
  
  logger.performance('DataProcessing', performance.now() - start, {
    rows: data.length,
    resultSize: result.length,
  });
  
  return result;
};
```

### Paiements

```typescript
import logger, { LogCategory } from '@/lib/logger';

// Début de paiement
logger.info(
  'Payment initiated',
  {
    userId: user.id,
    amount: payment.amount,
    method: payment.method,
  },
  LogCategory.PAYMENT
);

// Succès
logger.info(
  'Payment completed successfully',
  {
    userId: user.id,
    transactionId: result.transactionId,
    amount: payment.amount,
  },
  LogCategory.PAYMENT
);

// Échec
logger.error(
  'Payment failed',
  {
    userId: user.id,
    amount: payment.amount,
    errorCode: error.code,
  },
  error,
  LogCategory.PAYMENT
);
```

---

## 🔧 Configuration

### Mode Développement

```typescript
// .env.local
NODE_ENV=development
```

**Comportement** :
- ✅ Tous les logs visibles dans la console
- ✅ Stack traces complètes
- ✅ DevTools activés
- ✅ Messages colorés avec emojis
- ✅ Context détaillé

### Mode Production

```typescript
// .env.production
NODE_ENV=production
```

**Comportement** :
- ✅ Seulement ERROR et WARN dans la console
- ✅ Pas de stack traces dans la console
- ✅ DevTools désactivés
- ✅ Stockage des erreurs dans sessionStorage
- ✅ Messages minimaux

---

## 📦 Intégration avec Services Externes

### Sentry

```typescript
// lib/logger.ts - dans sendToMonitoring()
import * as Sentry from '@sentry/nextjs';

private sendToMonitoring(entry: LogEntry): void {
  if (!this.isProduction) return;

  if (entry.level === LogLevel.ERROR) {
    Sentry.captureException(entry.error || new Error(entry.message), {
      level: 'error',
      tags: {
        category: entry.category,
      },
      contexts: {
        log: entry.context,
      },
      user: {
        id: entry.userId?.toString(),
      },
    });
  }
}
```

### LogRocket

```typescript
import LogRocket from 'logrocket';

private sendToMonitoring(entry: LogEntry): void {
  if (!this.isProduction) return;

  LogRocket.log(entry.level, entry.message, {
    category: entry.category,
    ...entry.context,
  });

  if (entry.level === LogLevel.ERROR) {
    LogRocket.captureException(entry.error || new Error(entry.message));
  }
}
```

### Google Analytics

```typescript
import { logEvent } from 'firebase/analytics';

private sendToMonitoring(entry: LogEntry): void {
  if (entry.level === LogLevel.ERROR) {
    logEvent(analytics, 'exception', {
      description: entry.message,
      fatal: true,
      category: entry.category,
    });
  }
}
```

---

## 🎓 Bonnes Pratiques

### ✅ DO

1. **Toujours utiliser les catégories appropriées**
   ```typescript
   logger.error('Payment failed', context, error, LogCategory.PAYMENT);
   ```

2. **Enrichir avec du contexte**
   ```typescript
   logger.error('Failed to load user', { userId, email }, error);
   ```

3. **Logger les événements importants**
   ```typescript
   logger.info('Critical threshold reached', { value: 95 }, LogCategory.PERFORMANCE);
   ```

4. **Utiliser les timers pour les opérations longues**
   ```typescript
   const endTimer = logger.startTimer('DatabaseQuery');
   await query();
   endTimer();
   ```

### ❌ DON'T

1. **Ne pas logger les données sensibles**
   ```typescript
   // ❌ BAD
   logger.info('User logged in', { password: user.password });
   
   // ✅ GOOD
   logger.info('User logged in', { userId: user.id });
   ```

2. **Ne pas logger dans des boucles serrées**
   ```typescript
   // ❌ BAD
   data.forEach(item => logger.debug('Processing', { item }));
   
   // ✅ GOOD
   logger.debug('Processing batch', { count: data.length });
   ```

3. **Ne pas utiliser console.log directement**
   ```typescript
   // ❌ BAD
   console.log('Something happened');
   
   // ✅ GOOD
   logger.info('Something happened');
   ```

---

## 📊 Métriques et Monitoring

### Visualisation des Métriques

```typescript
// Obtenir le résumé API
const summary = apiMonitor.getSummary();
console.log(`
  Total API Calls: ${summary.totalCalls}
  Success Rate: ${summary.successRate.toFixed(2)}%
  Average Duration: ${summary.averageDuration.toFixed(0)}ms
  Slow Calls (>2s): ${summary.slowCalls}
  Failed Calls: ${summary.failedCalls}
`);

// Obtenir les erreurs stockées
const errors = logger.getStoredErrors();
console.log(`Total errors: ${errors.length}`);

// Obtenir les métriques de performance
const perfMetrics = logger.getPerformanceMetrics();
const avgPerf = perfMetrics.reduce((sum, m) => sum + m.duration, 0) / perfMetrics.length;
console.log(`Average operation time: ${avgPerf.toFixed(0)}ms`);
```

---

## 🐛 Debugging

### Accès aux Logs en Production

Si vous avez besoin d'accéder aux logs en production pour debugging :

```typescript
// Dans la console du navigateur
const errors = JSON.parse(sessionStorage.getItem('error_logs') || '[]');
console.table(errors);

// Copier dans le clipboard
copy(sessionStorage.getItem('error_logs'));
```

### Export de Debug

```typescript
// Dans DevTools ou dans le code
const debugData = {
  errors: logger.getStoredErrors(),
  apiMetrics: apiMonitor.exportMetrics(),
  performanceMetrics: logger.getPerformanceMetrics(),
  timestamp: new Date().toISOString(),
};

// Télécharger comme fichier
const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `debug-${Date.now()}.json`;
a.click();
```

---

## 🔄 Migration depuis Console.log

### Avant

```typescript
console.log('User logged in');
console.error('Something broke', error);
console.warn('This is deprecated');
console.debug('Value:', value);
```

### Après

```typescript
import logger, { LogCategory } from '@/lib/logger';

logger.info('User logged in', { userId }, LogCategory.AUTH);
logger.error('Something broke', { userId }, error, LogCategory.GENERAL);
logger.warn('This is deprecated', { feature: 'oldMethod' }, LogCategory.GENERAL);
logger.debug('Value:', { value }, LogCategory.GENERAL);
```

---

## 📚 Ressources

### Fichiers de Référence

- `frontend/src/lib/logger.ts` - Logger principal
- `frontend/src/lib/api-monitor.ts` - Monitoring API
- `frontend/src/lib/api.ts` - Client API instrumenté
- `frontend/src/components/ErrorBoundary.tsx` - Error boundary
- `frontend/src/components/DevTools.tsx` - Outils de debug

### Documentation Externe

- [Sentry Documentation](https://docs.sentry.io/)
- [LogRocket Documentation](https://docs.logrocket.com/)
- [Google Analytics](https://developers.google.com/analytics)

---

## 🎉 Conclusion

Le système de logging est maintenant production-ready avec :

✅ Logging structuré et catégorisé  
✅ Monitoring API automatique  
✅ Performance tracking  
✅ Error boundary React  
✅ DevTools pour le debugging  
✅ Support pour les services externes  
✅ Documentation complète  

**Version**: 2.0.0  
**Dernière mise à jour**: 21 octobre 2025  
**Statut**: ✅ Production Ready
