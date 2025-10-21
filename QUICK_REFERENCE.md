# Quick Reference - New Features

## 🚀 Quick Start

### For Doctors

**Create a Prescription:**
1. Navigate to `/doctor/prescriptions`
2. Click "New Prescription"
3. Select patient, add medications, configure settings
4. Review and submit

**Upload Patient Documents:**
1. Go to `/doctor/patients`
2. Click "Dossier" button for a patient
3. Click "Upload Document"
4. Select file type, add title, choose file
5. Submit

### For Patients

**Search Medical Documents:**
1. Go to `/patient/medical-records`
2. Use search bar or filter dropdown
3. View filtered results

**View Sorted Appointments:**
- Navigate to `/patient/appointments`
- Appointments automatically sorted (newest first)

## 🔧 API Endpoints Used

### Prescriptions
- `POST /api/v1/prescriptions/` - Create prescription
- `GET /api/v1/prescriptions/` - List prescriptions
- `GET /api/v1/prescriptions/{id}` - Get prescription details
- `POST /api/v1/prescriptions/{id}/renew` - Renew prescription

### Documents
- `POST /api/v1/documents/` - Upload document (multipart/form-data)
- `GET /api/v1/documents/` - List documents
- `GET /api/v1/documents/{id}/download` - Download document
- `DELETE /api/v1/documents/{id}` - Delete document

### Patients
- `GET /api/v1/doctor/patients` - Get doctor's patients
- `GET /api/v1/medical-records/patient/{id}` - Get patient medical record

## 📊 Component Patterns

### Form Validation Pattern
```typescript
const validateForm = (): boolean => {
  if (!selectedPatientId) {
    setMessage({ type: 'error', text: 'Please select a patient' });
    return false;
  }
  // ... more validation
  return true;
};
```

### File Upload Pattern
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && file.size > 10 * 1024 * 1024) {
    setMessage({ type: 'error', text: 'File size must be less than 10MB' });
    return;
  }
  setUploadFile(file);
};
```

### Search & Filter Pattern
```typescript
const filteredData = useMemo(() => {
  return data.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });
}, [data, searchTerm, filterType]);
```

## 🎨 Styling Guidelines

### Color Scheme
- Primary: `bg-primary`, `text-primary-600`
- Success: `bg-green-100 text-green-700`
- Error: `bg-red-100 text-red-700`
- Warning: `bg-orange-100 text-orange-700`

### Common Card Pattern
```tsx
<Card className="border border-gray-200">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary-600" />
      Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Message Alert Pattern
```tsx
{message && (
  <div className={`rounded-lg px-4 py-3 flex items-center gap-2 ${
    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
  }`}>
    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
    <span className="text-sm font-medium">{message.text}</span>
  </div>
)}
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test File Location
- `frontend/src/test/doctor/prescription-features.test.ts`

### Test Pattern
```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = { /* ... */ };
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## 🔍 Debugging Tips

### Check API Calls
```typescript
logger.error('Failed to load data', {
  userId: user?.id,
  errorMessage: error?.message,
}, error);
```

### Browser Console
- Open DevTools (F12)
- Check Network tab for API calls
- Check Console for errors

### Common Issues

**Issue: Build fails with TypeScript error**
- Check type definitions in `src/types/index.ts`
- Ensure all properties exist on the type

**Issue: File upload fails**
- Check file size (max 10MB)
- Check file type is supported
- Check network request in DevTools

**Issue: Form validation doesn't work**
- Check required fields are filled
- Check validation logic in component
- Check error messages are displayed

## 📦 Dependencies

### Main Dependencies
```json
{
  "next": "^14.0.4",
  "react": "^18.2.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.298.0",
  "axios": "^1.6.2",
  "zod": "^3.22.4"
}
```

### Dev Dependencies
```json
{
  "vitest": "^1.1.0",
  "@testing-library/react": "^14.1.2",
  "typescript": "^5.3.3"
}
```

## 🔐 Security Checklist

- ✅ File size validation (10MB limit)
- ✅ File type validation
- ✅ Required field validation
- ✅ User role checking
- ✅ Authentication token in headers
- ✅ No sensitive data in localStorage
- ✅ XSS protection (React auto-escapes)

## 📱 Responsive Design

### Breakpoints
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

### Grid Pattern
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

## 🚦 Status Codes

### HTTP Status
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

### Prescription Status
- `active`: Currently in use
- `completed`: Treatment finished
- `expired`: Past end date
- `cancelled`: Cancelled by doctor/patient

### Document Types
- `lab_result`: Lab analysis
- `imaging`: X-ray, MRI, CT, etc.
- `prescription`: Prescription document
- `vaccination`: Vaccination record
- `consultation_note`: Doctor's notes
- `surgery_report`: Surgery report
- `discharge_summary`: Hospital discharge
- `insurance`: Insurance document
- `other`: Other documents
