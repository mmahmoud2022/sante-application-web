# Guide de Débogage - Prescriptions Non Visibles

## Problème Identifié
Les prescriptions créées par les docteurs ne s'affichent pas chez les patients concernés.

## Analyse Effectuée

### ✅ Code Backend Vérifié
- **Endpoint de création** (`POST /api/v1/prescriptions/`) : Correctement configuré
  - Reçoit `patient_id` dans le payload
  - Enregistre avec `doctor_id` du docteur connecté
  - Statut par défaut : `ACTIVE`
  
- **Endpoint de liste** (`GET /api/v1/prescriptions/`) : Correctement configuré
  - Filtre automatiquement par `patient_id` pour les patients
  - Filtre automatiquement par `doctor_id` pour les docteurs

### ✅ Code Frontend Vérifié
- **Création (Doctor)** : Payload correct avec `patient_id` inclus
- **Affichage (Patient)** : Appel API sans paramètres (filtrage côté backend)

### 🔍 État de la Base de Données
```sql
-- Aucune prescription trouvée dans la base
SELECT * FROM prescriptions; -- 0 rows
```

Cela indique que soit:
1. Aucune prescription n'a été créée
2. Les prescriptions sont créées mais supprimées immédiatement
3. Une erreur silencieuse empêche la création

## Logs de Débogage Ajoutés

### Frontend - Doctor Create Page
```typescript
// Logs ajoutés dans handleSubmit():
console.log('🔍 DEBUG: Creating prescription with payload:', payload);
console.log('✅ DEBUG: Prescription creation results:', results);
console.error('❌ DEBUG: Prescription creation error:', error);
```

### Frontend - Patient Prescriptions Page
```typescript
// Logs ajoutés dans loadPrescriptions():
console.log('🔍 DEBUG: Loading prescriptions for patient:', user?.id);
console.log('✅ DEBUG: Prescription API response:', response.data);
console.log('📋 DEBUG: Parsed prescriptions list:', prescriptionsList);
console.log('📊 DEBUG: Number of prescriptions:', prescriptionsList.length);
```

### Backend - Prescriptions Endpoint
```python
# Logs ajoutés dans create_prescription():
print(f"🔍 DEBUG: Creating prescription - Doctor: {current_user.id}, Patient: {prescription.patient_id}")
print(f"📋 DEBUG: Prescription data: {prescription.dict()}")
print(f"💾 DEBUG: Saving prescription to database - Patient ID: {db_prescription.patient_id}, Doctor ID: {db_prescription.doctor_id}")
print(f"✅ DEBUG: Prescription created successfully - ID: {db_prescription.id}")

# Logs ajoutés dans list_prescriptions():
print(f"🔍 DEBUG: Listing prescriptions - User: {current_user.id}, Role: {current_user.role}")
print(f"👤 DEBUG: Filtering by patient_id: {current_user.id}")
print(f"📊 DEBUG: Found {len(prescriptions)} prescriptions")
```

## Instructions de Test

### Étape 1: Vérifier les Logs Backend
```bash
# Voir les logs du backend en temps réel
docker logs -f sante_backend
```

### Étape 2: Test Complet du Flux

#### A. Se Connecter en tant que Docteur
1. Accéder à http://localhost:3000/login
2. Se connecter avec un compte docteur (par exemple: `mmm@example.com` ou `alpha@example.com`)
3. Aller sur `/doctor/prescriptions/create`

#### B. Créer une Prescription
1. Sélectionner un patient (par exemple: patient ID 1, 4, ou 5)
2. Remplir les champs:
   - Medication name: "Paracétamol"
   - Dosage: "500mg"
   - Frequency: "3 fois par jour"
   - Duration: 7 jours
3. Cliquer sur "Create Prescription"
4. **Ouvrir la console du navigateur** (F12) et vérifier:
   - `🔍 DEBUG: Creating prescription with payload:` → Vérifier que `patient_id` est présent
   - `✅ DEBUG: Prescription creation results:` → Vérifier que l'API retourne un ID

#### C. Vérifier les Logs Backend
Dans le terminal avec `docker logs -f sante_backend`, chercher:
```
🔍 DEBUG: Creating prescription - Doctor: X, Patient: Y
📋 DEBUG: Prescription data: {...}
💾 DEBUG: Saving prescription to database - Patient ID: Y, Doctor ID: X
✅ DEBUG: Prescription created successfully - ID: Z
```

#### D. Vérifier la Base de Données
```bash
docker exec sante_postgres psql -U sante_user -d sante_db -c "SELECT id, patient_id, doctor_id, medication_name, status FROM prescriptions;"
```

#### E. Se Connecter en tant que Patient
1. Se déconnecter du compte docteur
2. Se connecter avec le compte patient utilisé (par exemple: `mm@example.com`, `zo@example.com`, ou `test@example.com`)
3. Aller sur `/patient/prescriptions`
4. **Ouvrir la console du navigateur** (F12) et vérifier:
   - `🔍 DEBUG: Loading prescriptions for patient:` → Vérifier l'ID du patient
   - `✅ DEBUG: Prescription API response:` → Voir ce que l'API retourne
   - `📊 DEBUG: Number of prescriptions:` → Nombre de prescriptions

#### F. Vérifier les Logs Backend (Patient)
Dans le terminal avec `docker logs -f sante_backend`, chercher:
```
🔍 DEBUG: Listing prescriptions - User: Y, Role: patient
👤 DEBUG: Filtering by patient_id: Y
📊 DEBUG: Found N prescriptions
  - Prescription ID: Z, Patient: Y, Doctor: X, Status: active
```

## Scénarios Possibles

### Scénario 1: Prescription Créée Mais Non Visible
**Symptôme**: Les logs backend montrent une création réussie, mais le patient ne voit rien.

**Causes possibles**:
- ❌ Le `patient_id` dans la prescription ne correspond pas à l'ID du patient connecté
- ❌ Le filtre côté backend ne fonctionne pas correctement
- ❌ Le frontend ne parse pas correctement la réponse

**Solution**: Vérifier les logs pour comparer les IDs

### Scénario 2: Erreur Silencieuse lors de la Création
**Symptôme**: Pas de logs de création dans le backend.

**Causes possibles**:
- ❌ Erreur de validation côté frontend (champs manquants)
- ❌ Erreur réseau
- ❌ Token d'authentification invalide

**Solution**: Vérifier les logs frontend et les erreurs réseau dans l'onglet Network

### Scénario 3: Prescription Créée avec Mauvais Statut
**Symptôme**: Prescription créée mais avec un statut qui la rend invisible.

**Causes possibles**:
- ❌ Statut par défaut non configuré à `ACTIVE`
- ❌ Filtre sur le statut côté backend

**Solution**: Vérifier le statut dans la base de données

## Commandes Utiles

### Voir les 10 dernières prescriptions
```bash
docker exec sante_postgres psql -U sante_user -d sante_db -c "SELECT id, patient_id, doctor_id, medication_name, status, prescribed_date FROM prescriptions ORDER BY id DESC LIMIT 10;"
```

### Voir tous les utilisateurs
```bash
docker exec sante_postgres psql -U sante_user -d sante_db -c "SELECT id, first_name, last_name, email, role FROM users;"
```

### Supprimer une prescription de test
```bash
docker exec sante_postgres psql -U sante_user -d sante_db -c "DELETE FROM prescriptions WHERE id = X;"
```

### Voir les logs en temps réel
```bash
# Backend
docker logs -f sante_backend

# Frontend
docker logs -f sante_frontend
```

## Prochaines Étapes

Après avoir suivi les étapes de test:

1. **Si la prescription est créée** → Vérifier pourquoi elle n'apparaît pas côté patient
2. **Si la prescription n'est pas créée** → Vérifier les erreurs frontend/backend
3. **Si tout fonctionne** → Supprimer les logs de débogage

## Nettoyage des Logs

Une fois le problème résolu, supprimer les `console.log` et `print` ajoutés:
- `/frontend/src/app/doctor/prescriptions/create/page.tsx`
- `/frontend/src/app/patient/prescriptions/page.tsx`
- `/backend/app/api/v1/endpoints/prescriptions.py`
