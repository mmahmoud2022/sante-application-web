# API Consistency Quick Reference Guide

Quick reference for maintaining backend-frontend consistency in the Santé Medical Application.

---

## Running Consistency Tests

```bash
# Backend schema validation tests
cd backend
python -m pytest tests/test_api_consistency.py -v

# Expected: 14 passed, 2 warnings
```

---

## Field Name Reference

Use this as the source of truth for field naming across backend and frontend.

### User Fields
| Backend Schema | Frontend Type | Notes |
|----------------|---------------|-------|
| `phone` | `phone` | ✅ NOT phone_number |
| `profile_image` | `profile_image` | ✅ NOT profile_picture_url |
| `consultation_fee` | `consultation_fee` | Integer in centimes (5000 = €50.00) |

### Appointment Fields
| Backend Schema | Frontend Type | Notes |
|----------------|---------------|-------|
| `reason` | `reason` | ✅ Primary field |
| `chief_complaint` | - | Computed field for compatibility |
| `appointment_type` | `appointment_type` | Enum: in_person, video_call, phone_call |
| `video_call_link` | `video_call_link` | ✅ NOT video_room_url |
| `video_call_room_id` | `video_call_room_id` | - |

### Notification Fields
| Backend Schema | Frontend Type | Notes |
|----------------|---------------|-------|
| `notification_type` | `notification_type` | ✅ NOT type |
| `status` | `status` | Required field |
| `action_url` | `action_url` | Optional |

### Review Fields
| Backend Schema | Frontend Type | Notes |
|----------------|---------------|-------|
| `review_text` | `review_text` | ✅ NOT comment |
| `title` | `title` | Required |

### Document Fields
| Backend Schema | Frontend Type | Notes |
|----------------|---------------|-------|
| `file_path` | `file_path` | ✅ NOT file_url |
| `file_size_bytes` | `file_size_bytes` | ✅ NOT file_size |
| `is_shared` | `is_shared` | ✅ NOT is_shared_with_doctors |
| `verified` | `verified` | ✅ NOT is_verified |
| `ocr_processed` | `ocr_processed` | Boolean flag |

### Medical Record Fields
| Backend Schema | Frontend Type | Notes |
|----------------|---------------|-------|
| `allergies` | `allergies` | Array of strings |
| `chronic_conditions` | `chronic_conditions` | Array of strings |
| `medications` | `medications` | Array of objects |
| `surgeries` | `surgeries` | Array of objects |
| `insurance_valid_until` | `insurance_valid_until` | ✅ NOT insurance_expiry_date |

---

## Enum Values Reference

### AppointmentType
```typescript
// Backend (Python)
class AppointmentType(str, enum.Enum):
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"

// Frontend (TypeScript)
export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',
  PHONE_CALL = 'phone_call',
}
```

### NotificationType
```typescript
// All 13 types (backend and frontend must match):
appointment_reminder
appointment_confirmed
appointment_cancelled
appointment_rescheduled
appointment_delayed
prescription_ready
prescription_renewal
vaccination_due
message_received
payment_received
payment_failed
document_ready
system_alert
```

### AppointmentStatus
```typescript
pending
confirmed
completed
cancelled
no_show (backend only)
```

---

## Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// Wrong field names
interface User {
  phone_number: string;        // ❌ Should be 'phone'
  profile_picture_url: string; // ❌ Should be 'profile_image'
}

interface Notification {
  type: NotificationType;      // ❌ Should be 'notification_type'
}

interface Review {
  comment: string;             // ❌ Should be 'review_text'
}
```

### ✅ Do This
```typescript
// Correct field names
interface User {
  phone: string;               // ✅
  profile_image: string;       // ✅
}

interface Notification {
  notification_type: NotificationType; // ✅
  status: string;                      // ✅
}

interface Review {
  review_text: string;         // ✅
  title: string;               // ✅
}
```

---

## Adding New API Endpoints

When adding a new API endpoint, follow these steps:

### 1. Define Backend Schema
```python
# backend/app/schemas/example.py
from pydantic import BaseModel

class ExampleCreate(BaseModel):
    name: str
    value: int

class ExampleResponse(BaseModel):
    id: int
    name: str
    value: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

### 2. Add Frontend Type
```typescript
// frontend/src/types/index.ts
export interface Example {
  id: number;
  name: string;
  value: number;
  created_at: string;
}
```

### 3. Add Consistency Test
```python
# backend/tests/test_api_consistency.py
class TestExampleSchemas:
    def test_example_response_fields(self):
        schema = ExampleResponse(
            id=1,
            name="Test",
            value=42,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        assert "id" in data
        assert "name" in data
        assert "value" in data
        assert "created_at" in data
```

### 4. Run Tests
```bash
cd backend
python -m pytest tests/test_api_consistency.py -v
```

---

## Updating Existing Types

If you need to update an existing schema:

1. **Update Backend Schema** (`app/schemas/*.py`)
2. **Update Frontend Type** (`src/types/index.ts`)
3. **Update Test** (`tests/test_api_consistency.py`)
4. **Run Tests** to ensure consistency

---

## Data Type Conventions

### Dates and Times
- **Backend**: `datetime` objects
- **Frontend**: ISO 8601 strings (`"2025-10-22T14:30:00Z"`)
- **Format**: Always use full ISO format with timezone

### Money/Currency
- **Payment amounts**: Decimal format in EUR (`Decimal("50.00")`)
- **Consultation fees**: Integer in centimes (`5000 = €50.00`)
- **Currency codes**: ISO 4217 (e.g., "EUR", "USD")

### Arrays/Lists
- **Backend**: Python lists (`["item1", "item2"]`)
- **Frontend**: TypeScript arrays (`string[]`)
- **Example**: `allergies: string[]`

### Booleans
- **Backend**: Python bool (`True`, `False`)
- **Frontend**: TypeScript boolean (`true`, `false`)
- **Always lowercase in JSON**: `true`, `false`

---

## Validation Tools

### Backend
```bash
# Run all schema tests
pytest tests/test_api_consistency.py

# Check specific test
pytest tests/test_api_consistency.py::TestAppointmentSchemas -v

# With coverage
pytest tests/test_api_consistency.py --cov=app.schemas
```

### Frontend
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm run test
```

---

## Quick Checklist

When making API changes, verify:

- [ ] Backend schema updated
- [ ] Frontend type updated
- [ ] Field names match exactly
- [ ] Enum values match exactly
- [ ] Required fields marked correctly
- [ ] Optional fields have `?` in TypeScript
- [ ] Test added/updated in `test_api_consistency.py`
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Security scan passed

---

## Resources

- **Backend Schemas**: `backend/app/schemas/`
- **Frontend Types**: `frontend/src/types/index.ts`
- **Consistency Tests**: `backend/tests/test_api_consistency.py`
- **Full Report**: `API_CONSISTENCY_TEST_REPORT.md`
- **Original Analysis**: `BACKEND_FRONTEND_INCONSISTENCIES.md`

---

## Support

If you encounter inconsistencies:

1. Check this guide first
2. Review `API_CONSISTENCY_TEST_REPORT.md`
3. Run consistency tests to validate
4. Check OpenAPI docs at `/docs` when backend is running
5. Add a new test case if needed

---

**Last Updated**: October 22, 2025
