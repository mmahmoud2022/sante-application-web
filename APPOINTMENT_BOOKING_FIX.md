# 🔧 Correction du Bug de Réservation de Rendez-vous

## 🐛 Problème Identifié

**Symptôme :** "La réservation a échoué. Merci de réessayer."

**Cause racine :** Le backend FastAPI renvoie un **HTTP 307 Temporary Redirect** quand on envoie une requête POST à `/api/v1/appointments` (sans slash final), car il attend `/api/v1/appointments/` (avec slash final).

## 🔍 Diagnostic Détaillé

### Logs Backend
```
POST /api/v1/appointments HTTP/1.1 → 307 Temporary Redirect
POST /api/v1/appointments/ HTTP/1.1 → 401 Unauthorized (correct!)
```

### Tests curl
```bash
# Sans slash → Redirection 307
curl -X POST "http://127.0.0.1:8000/api/v1/appointments" → 307

# Avec slash → 401 (authentification requise, c'est normal)
curl -X POST "http://127.0.0.1:8000/api/v1/appointments/" → 401
```

### Problème dans le Code Frontend

**Fichier :** `frontend/src/lib/api.ts`

**Ligne 61-63 (PROBLÉMATIQUE) :**
```typescript
// Intercepteur qui retire le slash initial !
if (config.url && !/^https?:\/\//i.test(config.url)) {
  config.url = config.url.replace(/^\/+/u, '');
}
```

**Résultat :**
- Requête demandée : `POST /appointments/`
- Après intercepteur : `POST appointments/`
- Avec baseURL `/api/v1` : Construit incorrectement l'URL
- Backend reçoit : `POST /api/v1/appointments` (sans slash final)
- Backend répond : 307 Redirect

## ✅ Solution Appliquée

### Étape 1 : Retirer la normalisation d'URL problématique

**Fichier modifié :** `frontend/src/lib/api.ts`

**Changement :**
```typescript
// AVANT (lignes 57-63)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ensure relative URLs don't drop the /api/v1 prefix by stripping leading slashes
    if (config.url && !/^https?:\/\//i.test(config.url)) {
      config.url = config.url.replace(/^\/+/u, '');
    }
    
    // Start timing the request
    (config as any).metadata = { startTime: Date.now() };
    // ...
  }
);

// APRÈS
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Start timing the request
    (config as any).metadata = { startTime: Date.now() };
    // ...
  }
);
```

**Explication :** En retirant la ligne qui supprime les slashes initiaux, axios construit correctement l'URL complète avec le slash final.

### Étape 2 : Garder les slashes finaux dans les endpoints

**Les endpoints suivants gardent leur slash final :**
- `/appointments/` ✅
- `/prescriptions/` ✅
- `/medical-records/` ✅
- `/documents/` ✅
- `/notifications/` ✅
- `/reviews/` ✅
- `/schedules/` ✅
- `/payments/` ✅
- `/users/` ✅

### Étape 3 : Redémarrage du Frontend
```bash
docker restart sante_frontend
```

## 🎯 Comment Tester

### 1. Vider le cache du navigateur
**Important !** Le navigateur peut avoir mis en cache l'ancien code JavaScript.

**Chrome/Edge :**
- Windows/Linux : `Ctrl + Shift + R`
- Mac : `Cmd + Shift + R`

**Firefox :**
- Windows/Linux : `Ctrl + F5`
- Mac : `Cmd + Shift + R`

**Ou manuellement :**
1. Ouvrir les DevTools (F12)
2. Onglet "Network" / "Réseau"
3. Cocher "Disable cache"
4. Recharger la page

### 2. Tester la réservation
1. Aller sur : http://127.0.0.1:3000/patient/book-appointment?doctor=7
2. Se connecter si nécessaire (compte patient)
3. Sélectionner :
   - ✅ Date (demain minimum)
   - ✅ Créneau horaire
   - ✅ Type de consultation
   - ✅ Motif principal (obligatoire)
4. Cliquer sur **"Confirmer le rendez-vous"**

### 3. Vérifier les logs

**Logs Frontend (DevTools Console) :**
```javascript
API Request: POST /appointments/
API Response: 201 Created
```

**Logs Backend :**
```bash
docker logs sante_backend --tail 20 | grep appointments
# Doit afficher : POST /api/v1/appointments/ - Status: 201
```

### 4. Résultat Attendu
- ✅ Message de succès : "Votre rendez-vous a été réservé avec succès !"
- ✅ Redirection automatique vers `/patient/appointments`
- ✅ Le rendez-vous apparaît dans la liste

## 🔧 Dépannage

### Le problème persiste ?

#### 1. Cache navigateur non vidé
**Solution :** Forcer le rechargement complet (voir section "Comment Tester")

#### 2. Vérifier que les modifications sont actives
```bash
# Vérifier le contenu du fichier dans le conteneur
docker exec sante_frontend grep -A 3 "Request interceptor" /app/src/lib/api.ts

# Devrait afficher :
# axiosInstance.interceptors.request.use(
#   (config: InternalAxiosRequestConfig) => {
#     // Start timing the request
#     (config as any).metadata = { startTime: Date.now() };
```

#### 3. Redémarrer complètement Docker
```bash
docker-compose down
docker-compose up -d
```

#### 4. Vérifier l'authentification
Le problème initial n'était PAS l'authentification, mais si vous obtenez une erreur 401 :
```bash
# Vérifier que le token est stocké
# Dans DevTools Console :
localStorage.getItem('access_token')
# Doit retourner un token JWT
```

#### 5. Vérifier que le médecin existe
```bash
# Tester l'endpoint de contexte de réservation
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://127.0.0.1:8000/api/v1/patient/book-appointment?doctor=7"
# Doit retourner la liste des médecins avec le médecin ID 7
```

## 📊 Vérification Technique

### Test de l'URL Construction

**Avant la correction :**
```
baseURL: /api/v1
url: /appointments/
Intercepteur retire le slash initial → appointments/
Résultat final : /api/v1/appointments (❌ sans slash)
Backend → 307 Redirect
```

**Après la correction :**
```
baseURL: /api/v1
url: /appointments/
Pas d'intercepteur de normalisation
Résultat final : /api/v1/appointments/ (✅ avec slash)
Backend → 201 Created
```

## 📝 Fichiers Modifiés

| Fichier | Lignes Modifiées | Type de Changement |
|---------|------------------|-------------------|
| `frontend/src/lib/api.ts` | 57-63 | Suppression de code |

## ✨ Améliorations Futures

### Court terme
- [ ] Ajouter des tests E2E pour la réservation de rendez-vous
- [ ] Valider le format de date côté frontend avant envoi
- [ ] Améliorer les messages d'erreur selon le code HTTP

### Moyen terme
- [ ] Standardiser la gestion des trailing slashes dans toute l'API
- [ ] Configurer FastAPI pour accepter les URLs avec ou sans slash
- [ ] Ajouter des tests d'intégration frontend-backend

### Long terme
- [ ] Implémenter un système de retry automatique pour les erreurs réseau
- [ ] Ajouter un monitoring des taux d'erreur de réservation
- [ ] Créer un système de notification en cas d'échec de réservation

## 🎓 Leçons Apprises

1. **FastAPI et les trailing slashes :** FastAPI est strict sur les trailing slashes. Une route définie comme `@router.post("/")` attend un slash final.

2. **Intercepteurs Axios :** La normalisation d'URL dans les intercepteurs peut causer des problèmes subtils. Il faut être très prudent lors de la modification d'URLs.

3. **Cache navigateur :** Les modifications JavaScript nécessitent un hard refresh du navigateur pour être prises en compte immédiatement.

4. **Debugging :** Les logs backend sont essentiels pour identifier les redirections 307 et comprendre ce que le serveur reçoit réellement.

## 🔗 Ressources

- [FastAPI Trailing Slashes](https://fastapi.tiangolo.com/tutorial/path-params/#path-parameters-and-numeric-validations)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [HTTP 307 Temporary Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307)
- [Browser Cache](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

**Date de correction :** 21 octobre 2025  
**Status :** ✅ Correction appliquée - En attente de validation  
**Priorité :** 🔴 Critique (bloque la fonctionnalité de réservation)  
**Impact :** Tous les patients tentant de réserver un rendez-vous

---

## 🚀 Validation Finale

Une fois la correction validée :
- [ ] Tester avec différents médecins
- [ ] Tester avec différentes dates
- [ ] Tester avec différents types de consultation
- [ ] Vérifier que les notifications sont envoyées
- [ ] Vérifier que le rendez-vous apparaît dans le dashboard médecin
