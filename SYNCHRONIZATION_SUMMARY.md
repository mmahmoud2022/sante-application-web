# Résumé de Synchronisation Backend-Frontend

**Date**: 21 octobre 2025  
**Type**: Synchronisation des types et interfaces

---

## ✅ Modifications Effectuées

### 1. **Types TypeScript Synchronisés** (`frontend/src/types/index.ts`)

#### A. Énumérations Corrigées

**AppointmentType**:
```typescript
// ❌ AVANT
VIDEO = 'video',
HOME_VISIT = 'home_visit',

// ✅ APRÈS (aligné avec backend)
VIDEO_CALL = 'video_call',
PHONE_CALL = 'phone_call',
```

**NotificationType** - 7 valeurs ajoutées:
```typescript
APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
APPOINTMENT_DELAYED = 'appointment_delayed',
PRESCRIPTION_RENEWAL = 'prescription_renewal',
VACCINATION_DUE = 'vaccination_due',
PAYMENT_FAILED = 'payment_failed',
DOCUMENT_READY = 'document_ready',
SYSTEM_ALERT = 'system_alert',
```

#### B. Interface User Harmonisée

```typescript
// Champs renommés
phone_number → phone
profile_picture_url → profile_image
two_factor_enabled → mfa_enabled

// Champs ajoutés
address_line1, address_line2, state
```

#### C. Interface Appointment Complétée

```typescript
// Champ renommé
chief_complaint → reason
video_room_url → video_call_link

// Champs ajoutés (9 nouveaux champs)
video_call_room_id
reminder_sent
reminder_sent_at
cancelled_by
cancelled_at
prescription
```

#### D. Interface MedicalRecord Restructurée

```typescript
// Types changés (string → array)
allergies: string[] // au lieu de string
chronic_conditions: string[] // au lieu de string

// Champs avec structures complexes
medications: Array<{name, dosage, frequency}>
surgeries: Array<{name, date}>
vaccinations: Array<{name, date}>

// Champs renommés
current_medications → medications
previous_surgeries → surgeries
insurance_expiry_date → insurance_valid_until
emergency_contact_relationship → emergency_contact_relation

// Champs ajoutés
height_cm, weight_kg, notes
```

#### E. Interface Review Améliorée

```typescript
// Champs renommés
comment → review_text
is_verified_visit → verified_visit
is_hidden → is_published (logique inversée)

// Champs ajoutés
title
doctor_response_date
is_flagged
flagged_reason
```

#### F. Interface Prescription Complétée

```typescript
// Champs ajoutés
quantity
prescribed_date
last_renewed_at

// Champs renommés
pharmacy_notes → notes (backend n'a pas pharmacy_notes)
```

#### G. Interface DoctorSchedule Complétée

```typescript
// Champs ajoutés
buffer_time_minutes
max_patients_per_slot
location_address
is_available
is_video_consultation
recurrence_end_date
custom_rules
notes

// Champs supprimés
break_start_time, break_end_time, max_appointments (pas dans backend)
```

#### H. Interface Document Harmonisée

```typescript
// Champs renommés
uploaded_by_id → uploaded_by
file_url → file_path
file_size → file_size_bytes
is_shared_with_doctors → is_shared
is_verified → verified

// Champs ajoutés
shared_with
ocr_text
ocr_processed
document_date
tags
verified_by
verified_at
appointment_id
```

### 2. **Formulaires Mis à Jour**

**RegisterFormData**:
- `phone_number` → `phone`

**AppointmentFormData**:
- `chief_complaint` → `reason`

**ProfileFormData**:
- `phone_number` → `phone`
- `address` → `address_line1`, `address_line2`
- Ajout: `state`, `experience_years`

### 3. **Composants Modifiés**

**`frontend/src/app/patient/book-appointment/page.tsx`**:
- ✅ Remplacé `AppointmentType.VIDEO` → `AppointmentType.VIDEO_CALL`
- ✅ Remplacé `AppointmentType.HOME_VISIT` → `AppointmentType.PHONE_CALL`
- Libellé changé: "Visite à domicile" → "Consultation téléphonique"

---

## ⚠️ Actions Requises pour Finaliser la Synchronisation

### Fichiers Nécessitant des Modifications

#### 1. **Composants utilisant `phone_number`** (17 occurrences)
- `/app/doctor/profile/page.tsx` (4 occurrences)
- `/app/admin/users/page.tsx` (3 occurrences)
- `/app/patient/profile/page.tsx` (5 occurrences)
- `/app/register/page.tsx` (1 occurrence)
- `/app/settings/security/page.tsx` (2 occurrences)

**Action**: Remplacer `phone_number` par `phone` dans tous ces fichiers

#### 2. **Composants utilisant `chief_complaint`** (7 occurrences)
- `/app/doctor/appointments/page.tsx` (5 occurrences)
- `/app/doctor/dashboard/page.tsx` (1 occurrence)

**Action**: Remplacer `chief_complaint` par `reason`

#### 3. **Composants utilisant `profile_picture_url`** (2 occurrences)
- `/features/doctor-search/DoctorSearchPage.tsx` (2 occurrences)

**Action**: Remplacer `profile_picture_url` par `profile_image`

#### 4. **Composants utilisant anciens types Appointment**
- Vérifier tous les composants qui utilisent `video_room_url` → remplacer par `video_call_link`
- Vérifier les composants qui utilisent `is_video_consultation` (ce champ n'existe plus dans le backend)

---

## 📝 Script de Migration des Données (SQL)

### Migration pour AppointmentType

```sql
-- Mettre à jour les types de rendez-vous dans la base de données
-- SI vous avez des données existantes avec les anciens types

UPDATE appointments
SET appointment_type = 'video_call'
WHERE appointment_type = 'video';

UPDATE appointments
SET appointment_type = 'phone_call'
WHERE appointment_type = 'home_visit';
```

---

## 🔍 Vérifications à Effectuer

### Tests Frontend
```bash
cd frontend

# Vérifier les erreurs TypeScript
npm run type-check

# Exécuter les tests
npm run test

# Lancer l'application
npm run dev
```

### Tests Backend
```bash
cd backend

# Vérifier que l'API fonctionne
pytest tests/

# Lancer le serveur
uvicorn app.main:app --reload
```

---

## 🚨 Points d'Attention

### 1. **Breaking Changes**

Les changements suivants peuvent causer des erreurs dans le code existant:

- ❌ `AppointmentType.VIDEO` n'existe plus → Utiliser `AppointmentType.VIDEO_CALL`
- ❌ `AppointmentType.HOME_VISIT` n'existe plus → Utiliser `AppointmentType.PHONE_CALL`
- ❌ `user.phone_number` n'existe plus → Utiliser `user.phone`
- ❌ `appointment.chief_complaint` n'existe plus → Utiliser `appointment.reason`
- ❌ `review.comment` n'existe plus → Utiliser `review.review_text`

### 2. **Rétrocompatibilité API**

Le backend accepte actuellement les deux formats pour certains champs:
- ✅ `chief_complaint` ET `reason` sont acceptés (backend utilise `reason` en interne)
- ✅ La normalisation des types d'appointment est gérée côté backend

### 3. **Données Structurées**

**MedicalRecord** utilise maintenant des structures JSON:
- `allergies` doit être un tableau: `["Pénicilline", "Arachides"]`
- `medications` doit être un tableau d'objets: `[{name, dosage, frequency}]`

Si vous avez des données stockées en string, une migration sera nécessaire.

---

## 📦 Packages Recommandés

Pour faciliter la transformation des données entre frontend et backend:

```bash
npm install zod date-fns
```

**Utilisation de Zod** pour valider les réponses API:
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  phone: z.string().optional(),
  profile_image: z.string().optional(),
});

// Valider les données reçues du backend
const user = UserSchema.parse(apiResponse.data);
```

---

## ✅ Checklist de Finalisation

- [x] Types TypeScript synchronisés avec backend
- [x] Énumérations mises à jour
- [x] Interface User harmonisée
- [x] Interface Appointment complétée
- [x] Interface MedicalRecord restructurée
- [x] Interface Review corrigée
- [x] Interface Document harmonisée
- [x] Formulaires mis à jour
- [x] Page book-appointment corrigée
- [ ] Corriger tous les composants utilisant `phone_number`
- [ ] Corriger tous les composants utilisant `chief_complaint`
- [ ] Corriger tous les composants utilisant `profile_picture_url`
- [ ] Exécuter les tests TypeScript
- [ ] Tester l'application manuellement
- [ ] Mettre à jour la documentation API
- [ ] Migrer les données existantes si nécessaire

---

## 🎯 Prochaines Étapes

1. **Phase 1** (Priorité Haute - 2h):
   - Corriger les 17 occurrences de `phone_number`
   - Corriger les 7 occurrences de `chief_complaint`
   - Corriger les 2 occurrences de `profile_picture_url`
   - Tester l'application

2. **Phase 2** (Priorité Moyenne - 1h):
   - Ajouter la validation Zod pour les réponses API
   - Créer des fonctions utilitaires de transformation
   - Documenter les changements dans la documentation API

3. **Phase 3** (Priorité Faible - 30min):
   - Mettre à jour les tests E2E Cypress
   - Ajouter des tests pour les nouvelles valeurs NotificationType
   - Générer automatiquement les types avec openapi-typescript

---

## 📞 Support

Pour toute question ou problème lié à cette synchronisation:
- Consulter: `BACKEND_FRONTEND_INCONSISTENCIES.md`
- Documentation backend: `backend/app/schemas/`
- Documentation frontend: `frontend/src/types/index.ts`

**Dernière mise à jour**: 21 octobre 2025
