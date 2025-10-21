# Interface Admin - Documentation

## Vue d'ensemble

Le système administrateur a été créé pour gérer les comptes docteurs et assurer la sécurité de la plateforme. Les administrateurs peuvent approuver ou rejeter les demandes d'inscription des docteurs.

## Fonctionnalités

### 1. Enregistrement Admin Sécurisé
- **URL**: `/admin/register`
- **Sécurité**: Nécessite un code secret administrateur (`ADMIN_SECRET`)
- **Processus**:
  1. L'admin entre ses informations personnelles
  2. Fournit le code secret administrateur
  3. Le backend valide le code avant de créer le compte

### 2. Connexion Admin
- **URL**: `/admin/login`
- **Processus**:
  1. L'admin se connecte avec email/mot de passe
  2. Redirection automatique vers `/admin/verify-doctors`

### 3. Vérification des Docteurs
- **URL**: `/admin/verify-doctors`
- **Fonctionnalités**:
  - Voir la liste de tous les docteurs
  - Filtrer par statut (tous, en attente, vérifiés)
  - Rechercher par nom, email, spécialisation
  - Approuver un docteur ✅
  - Rejeter/Supprimer un docteur ❌
  - Statistiques en temps réel

### 4. Login Docteur Amélioré
- **Nouveau comportement**:
  - Les docteurs non vérifiés peuvent se connecter
  - Un message détaillé s'affiche expliquant que leur compte est en attente
  - Message animé avec temps de traitement estimé (24-48h)
  - Design moderne avec gradient et animations

## Configuration Backend

### Variables d'Environnement

Fichier: `backend/.env`

```env
# Code secret pour créer des comptes admin
ADMIN_SECRET=ADMIN_SECRET_2025_CHANGE_IN_PRODUCTION

# IMPORTANT: Changez cette valeur en production !
# Utilisez une valeur longue et complexe
```

### Fichiers Modifiés

1. **`backend/app/core/config.py`**
   - Ajout de `ADMIN_SECRET: str`

2. **`backend/app/schemas/user.py`**
   - Ajout de `admin_secret: Optional[str]` dans `UserCreate`

3. **`backend/app/api/v1/endpoints/auth.py`**
   - Validation du `admin_secret` lors de l'enregistrement admin
   - Retourne erreur `INVALID_ADMIN_SECRET` si le code est incorrect

## Interface Frontend

### Pages Créées

1. **`/admin/login`**
   - Design rouge/orange avec thème sécurité
   - Icône bouclier (Shield)
   - Champ admin-secret simplifié (validation côté serveur)

2. **`/admin/register`**
   - Formulaire complet avec validation
   - Champ admin-secret en position prioritaire
   - Confirmation de mot de passe
   - Design cohérent avec le thème admin

3. **`/admin/verify-doctors`**
   - Interface de gestion complète
   - Cards colorées pour les stats
   - Liste détaillée des docteurs
   - Actions rapides (approuver/rejeter)
   - Recherche et filtres en temps réel

### Modifications Existantes

1. **`/login/page.tsx`**
   - Nouveau message de vérification en cours pour docteurs
   - Design amélioré avec animations
   - Informations sur le délai de traitement

2. **`contexts/AuthContext.tsx`**
   - Redirection admin vers `/admin/verify-doctors`
   - Gestion de l'erreur `VERIFICATION_PENDING` pour docteurs

## Utilisation

### Première Configuration

1. **Définir le code secret admin**:
   ```bash
   cd backend
   # Éditer le fichier .env
   ADMIN_SECRET=votre-code-secret-ultra-securise-2025
   ```

2. **Rebuild Docker**:
   ```bash
   cd ..
   docker compose up --build -d
   ```

3. **Créer le premier compte admin**:
   - Aller sur `http://localhost:3000/admin/register`
   - Remplir le formulaire
   - Entrer le code secret défini dans `.env`
   - S'enregistrer

### Workflow de Vérification des Docteurs

1. **Un docteur s'inscrit**:
   - Va sur `/register`
   - Choisit "Praticien de santé"
   - Remplit le formulaire avec licence, spécialisation, etc.
   - Son compte est créé avec `is_verified = false`

2. **Le docteur essaie de se connecter**:
   - Va sur `/login`
   - Entre email/mot de passe
   - Voit un message animé : "Vérification en cours, veuillez patienter"
   - Ne peut pas accéder au dashboard

3. **L'admin vérifie le docteur**:
   - Se connecte sur `/admin/login`
   - Est redirigé vers `/admin/verify-doctors`
   - Voit la liste des docteurs en attente
   - Examine les informations (nom, email, spécialisation, licence)
   - Clique sur ✅ pour approuver OU ❌ pour rejeter

4. **Après approbation**:
   - Le champ `is_verified` passe à `true`
   - Le docteur peut maintenant se connecter normalement
   - Redirection vers `/doctor/dashboard`

## Sécurité

### Bonnes Pratiques

1. **Code Secret Admin**:
   - ⚠️ NE JAMAIS committer le vrai code secret dans Git
   - Utiliser un gestionnaire de secrets en production
   - Changer le code régulièrement
   - Utiliser au minimum 32 caractères aléatoires

2. **Production**:
   ```env
   # Exemple de code sécurisé
   ADMIN_SECRET=$(openssl rand -base64 32)
   ```

3. **Accès**:
   - Limiter le nombre d'admins
   - Enregistrer toutes les actions admin (logs)
   - Activer 2FA pour les comptes admin (future feature)

### API Endpoints Utilisés

```typescript
// Vérifier un docteur
POST /api/v1/users/{doctorId}/verify
Authorization: Bearer {admin_token}

// Rejeter/Supprimer un docteur
DELETE /api/v1/users/{doctorId}
Authorization: Bearer {admin_token}

// Lister tous les docteurs
GET /api/v1/users/doctors
Authorization: Bearer {admin_token}
```

## Design

### Thème Admin
- **Couleurs**: Rouge (#EF4444) et Orange (#F97316)
- **Icône**: Shield (bouclier) pour la sécurité
- **Style**: Gradients, ombres prononcées, borders épaisses
- **Dark Mode**: Support complet avec classes Tailwind

### Message Docteur
- **Animation**: Spinner rotatif avec point pulsant
- **Couleurs**: Jaune/Orange pour l'attente
- **Informations**: Délai estimé, statut, message rassurant
- **Icons**: Emoji médical 🩺, horloge ⏱️

## Tests

### Scénarios de Test

1. **Enregistrement admin avec mauvais code**:
   - Résultat attendu: "Code secret administrateur invalide"

2. **Login non-admin sur /admin/login**:
   - Résultat attendu: "Accès refusé : vous n'êtes pas administrateur"

3. **Docteur non vérifié se connecte**:
   - Résultat attendu: Message "Vérification en cours"

4. **Admin approuve un docteur**:
   - Résultat attendu: Docteur passe à "Vérifié", peut se connecter

5. **Admin rejette un docteur**:
   - Résultat attendu: Compte supprimé, confirmation demandée

## Prochaines Améliorations

- [ ] Dashboard admin avec statistiques globales
- [ ] Notifications email aux docteurs (approbation/rejet)
- [ ] Historique des actions admin
- [ ] Gestion des patients par admin
- [ ] Système de logs détaillé
- [ ] 2FA pour comptes admin
- [ ] Bulk actions (approuver plusieurs docteurs)
- [ ] Export CSV de la liste des docteurs

## Support

Pour toute question ou problème:
1. Vérifier les logs Docker: `docker compose logs backend`
2. Vérifier la console browser (F12)
3. Consulter la documentation API: `http://localhost:8000/docs`

---

**Date de création**: 20 octobre 2025  
**Version**: 1.0.0  
**Auteur**: Système Santé
