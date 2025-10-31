"""
Tests for security improvements including password policy, rate limiting, and error handling
"""
import pytest
from app.core.password_policy import validate_password_strength, get_password_requirements
from app.core.errors import APIError, ErrorCode
from app.core.logging import set_request_id, get_request_id, clear_request_id


class TestPasswordPolicy:
    """Tests for password policy enforcement"""
    
    def test_valid_strong_password(self):
        """Test that a strong password passes validation"""
        password = "MyStr0ng!Password"
        is_valid, message = validate_password_strength(password)
        assert is_valid is True
        assert message == "Password is strong"
    
    def test_password_too_short(self):
        """Test that short passwords are rejected"""
        password = "Short1!"
        is_valid, message = validate_password_strength(password)
        assert is_valid is False
        assert "at least 12 characters" in message
    
    def test_password_no_uppercase(self):
        """Test that passwords without uppercase are rejected"""
        password = "lowercase123!"
        is_valid, message = validate_password_strength(password)
        assert is_valid is False
        assert "uppercase" in message.lower()
    
    def test_password_no_lowercase(self):
        """Test that passwords without lowercase are rejected"""
        password = "UPPERCASE123!"
        is_valid, message = validate_password_strength(password)
        assert is_valid is False
        assert "lowercase" in message.lower()
    
    def test_password_no_digit(self):
        """Test that passwords without digits are rejected"""
        password = "NoDigitsHere!"
        is_valid, message = validate_password_strength(password)
        assert is_valid is False
        assert "digit" in message.lower()
    
    def test_password_no_special_char(self):
        """Test that passwords without special characters are rejected"""
        password = "NoSpecialChar123"
        is_valid, message = validate_password_strength(password)
        assert is_valid is False
        assert "special character" in message.lower()
    
    def test_get_password_requirements(self):
        """Test that password requirements are returned"""
        requirements = get_password_requirements()
        assert isinstance(requirements, list)
        assert len(requirements) > 0
        assert any("12 characters" in req for req in requirements)


class TestErrorHandling:
    """Tests for error handling system"""
    
    def test_api_error_creation(self):
        """Test that APIError can be created with proper attributes"""
        error = APIError(
            code=ErrorCode.INVALID_CREDENTIALS,
            message="Test error",
            status_code=401
        )
        assert error.code == ErrorCode.INVALID_CREDENTIALS
        assert error.message == "Test error"
        assert error.status_code == 401
    
    def test_api_error_to_dict(self):
        """Test that APIError can be converted to dictionary"""
        error = APIError(
            code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message="Too many requests",
            status_code=429,
            details={"retry_after": 60}
        )
        error_dict = error.to_dict()
        assert "error" in error_dict
        assert error_dict["error"]["code"] == ErrorCode.RATE_LIMIT_EXCEEDED.value
        assert error_dict["error"]["message"] == "Too many requests"
        assert error_dict["error"]["details"]["retry_after"] == 60
    
    def test_error_codes_are_unique(self):
        """Test that all error codes are unique"""
        codes = [code.value for code in ErrorCode]
        assert len(codes) == len(set(codes)), "Error codes must be unique"


class TestLogging:
    """Tests for logging functionality"""
    
    def test_set_and_get_request_id(self):
        """Test setting and getting request ID"""
        request_id = set_request_id("test-123")
        assert request_id == "test-123"
        assert get_request_id() == "test-123"
        clear_request_id()
        assert get_request_id() is None
    
    def test_auto_generate_request_id(self):
        """Test that request ID is auto-generated if not provided"""
        request_id = set_request_id()
        assert request_id is not None
        assert len(request_id) > 0
        clear_request_id()


class TestAPIVersioning:
    """Tests for API versioning"""
    
    def test_supported_versions(self):
        """Test that supported versions are defined"""
        from app.api.versioning import get_supported_versions
        versions = get_supported_versions()
        assert isinstance(versions, list)
        assert "v1" in versions
    
    def test_version_info(self):
        """Test that version info can be retrieved"""
        from app.api.versioning import get_version_info
        v1_info = get_version_info("v1")
        assert v1_info is not None
        assert v1_info.version == "v1"
        assert v1_info.status in ["stable", "beta", "deprecated"]


class TestEmailTemplates:
    """Tests for email templates"""
    
    def test_appointment_confirmation_template_exists(self):
        """Test that appointment confirmation template exists"""
        from app.templates.email_templates import EmailTemplates
        template = EmailTemplates.APPOINTMENT_CONFIRMATION
        assert template is not None
        assert "{patient_name}" in template
        assert "{doctor_name}" in template
    
    def test_password_reset_template_exists(self):
        """Test that password reset template exists"""
        from app.templates.email_templates import EmailTemplates
        template = EmailTemplates.PASSWORD_RESET
        assert template is not None
        assert "{reset_url}" in template
        assert "{first_name}" in template
    
    def test_get_template_by_name(self):
        """Test retrieving template by name"""
        from app.templates.email_templates import EmailTemplates
        template = EmailTemplates.get_template("appointment_confirmation")
        assert template is not None
        assert "Confirmation de rendez-vous" in template


class TestDatabaseMigration:
    """Tests for database migration"""
    
    def test_migration_file_exists(self):
        """Test that performance indexes migration file exists"""
        import os
        migration_path = "/home/runner/work/sante-application-web/sante-application-web/backend/alembic/versions/003_add_performance_indexes.py"
        assert os.path.exists(migration_path)
    
    def test_migration_has_upgrade_downgrade(self):
        """Test that migration has upgrade and downgrade functions"""
        with open("/home/runner/work/sante-application-web/sante-application-web/backend/alembic/versions/003_add_performance_indexes.py", "r") as f:
            content = f.read()
            assert "def upgrade():" in content
            assert "def downgrade():" in content
            assert "create_index" in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
