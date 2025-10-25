"""
Tests for messaging functionality
"""
import pytest
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.message import Message
from app.services.message_service import MessageService


class TestMessageService:
    """Test message service functionality"""

    def test_send_message(self, db: Session):
        """Test sending a message between doctor and patient"""
        # Create test users
        doctor = User(
            email="doctor@test.com",
            hashed_password="hashed",
            first_name="Dr. John",
            last_name="Doe",
            role=UserRole.DOCTOR,
        )
        patient = User(
            email="patient@test.com",
            hashed_password="hashed",
            first_name="Jane",
            last_name="Smith",
            role=UserRole.PATIENT,
        )
        db.add(doctor)
        db.add(patient)
        db.commit()
        db.refresh(doctor)
        db.refresh(patient)

        # Send a message
        message_service = MessageService(db)
        message = message_service.send_message(
            sender_id=doctor.id,
            recipient_id=patient.id,
            content="Hello, this is a test message.",
            subject="Test Subject",
        )

        assert message.id is not None
        assert message.sender_id == doctor.id
        assert message.recipient_id == patient.id
        assert message.content == "Hello, this is a test message."
        assert message.subject == "Test Subject"
        assert message.is_read is False

    def test_get_conversation_messages(self, db: Session):
        """Test retrieving conversation messages"""
        # Create test users
        doctor = User(
            email="doctor2@test.com",
            hashed_password="hashed",
            first_name="Dr. Jane",
            last_name="Doe",
            role=UserRole.DOCTOR,
        )
        patient = User(
            email="patient2@test.com",
            hashed_password="hashed",
            first_name="John",
            last_name="Smith",
            role=UserRole.PATIENT,
        )
        db.add(doctor)
        db.add(patient)
        db.commit()
        db.refresh(doctor)
        db.refresh(patient)

        # Send multiple messages
        message_service = MessageService(db)
        message_service.send_message(
            sender_id=doctor.id,
            recipient_id=patient.id,
            content="First message",
        )
        message_service.send_message(
            sender_id=patient.id,
            recipient_id=doctor.id,
            content="Second message",
        )

        # Get conversation
        messages = message_service.get_conversation_messages(doctor.id, patient.id)
        assert len(messages) == 2

    def test_mark_message_as_read(self, db: Session):
        """Test marking a message as read"""
        # Create test users
        doctor = User(
            email="doctor3@test.com",
            hashed_password="hashed",
            first_name="Dr. Bob",
            last_name="Jones",
            role=UserRole.DOCTOR,
        )
        patient = User(
            email="patient3@test.com",
            hashed_password="hashed",
            first_name="Alice",
            last_name="Brown",
            role=UserRole.PATIENT,
        )
        db.add(doctor)
        db.add(patient)
        db.commit()
        db.refresh(doctor)
        db.refresh(patient)

        # Send a message
        message_service = MessageService(db)
        message = message_service.send_message(
            sender_id=doctor.id,
            recipient_id=patient.id,
            content="Test message",
        )

        assert message.is_read is False

        # Mark as read
        success = message_service.mark_message_as_read(message.id, patient.id)
        assert success is True

        # Verify it's marked as read
        db.refresh(message)
        assert message.is_read is True
        assert message.read_at is not None

    def test_get_unread_count(self, db: Session):
        """Test getting unread message count"""
        # Create test users
        doctor = User(
            email="doctor4@test.com",
            hashed_password="hashed",
            first_name="Dr. Carol",
            last_name="White",
            role=UserRole.DOCTOR,
        )
        patient = User(
            email="patient4@test.com",
            hashed_password="hashed",
            first_name="David",
            last_name="Green",
            role=UserRole.PATIENT,
        )
        db.add(doctor)
        db.add(patient)
        db.commit()
        db.refresh(doctor)
        db.refresh(patient)

        # Send messages
        message_service = MessageService(db)
        message_service.send_message(
            sender_id=doctor.id,
            recipient_id=patient.id,
            content="Message 1",
        )
        message_service.send_message(
            sender_id=doctor.id,
            recipient_id=patient.id,
            content="Message 2",
        )

        # Check unread count
        unread_count = message_service.get_unread_count(patient.id)
        assert unread_count == 2

    def test_cannot_message_between_patients(self, db: Session):
        """Test that patients cannot message each other"""
        # Create test users
        patient1 = User(
            email="patient5@test.com",
            hashed_password="hashed",
            first_name="Patient",
            last_name="One",
            role=UserRole.PATIENT,
        )
        patient2 = User(
            email="patient6@test.com",
            hashed_password="hashed",
            first_name="Patient",
            last_name="Two",
            role=UserRole.PATIENT,
        )
        db.add(patient1)
        db.add(patient2)
        db.commit()
        db.refresh(patient1)
        db.refresh(patient2)

        # Try to send a message between patients
        message_service = MessageService(db)
        with pytest.raises(ValueError, match="Messaging is only allowed"):
            message_service.send_message(
                sender_id=patient1.id,
                recipient_id=patient2.id,
                content="This should fail",
            )
