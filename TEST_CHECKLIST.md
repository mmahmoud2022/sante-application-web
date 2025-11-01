# Test Checklist for Frontend-Backend Consistency Fixes

This checklist should be used to validate that the consistency fixes don't break existing functionality.

## Automated Tests

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v --tb=short
```

Expected: All tests should pass (no new failures)

### Frontend Type Check
```bash
cd frontend
npm run type-check
```

Expected: No TypeScript errors in src/ directory (Cypress test errors can be ignored)

### Frontend Unit Tests
```bash
cd frontend
npm test
```

Expected: All tests should pass

## Manual Testing Checklist

### 1. User Profile & Phone Number
- [ ] Navigate to user profile page
- [ ] Verify phone number displays correctly
- [ ] Edit phone number and save
- [ ] Verify saved phone number appears correctly after page reload
- [ ] Check phone number in admin user list (if admin user)

**Test Users:**
- Patient: test-patient@example.com
- Doctor: test-doctor@example.com  
- Admin: test-admin@example.com

**Expected**: Phone number should display and save correctly everywhere

---

### 2. Medical Records - Emergency Contact
- [ ] Login as patient
- [ ] Navigate to Medical Records page
- [ ] View emergency contact relation field
- [ ] Edit medical record and set emergency contact relation
- [ ] Save and verify the relation displays correctly

**Test Data**: Set relation to "Spouse", "Parent", "Sibling", etc.

**Expected**: Emergency contact relation displays and saves correctly

---

### 3. Medical Records - Medications
- [ ] View medical records as patient
- [ ] Check medications section displays
- [ ] Medications should show as: "Name (Dosage)" format if array
- [ ] Login as doctor and view patient medical records
- [ ] Verify same medications display format

**Test**: If medications are stored as array, they should display as comma-separated list
Example: "Aspirin (100mg), Lisinopril (10mg)"

**Expected**: Medications display correctly in both patient and doctor views

---

### 4. Medical Records - Insurance Expiry
- [ ] View medical records
- [ ] Check insurance section
- [ ] Verify "Date d'Expiration" field displays a date
- [ ] Date should be formatted as locale date (e.g., "12/31/2025")

**Expected**: Insurance expiry date displays correctly

---

### 5. Documents - File Size
- [ ] Upload a document (as patient or doctor)
- [ ] View documents list
- [ ] Verify file size displays correctly (e.g., "1.5 MB", "250 KB")
- [ ] File size should not show as "undefined" or "NaN"

**Test Locations**:
- Patient Medical Records page - Documents section
- Doctor Patient Details page - Documents section

**Expected**: File sizes display correctly in human-readable format

---

### 6. Two-Factor Authentication Setup
- [ ] Navigate to Settings > Security
- [ ] Select "SMS" as 2FA method
- [ ] Enter phone number
- [ ] Click "Send Code"
- [ ] Verify no error about "phone_number" field
- [ ] Verify code is sent (check logs or mock)

**Expected**: SMS 2FA setup should work without field name errors

---

### 7. Admin User Management
- [ ] Login as admin user
- [ ] Navigate to Admin > Users
- [ ] View users table
- [ ] Verify "Phone" column displays correctly
- [ ] Click on a user to view details
- [ ] Verify phone number in user details modal

**Expected**: Phone numbers display in both table and detail view

---

### 8. Doctor Profile
- [ ] Login as doctor
- [ ] Navigate to Profile page
- [ ] View profile information section
- [ ] Verify phone number displays below email
- [ ] Click "Edit Profile"
- [ ] Verify phone field is populated correctly
- [ ] Change phone number and save
- [ ] Verify changes are saved

**Expected**: Phone number displays and saves correctly in doctor profile

---

## Visual Testing

### Profile Completeness Component
- [ ] Login as new user (incomplete profile)
- [ ] View profile completeness indicator
- [ ] Verify "Phone number" shows correct completion status
- [ ] Add phone number to profile
- [ ] Verify completeness percentage increases

**Expected**: Profile completeness correctly reflects phone number status

---

## API Testing (Optional)

Use tools like Postman or curl to verify API responses:

### Test User Fields
```bash
# Login and get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=test@example.com&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded"

# Get user profile
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Response Contains:**
- ✓ `phone` field (not `phone_number`)
- ✓ `profile_image` field (not `profile_picture_url`)
- ✓ `mfa_enabled` field (not `two_factor_enabled`)

### Test Medical Record Fields
```bash
# Get medical record
curl -X GET http://localhost:8000/api/v1/medical-records/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Response Contains:**
- ✓ `emergency_contact_relation` (not `emergency_contact_relationship`)
- ✓ `medications` as array (not `current_medications` string)
- ✓ `insurance_valid_until` (not `insurance_expiry_date`)

### Test Document Fields
```bash
# Get documents
curl -X GET http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Response Contains:**
- ✓ `file_size_bytes` (not `file_size`)
- ✓ `file_path` (not `file_url`)
- ✓ `is_shared` (not `is_shared_with_doctors`)
- ✓ `verified` (not `is_verified`)

---

## Regression Testing

### Areas NOT Changed (Should Still Work)
- [ ] User registration
- [ ] User login/logout
- [ ] Appointment booking
- [ ] Appointment cancellation
- [ ] Prescription management
- [ ] Payment processing
- [ ] Message sending/receiving
- [ ] Notifications
- [ ] Search functionality
- [ ] Filtering and sorting

**Expected**: All functionality should work as before

---

## Browser Testing

Test in multiple browsers to ensure compatibility:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Testing

- [ ] Profile page load time: < 2s
- [ ] Medical records page load time: < 3s
- [ ] Documents page load time: < 2s
- [ ] Admin users page load time: < 3s

**Expected**: No performance degradation

---

## Error Scenarios

### Missing Data
- [ ] View profile with no phone number - should show nothing (not error)
- [ ] View medical records with no medications - should show "No medications" message
- [ ] View documents with no files - should show empty state

**Expected**: Graceful handling of missing data

### Invalid Data
- [ ] Try to save profile with invalid phone format
- [ ] Verify validation message appears

**Expected**: Proper validation and error messages

---

## Sign-off

| Test Category | Status | Tester | Date | Notes |
|--------------|--------|--------|------|-------|
| Automated Tests | ⬜ | | | |
| User Profile Tests | ⬜ | | | |
| Medical Records Tests | ⬜ | | | |
| Documents Tests | ⬜ | | | |
| 2FA Tests | ⬜ | | | |
| Admin Tests | ⬜ | | | |
| API Tests | ⬜ | | | |
| Regression Tests | ⬜ | | | |
| Browser Tests | ⬜ | | | |

Legend: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

---

## Issue Reporting

If you find any issues during testing, please report them with:
1. **Test case number** (e.g., "2. Medical Records - Emergency Contact")
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots** (if applicable)
6. **Browser/device** information

---

**Checklist Created**: November 1, 2025  
**PR**: Frontend-Backend Consistency Fixes  
**Status**: Ready for Testing
