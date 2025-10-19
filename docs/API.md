# API Documentation

## Base URL
- Development: `http://localhost:8000`
- Production: `https://api.sante-app.com`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Obtaining Tokens

**POST /api/v1/auth/login**

Request:
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## Endpoints

### Authentication

#### Register New User
**POST /api/v1/auth/register**

Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+33612345678",
  "role": "patient"
}
```

Response: `201 Created`

### Users

#### Get Current User
**GET /api/v1/users/me**

Headers: `Authorization: Bearer <token>`

#### List Doctors
**GET /api/v1/users/doctors**

Query Parameters:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 20, max: 100)
- `specialization` (optional): Filter by specialization

### Appointments

#### Create Appointment
**POST /api/v1/appointments/**

Headers: `Authorization: Bearer <token>`

#### List Appointments
**GET /api/v1/appointments/**

Headers: `Authorization: Bearer <token>`

### Medical Records

#### Create Medical Record
**POST /api/v1/medical-records/**

Headers: `Authorization: Bearer <token>` (Doctor/Admin only)

#### Get Patient Medical Record
**GET /api/v1/medical-records/patient/{patient_id}**

Headers: `Authorization: Bearer <token>`

## Interactive Documentation

The API provides interactive documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
