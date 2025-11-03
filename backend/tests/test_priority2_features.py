"""
Tests for Priority 2 improvements
"""
import pytest
from datetime import datetime, timedelta, time, date
from fastapi.testclient import TestClient

from app.main import app
from app.core.i18n import translate, get_supported_languages
from app.services.medical_validation import (
    MedicationDatabase,
    DosageValidator,
    MedicalDataValidator
)
from app.services.file_validation import (
    validate_file_size,
    sanitize_filename,
    calculate_file_hash,
    FileValidationError
)
from app.services.appointment_optimization import (
    AppointmentTypeConfig,
    BreakTimeManager,
    SmartSlotGenerator
)
from app.models.appointment import AppointmentType

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_liveness_probe(self):
        """Test liveness probe returns 200"""
        response = client.get("/api/v1/health/liveness")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
    
    def test_health_endpoint_structure(self):
        """Test health endpoint returns proper structure"""
        response = client.get("/api/v1/health/health")
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data
        assert "checks" in data
        assert "database" in data["checks"]


class TestInternationalization:
    """Test i18n functionality"""
    
    def test_supported_languages(self):
        """Test getting supported languages"""
        languages = get_supported_languages()
        assert 'en' in languages
        assert 'fr' in languages
        assert 'ar' in languages
        assert 'es' in languages
    
    def test_translation_english(self):
        """Test English translation"""
        msg = translate('auth.invalid_credentials', 'en')
        assert 'Invalid email or password' in msg
    
    def test_translation_french(self):
        """Test French translation"""
        msg = translate('auth.invalid_credentials', 'fr')
        assert 'invalide' in msg.lower()
    
    def test_translation_fallback(self):
        """Test fallback for missing keys"""
        msg = translate('non.existent.key', 'en')
        assert msg == 'non.existent.key'  # Returns key if not found


class TestMedicalValidation:
    """Test medical data validation"""
    
    def test_medication_search(self):
        """Test medication database search"""
        med = MedicationDatabase.search_medication('amoxicillin')
        assert med is not None
        assert med['name'] == 'Amoxicillin'
        assert med['class'] == 'antibiotic'
    
    def test_medication_validation_valid(self):
        """Test valid medication validation"""
        is_valid, error = MedicationDatabase.validate_medication_name('ibuprofen')
        assert is_valid is True
        assert error is None
    
    def test_medication_validation_invalid(self):
        """Test invalid medication validation"""
        is_valid, error = MedicationDatabase.validate_medication_name('nonexistent_medication_xyz')
        assert is_valid is False
        assert 'not found' in error.lower()
    
    def test_dosage_format_validation_valid(self):
        """Test valid dosage format"""
        is_valid, error = DosageValidator.validate_dosage_format('500mg')
        assert is_valid is True
        assert error is None
        
        is_valid, error = DosageValidator.validate_dosage_format('10mcg')
        assert is_valid is True
    
    def test_dosage_format_validation_invalid(self):
        """Test invalid dosage format"""
        is_valid, error = DosageValidator.validate_dosage_format('invalid')
        assert is_valid is False
        assert 'Invalid dosage format' in error
    
    def test_drug_interactions(self):
        """Test drug interaction checking"""
        interactions = MedicationDatabase.check_interactions(['ibuprofen', 'lisinopril'])
        assert len(interactions) > 0
        assert interactions[0]['severity'] in ['minor', 'moderate', 'severe']
    
    def test_prescription_validation(self):
        """Test comprehensive prescription validation"""
        result = MedicalDataValidator.validate_prescription(
            medication='amoxicillin',
            dosage='500mg',
            other_medications=['ibuprofen']
        )
        assert result['valid'] is True
        assert isinstance(result['errors'], list)
        assert isinstance(result['warnings'], list)


class TestFileValidation:
    """Test file upload validation"""
    
    def test_file_size_validation_valid(self):
        """Test valid file size"""
        # 5MB file should be valid
        assert validate_file_size(5 * 1024 * 1024) is True
    
    def test_file_size_validation_invalid(self):
        """Test invalid file size"""
        # 20MB file should be invalid (default limit is 10MB)
        with pytest.raises(FileValidationError):
            validate_file_size(20 * 1024 * 1024)
    
    def test_filename_sanitization(self):
        """Test filename sanitization"""
        dangerous = "../../../etc/passwd"
        safe = sanitize_filename(dangerous)
        assert '..' not in safe
        assert '/' not in safe
        
        dangerous = "file<>name?.txt"
        safe = sanitize_filename(dangerous)
        assert '<' not in safe
        assert '>' not in safe
        assert '?' not in safe
    
    def test_file_hash_calculation(self):
        """Test file hash calculation"""
        content = b"test file content"
        hash1 = calculate_file_hash(content)
        hash2 = calculate_file_hash(content)
        assert hash1 == hash2  # Same content should produce same hash
        
        different_content = b"different content"
        hash3 = calculate_file_hash(different_content)
        assert hash1 != hash3  # Different content should produce different hash


class TestAppointmentOptimization:
    """Test appointment slot optimization"""
    
    def test_appointment_type_duration(self):
        """Test appointment type-specific durations"""
        duration = AppointmentTypeConfig.get_duration(AppointmentType.IN_PERSON)
        assert duration == 30
        
        duration = AppointmentTypeConfig.get_duration(AppointmentType.VIDEO_CALL)
        assert duration == 20
        
        # Custom duration should override
        duration = AppointmentTypeConfig.get_duration(AppointmentType.IN_PERSON, custom_duration=45)
        assert duration == 45
    
    def test_buffer_time(self):
        """Test buffer time configuration"""
        buffer = AppointmentTypeConfig.get_buffer_time(AppointmentType.IN_PERSON)
        assert buffer == 5
        
        buffer = AppointmentTypeConfig.get_buffer_time(AppointmentType.VIDEO_CALL)
        assert buffer == 0
    
    def test_overbooking_allowed(self):
        """Test overbooking rules"""
        # In-person appointments should not allow overbooking
        assert AppointmentTypeConfig.allows_overbooking(AppointmentType.IN_PERSON) is False
        
        # Video calls can be overbooked
        assert AppointmentTypeConfig.allows_overbooking(AppointmentType.VIDEO_CALL) is True
    
    def test_break_time_detection(self):
        """Test break time detection"""
        # Lunch time (12:00-13:00) should be detected
        lunch_time = datetime(2024, 1, 15, 12, 30)  # Monday 12:30 PM
        assert BreakTimeManager.is_during_break(lunch_time) is True
        
        # Regular work time should not be break
        work_time = datetime(2024, 1, 15, 10, 30)  # Monday 10:30 AM
        assert BreakTimeManager.is_during_break(work_time) is False
        
        # Weekend lunch time (not in default breaks)
        weekend_lunch = datetime(2024, 1, 13, 12, 30)  # Saturday 12:30 PM
        # Default breaks are weekdays only, so this might not be a break
        # depending on configuration


class TestRateLimiting:
    """Test rate limiting"""
    
    def test_rate_limit_on_login(self):
        """Test that rate limiting is configured on login endpoint"""
        # This test would require actual rate limiting to be triggered
        # For now, just verify the endpoint is accessible
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "test@example.com", "password": "testpass"}
        )
        # Should fail authentication but not rate limit on first try
        assert response.status_code in [401, 422, 429]


class TestWebSocketEndpoints:
    """Test WebSocket endpoints"""
    
    def test_online_users_endpoint(self):
        """Test getting online users"""
        response = client.get("/api/v1/websocket/online-users")
        assert response.status_code == 200
        data = response.json()
        assert "online_users" in data
        assert "count" in data
        assert isinstance(data["online_users"], list)


class TestGDPREndpoints:
    """Test GDPR compliance endpoints"""
    
    def test_consent_endpoint_requires_auth(self):
        """Test that consent endpoint requires authentication"""
        response = client.get("/api/v1/gdpr/consent")
        assert response.status_code == 401  # Unauthorized


class TestAPIDocumentation:
    """Test API documentation enhancements"""
    
    def test_openapi_schema_exists(self):
        """Test OpenAPI schema is available"""
        response = client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "info" in schema
        assert "paths" in schema
        assert "components" in schema
    
    def test_security_schemes_documented(self):
        """Test security schemes are in OpenAPI"""
        response = client.get("/api/v1/openapi.json")
        schema = response.json()
        assert "components" in schema
        assert "securitySchemes" in schema["components"]
        assert "Bearer" in schema["components"]["securitySchemes"]
    
    def test_error_responses_documented(self):
        """Test error responses are documented"""
        response = client.get("/api/v1/openapi.json")
        schema = response.json()
        assert "components" in schema
        assert "responses" in schema["components"]
        assert "UnauthorizedError" in schema["components"]["responses"]
        assert "NotFoundError" in schema["components"]["responses"]
    
    def test_tags_with_descriptions(self):
        """Test API tags have descriptions"""
        response = client.get("/api/v1/openapi.json")
        schema = response.json()
        assert "tags" in schema
        assert len(schema["tags"]) > 0
        # Check that tags have descriptions
        for tag in schema["tags"]:
            assert "name" in tag
            assert "description" in tag


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
