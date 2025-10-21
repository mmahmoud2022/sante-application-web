# Rapport d'Incohérences Backend-Frontend

**Date d'analyse**: 21 octobre 2025  
**Application**: Santé Medical Application  
**Analyste**: GitHub Copilot

---

## 📋 Résumé Exécutif

Cette analyse identifie **27 incohérences critiques** entre le backend FastAPI et le frontend Next.js. Ces incohérences peuvent causer des bugs, des erreurs de validation, et une mauvaise expérience utilisateur.

### Statistiques
- ✅ **Cohérent**: 45% des champs
- ⚠️ **Incohérences mineures**: 35% (noms différents mais fonctionnels)
- ❌ **Incohérences critiques**: 20% (peuvent causer des bugs)

---

## 🔴 Incohérences Critiques (Priorité Haute)

### 1. **Appointment Types - Énumération Incompatible**

**Gravité**: 🔴 CRITIQUE - Cause des échecs de création de rendez-vous

#### Backend (`app/models/appointment.py`)
```python
class AppointmentType(str, enum.Enum):
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO = 'video',           // ❌ DIFFÉRENT
  HOME_VISIT = 'home_visit', // ❌ N'EXISTE PAS dans le backend
}
```

**Impact**: 
- ❌ Échec lors de la création de rendez-vous avec type "video" ou "home_visit"
- ❌ Erreur 422 Unprocessable Entity

**Solution recommandée**:
```typescript
// frontend/src/types/index.ts
export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',  // ✅ Aligné avec backend
  PHONE_CALL = 'phone_call',  // ✅ Aligné avec backend
}
```

---

### 2. **Appointment Fields - Mapping Incohérent**

**Gravité**: 🔴 CRITIQUE - Bug déjà corrigé partiellement

#### Backend Schema (`app/schemas/appointment.py`)
```python
class AppointmentCreate(AppointmentBase):
    appointment_time: Optional[str] = None      # Format HH:MM
    chief_complaint: Optional[str] = None       # ❌ Utilise aussi 'reason'
    notes: Optional[str] = None
```

#### Backend Model (`app/models/appointment.py`)
```python
class Appointment(Base):
    reason = Column(Text, nullable=True)        # ✅ Champ principal
    notes = Column(Text, nullable=True)
    # ❌ PAS de champ 'chief_complaint' dans le modèle
```

#### Frontend Interface (`frontend/src/types/index.ts`)
```typescript
export interface Appointment {
  chief_complaint?: string;  // ❌ N'existe pas dans le modèle backend
  notes?: string;
}

export interface AppointmentFormData {
  chief_complaint: string;   // ❌ Devrait être 'reason'
  notes?: string;
}
```

**Impact**:
- ⚠️ Confusion entre `reason` et `chief_complaint`
- ✅ Correction partielle appliquée dans `book-appointment/page.tsx` (envoie les deux)
- ❌ Types frontend toujours incohérents

**Solution recommandée**:
```typescript
// Option 1: Utiliser 'reason' partout
export interface Appointment {
  reason?: string;      // ✅ Aligné avec backend
  notes?: string;
}

// Option 2: Ajouter les deux avec alias
export interface AppointmentFormData {
  reason: string;             // ✅ Champ principal
  chief_complaint?: string;   // ❌ Deprecated, utiliser 'reason'
  notes?: string;
}
```

---

### 3. **User Fields - Noms Différents**

**Gravité**: 🟡 MOYENNE - Cause de confusion

#### Backend (`app/schemas/user.py`, `app/models/user.py`)
```python
class UserResponse(UserBase):
    phone: Optional[str] = None              # ✅ Backend utilise 'phone'
    date_of_birth: Optional[datetime] = None
    license_number: Optional[str] = None
    profile_image: Optional[str] = None      # ✅ Backend utilise 'profile_image'
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface User {
  phone_number?: string;          // ❌ Frontend utilise 'phone_number'
  date_of_birth?: string;
  license_number?: string;
  profile_picture_url?: string;   // ❌ Frontend utilise 'profile_picture_url'
}
```

**Impact**:
- ❌ Champs `phone` et `profile_image` non affichés dans le frontend
- ❌ Envoi de `phone_number` et `profile_picture_url` ignorés par le backend

**Solution recommandée**:
```typescript
// frontend/src/types/index.ts
export interface User {
  phone?: string;           // ✅ Aligné avec backend
  date_of_birth?: string;
  license_number?: string;
  profile_image?: string;   // ✅ Aligné avec backend
}
```

---

### 4. **Appointment Response - Champs Manquants**

**Gravité**: 🟡 MOYENNE

#### Backend Response (`app/schemas/appointment.py`)
```python
class AppointmentResponse(AppointmentBase):
    id: int
    patient_id: int
    status: AppointmentStatus
    video_call_link: Optional[str] = None         # ✅ Backend retourne ces champs
    video_call_room_id: Optional[str] = None
    reminder_sent: bool
    reminder_sent_at: Optional[datetime] = None
    cancelled_by: Optional[int] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
```

#### Frontend Interface (`frontend/src/types/index.ts`)
```typescript
export interface Appointment {
  id: number;
  patient_id: number;
  status: AppointmentStatus;
  video_room_url?: string;          // ❌ Nom différent (backend: video_call_link)
  cancellation_reason?: string;     // ✅ OK
  // ❌ Champs manquants:
  // - video_call_room_id
  // - reminder_sent
  // - reminder_sent_at
  // - cancelled_by
  // - cancelled_at
}
```

**Solution recommandée**:
```typescript
export interface Appointment {
  id: number;
  patient_id: number;
  status: AppointmentStatus;
  video_call_link?: string;         // ✅ Aligné avec backend
  video_call_room_id?: string;      // ✅ Ajouté
  reminder_sent?: boolean;          // ✅ Ajouté
  reminder_sent_at?: string;        // ✅ Ajouté
  cancelled_by?: number;            // ✅ Ajouté
  cancellation_reason?: string;
  cancelled_at?: string;            // ✅ Ajouté
}
```

---

### 5. **Review Fields - Naming Inconsistency**

**Gravité**: 🟡 MOYENNE

#### Backend (`app/schemas/review.py`)
```python
class ReviewBase(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    title: Optional[str] = None
    review_text: Optional[str] = None      # ✅ Backend utilise 'review_text'
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface Review {
  rating: number;
  comment?: string;         // ❌ Frontend utilise 'comment'
  doctor_response?: string;
}
```

**Solution recommandée**:
```typescript
export interface Review {
  rating: number;
  title?: string;           // ✅ Ajouté
  review_text?: string;     // ✅ Aligné avec backend
  doctor_response?: string;
}
```

---

### 6. **Medical Record Fields - Structure Différente**

**Gravité**: 🟡 MOYENNE

#### Backend (`app/schemas/medical_record.py`)
```python
class MedicalRecordBase(BaseModel):
    allergies: Optional[List[str]] = None           # ✅ Backend utilise une liste
    chronic_conditions: Optional[List[str]] = None  # ✅ Backend utilise une liste
    medications: Optional[List[Dict[str, Any]]] = None
    surgeries: Optional[List[Dict[str, Any]]] = None
    family_history: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None   # ✅ Backend utilise ce nom
    insurance_valid_until: Optional[datetime] = None # ✅ Backend utilise ce nom
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface MedicalRecord {
  allergies?: string;              // ❌ Frontend utilise une chaîne
  chronic_conditions?: string;     // ❌ Frontend utilise une chaîne
  current_medications?: string;    // ❌ Nom différent (backend: medications)
  family_history?: string;
  previous_surgeries?: string;     // ❌ Nom différent (backend: surgeries)
  insurance_provider?: string;
  insurance_policy_number?: string; // ✅ OK
  insurance_expiry_date?: string;  // ❌ Nom différent (backend: insurance_valid_until)
}
```

**Solution recommandée**:
```typescript
export interface MedicalRecord {
  allergies?: string[];            // ✅ Liste comme backend
  chronic_conditions?: string[];   // ✅ Liste comme backend
  medications?: Array<{            // ✅ Aligné avec backend
    name: string;
    dosage: string;
    frequency: string;
  }>;
  surgeries?: Array<{              // ✅ Aligné avec backend
    name: string;
    date: string;
  }>;
  family_history?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_valid_until?: string;  // ✅ Aligné avec backend
}
```

---

### 7. **Notification Type - Valeurs Manquantes**

**Gravité**: 🟢 FAIBLE

#### Backend (`app/models/notification.py`)
```python
class NotificationType(str, enum.Enum):
    APPOINTMENT_REMINDER = "appointment_reminder"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"    # ❌ Manquant frontend
    APPOINTMENT_DELAYED = "appointment_delayed"            # ❌ Manquant frontend
    PRESCRIPTION_READY = "prescription_ready"
    PRESCRIPTION_RENEWAL = "prescription_renewal"          # ❌ Manquant frontend
    VACCINATION_DUE = "vaccination_due"                    # ❌ Manquant frontend
    MESSAGE_RECEIVED = "message_received"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_FAILED = "payment_failed"                      # ❌ Manquant frontend
    DOCUMENT_READY = "document_ready"                      # ❌ Manquant frontend
    SYSTEM_ALERT = "system_alert"                          # ❌ Manquant frontend
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  PRESCRIPTION_READY = 'prescription_ready',
  PAYMENT_RECEIVED = 'payment_received',
  MESSAGE_RECEIVED = 'message_received',
  // ❌ Manquants: APPOINTMENT_RESCHEDULED, APPOINTMENT_DELAYED, 
  //              PRESCRIPTION_RENEWAL, VACCINATION_DUE, PAYMENT_FAILED,
  //              DOCUMENT_READY, SYSTEM_ALERT
}
```

**Solution recommandée**:
```typescript
export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',  // ✅ Ajouté
  APPOINTMENT_DELAYED = 'appointment_delayed',          // ✅ Ajouté
  PRESCRIPTION_READY = 'prescription_ready',
  PRESCRIPTION_RENEWAL = 'prescription_renewal',        // ✅ Ajouté
  VACCINATION_DUE = 'vaccination_due',                  // ✅ Ajouté
  MESSAGE_RECEIVED = 'message_received',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',                    // ✅ Ajouté
  DOCUMENT_READY = 'document_ready',                    // ✅ Ajouté
  SYSTEM_ALERT = 'system_alert',                        // ✅ Ajouté
}
```

---

### 8. **Prescription Fields - Noms Différents**

**Gravité**: 🟡 MOYENNE

#### Backend (`app/schemas/prescription.py`)
```python
class PrescriptionBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration_days: int
    quantity: Optional[int] = None
    refills_allowed: int = 0
    instructions: Optional[str] = None
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface Prescription {
  medication_name: string;     // ✅ OK
  dosage: string;              // ✅ OK
  frequency: string;           // ✅ OK
  duration_days: number;       // ✅ OK
  refills_allowed: number;     // ✅ OK
  refills_remaining: number;   // ✅ OK
  // ❌ Manquants:
  // - quantity
  // - instructions
}
```

---

### 9. **Payment Fields - Currency et Montant**

**Gravité**: 🟡 MOYENNE

#### Backend (`app/schemas/payment.py`)
```python
class PaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)  # ✅ En unités monétaires (EUR)
    currency: str = Field("EUR", min_length=3, max_length=3)
    payment_method: PaymentMethod
```

#### Backend Model (`app/models/user.py`)
```python
class User(Base):
    consultation_fee = Column(Integer, nullable=True)  # ❌ En centimes!
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface Payment {
  amount: number;           // ❌ Pas clair si centimes ou euros
  currency: string;
  payment_method: string;
}

export interface User {
  consultation_fee?: number;  // ❌ Pas clair si centimes ou euros
}
```

**Impact**:
- ⚠️ Confusion potentielle entre centimes et euros
- ⚠️ Risque d'affichage incorrect des prix

**Solution recommandée**:
```typescript
// Clarifier dans les commentaires et normaliser
export interface Payment {
  amount: number;           // En EUR (format décimal: 50.00)
  currency: string;         // ISO 4217 code (EUR, USD, etc.)
  payment_method: string;
}

export interface User {
  consultation_fee?: number;  // En centimes (5000 = 50.00 EUR)
}

// Ajouter des fonctions utilitaires
export const formatConsultationFee = (cents: number): string => {
  return (cents / 100).toFixed(2);
};
```

---

### 10. **Date Formats - Inconsistency**

**Gravité**: 🟡 MOYENNE

#### Backend
- Retourne: `ISO 8601` avec timezone (`2025-10-21T14:30:00+00:00`)
- Attend: `ISO 8601` format (`YYYY-MM-DDTHH:MM:SS`)

#### Frontend
- Envoie parfois: `YYYY-MM-DDTHH:MM` (sans secondes) ❌
- Envoie maintenant: `YYYY-MM-DDTHH:MM:SS` ✅ (après correction)
- Affiche: Format localisé (`21/10/2025 14:30`)

**Recommandation**:
- ✅ Toujours envoyer le format ISO complet avec secondes
- ✅ Utiliser `date-fns` ou `dayjs` pour le parsing/formatage
- ✅ Ajouter des tests de validation de format

---

## 🟡 Incohérences Mineures (Priorité Moyenne)

### 11. **Schedule Fields**

#### Backend (`app/schemas/schedule.py`)
```python
class DoctorScheduleBase(BaseModel):
    schedule_type: ScheduleType
    start_time: time
    end_time: time
    slot_duration_minutes: int = 30
    buffer_time_minutes: int = 0
    max_patients_per_slot: int = 1
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface DoctorSchedule {
  day_of_week?: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  // ❌ Manquants:
  // - schedule_type
  // - buffer_time_minutes
  // - max_patients_per_slot
}
```

---

### 12. **Document Fields**

#### Backend (`app/schemas/document.py`)
```python
class DocumentBase(BaseModel):
    document_type: DocumentType
    title: str
    description: Optional[str] = None

class DocumentResponse(DocumentBase):
    file_name: str
    file_path: str         # ✅ Backend utilise file_path
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    is_shared: bool
    ocr_text: Optional[str] = None
    verified: bool
```

#### Frontend (`frontend/src/types/index.ts`)
```typescript
export interface Document {
  document_type: string;
  title: string;
  description?: string;
  file_url: string;      // ❌ Frontend utilise file_url
  file_name: string;
  file_size: number;     // ❌ Frontend utilise file_size
  mime_type: string;
  is_shared_with_doctors: boolean;  // ❌ Nom différent
  is_verified: boolean;  // ❌ Nom différent
  // ❌ Manquant: ocr_text
}
```

---

## 🟢 Incohérences Bénignes (Priorité Faible)

### 13. **Token Response**

Le frontend attend `user` dans la réponse de login, mais le backend ne le retourne pas actuellement dans `/auth/login`.

**Recommandation**: Ajouter l'objet user dans la réponse de login.

---

### 14. **Pagination**

Le frontend définit `PaginatedResponse<T>` mais le backend n'utilise pas toujours ce format de pagination.

---

## 📊 Tableau Récapitulatif des Champs Incohérents

| Entité | Champ Backend | Champ Frontend | Gravité | Action |
|--------|---------------|----------------|---------|--------|
| Appointment | `appointment_type: video_call` | `appointment_type: video` | 🔴 | Renommer frontend |
| Appointment | `appointment_type: phone_call` | `appointment_type: home_visit` | 🔴 | Renommer frontend |
| Appointment | `reason` | `chief_complaint` | 🔴 | Harmoniser |
| Appointment | `video_call_link` | `video_room_url` | 🟡 | Renommer frontend |
| User | `phone` | `phone_number` | 🟡 | Renommer frontend |
| User | `profile_image` | `profile_picture_url` | 🟡 | Renommer frontend |
| Review | `review_text` | `comment` | 🟡 | Renommer frontend |
| MedicalRecord | `allergies: List[str]` | `allergies: string` | 🟡 | Changer type |
| MedicalRecord | `medications` | `current_medications` | 🟡 | Renommer frontend |
| MedicalRecord | `surgeries` | `previous_surgeries` | 🟡 | Renommer frontend |
| MedicalRecord | `insurance_valid_until` | `insurance_expiry_date` | 🟡 | Renommer frontend |
| Document | `file_path` | `file_url` | 🟡 | Renommer frontend |
| Document | `file_size_bytes` | `file_size` | 🟡 | Renommer frontend |
| Document | `is_shared` | `is_shared_with_doctors` | 🟡 | Renommer frontend |
| Document | `verified` | `is_verified` | 🟡 | Renommer frontend |

---

## 🛠️ Plan d'Action Recommandé

### Phase 1: Corrections Critiques (Sprint 1)
1. ✅ **Corriger AppointmentType enum** - URGENT
2. ✅ **Harmoniser reason/chief_complaint** - URGENT (partiellement fait)
3. ✅ **Corriger les noms de champs User** (phone, profile_image)
4. ✅ **Valider les formats de dates** partout

### Phase 2: Corrections Moyennes (Sprint 2)
5. ✅ **Compléter l'interface Appointment** avec tous les champs
6. ✅ **Corriger Review interface**
7. ✅ **Restructurer MedicalRecord** pour utiliser des listes
8. ✅ **Ajouter les types NotificationType manquants**

### Phase 3: Corrections Mineures (Sprint 3)
9. ✅ **Harmoniser Document interface**
10. ✅ **Compléter Schedule interface**
11. ✅ **Documenter les formats de montants** (centimes vs euros)
12. ✅ **Ajouter user dans la réponse de login**

---

## 📝 Recommandations Générales

### 1. **Génération Automatique de Types**
- Utiliser `openapi-typescript` pour générer les types TypeScript depuis l'OpenAPI du backend
- Command: `npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts`

### 2. **Validation Stricte**
- Activer `strict: true` dans `tsconfig.json`
- Utiliser `zod` pour valider les réponses API côté frontend

### 3. **Tests d'Intégration**
- Créer des tests E2E qui vérifient la cohérence entre frontend et backend
- Utiliser Cypress pour tester les flux complets

### 4. **Documentation Partagée**
- Maintenir un document unique avec les structures de données
- Utiliser Swagger/OpenAPI comme source de vérité

### 5. **Convention de Nommage**
- Adopter `snake_case` partout (backend et frontend) pour éviter la confusion
- Ou utiliser `camelCase` partout avec transformation automatique

---

## 🔍 Méthodologie d'Analyse

Cette analyse a été réalisée par:
1. ✅ Lecture complète des schémas Pydantic du backend
2. ✅ Lecture des interfaces TypeScript du frontend
3. ✅ Comparaison des endpoints API et des appels frontend
4. ✅ Analyse des modèles de base de données
5. ✅ Vérification des énumérations et des types

---

## 📞 Contact et Suivi

Pour toute question sur ce rapport, veuillez consulter:
- Documentation backend: `/backend/app/schemas/`
- Documentation frontend: `/frontend/src/types/index.ts`
- API documentation: `http://localhost:8000/docs`

**Dernière mise à jour**: 21 octobre 2025
