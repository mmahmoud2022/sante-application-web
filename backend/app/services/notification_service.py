"""
Notification Service
Handles sending notifications via multiple channels (email, SMS, push, in-app)
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationChannel, NotificationType
from app.models.user import User


class NotificationService:
    """Service for creating and sending notifications"""

    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        reference_id: Optional[int] = None,
        reference_type: Optional[str] = None,
        scheduled_for: Optional[datetime] = None,
    ) -> Notification:
        """
        Create a new notification

        Args:
            user_id: ID of the user to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            channel: Delivery channel (default: in-app)
            reference_id: Optional reference to related entity
            reference_type: Type of referenced entity
            scheduled_for: Optional scheduled time for delivery

        Returns:
            Created Notification object
        """
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            channel=channel,
            title=title,
            message=message,
            reference_id=reference_id,
            reference_type=reference_type,
            scheduled_for=scheduled_for,
        )

        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        # Send immediately if not scheduled
        if not scheduled_for:
            self._send_notification(notification)

        return notification

    def send_appointment_reminder(
        self,
        appointment_id: int,
        patient_id: int,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
    ):
        """Send appointment reminder notification"""
        message = f"Rappel: Vous avez un rendez-vous avec Dr. {doctor_name} le {appointment_date} à {appointment_time}"

        # Send via multiple channels based on user preferences
        user = self.db.query(User).filter(User.id == patient_id).first()
        
        # In-app notification
        self.create_notification(
            user_id=patient_id,
            notification_type=NotificationType.APPOINTMENT_REMINDER,
            title="Rappel de rendez-vous",
            message=message,
            channel=NotificationChannel.IN_APP,
            reference_id=appointment_id,
            reference_type="appointment",
        )

        # Email notification (if enabled in preferences)
        if self._should_send_email(user):
            self.create_notification(
                user_id=patient_id,
                notification_type=NotificationType.APPOINTMENT_REMINDER,
                title="Rappel de rendez-vous",
                message=message,
                channel=NotificationChannel.EMAIL,
                reference_id=appointment_id,
                reference_type="appointment",
            )

        # SMS notification (if enabled in preferences)
        if self._should_send_sms(user):
            self.create_notification(
                user_id=patient_id,
                notification_type=NotificationType.APPOINTMENT_REMINDER,
                title="Rappel RDV",
                message=f"RDV avec Dr. {doctor_name} le {appointment_date} à {appointment_time}",
                channel=NotificationChannel.SMS,
                reference_id=appointment_id,
                reference_type="appointment",
            )

    def send_appointment_confirmation(
        self,
        appointment_id: int,
        patient_id: int,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
    ):
        """Send appointment confirmation notification"""
        message = f"Votre rendez-vous avec Dr. {doctor_name} le {appointment_date} à {appointment_time} a été confirmé"

        self.create_notification(
            user_id=patient_id,
            notification_type=NotificationType.APPOINTMENT_CONFIRMED,
            title="Rendez-vous confirmé",
            message=message,
            channel=NotificationChannel.IN_APP,
            reference_id=appointment_id,
            reference_type="appointment",
        )

        user = self.db.query(User).filter(User.id == patient_id).first()
        if self._should_send_email(user):
            self.create_notification(
                user_id=patient_id,
                notification_type=NotificationType.APPOINTMENT_CONFIRMED,
                title="Rendez-vous confirmé",
                message=message,
                channel=NotificationChannel.EMAIL,
                reference_id=appointment_id,
                reference_type="appointment",
            )

    def send_prescription_ready(
        self,
        prescription_id: int,
        patient_id: int,
        medication_name: str,
    ):
        """Send prescription ready notification"""
        message = f"Votre ordonnance pour {medication_name} est prête"

        self.create_notification(
            user_id=patient_id,
            notification_type=NotificationType.PRESCRIPTION_READY,
            title="Ordonnance prête",
            message=message,
            channel=NotificationChannel.IN_APP,
            reference_id=prescription_id,
            reference_type="prescription",
        )

    def mark_as_read(self, notification_id: int) -> bool:
        """Mark a notification as read"""
        notification = (
            self.db.query(Notification).filter(Notification.id == notification_id).first()
        )
        if notification:
            from datetime import datetime
            notification.read_at = datetime.utcnow()
            self.db.commit()
            return True
        return False

    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications for a user as read"""
        from datetime import datetime
        count = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.read_at.is_(None))
            .update({"read_at": datetime.utcnow()})
        )
        self.db.commit()
        return count

    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Notification]:
        """Get notifications for a user"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.read_at.is_(None))

        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
        return notifications

    def _send_notification(self, notification: Notification):
        """
        Actually send the notification via the specified channel
        This is where you'd integrate with email, SMS, push services
        """
        if notification.channel == NotificationChannel.EMAIL:
            self._send_email(notification)
        elif notification.channel == NotificationChannel.SMS:
            self._send_sms(notification)
        elif notification.channel == NotificationChannel.PUSH:
            self._send_push(notification)
        # IN_APP notifications are stored in DB and don't need external sending

        # Mark as sent
        notification.sent_at = datetime.utcnow()
        self.db.commit()

    def _send_email(self, notification: Notification):
        """Send email notification - placeholder for actual implementation"""
        # TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        print(f"Sending email to user {notification.user_id}: {notification.title}")
        pass

    def _send_sms(self, notification: Notification):
        """Send SMS notification - placeholder for actual implementation"""
        # TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        print(f"Sending SMS to user {notification.user_id}: {notification.message}")
        pass

    def _send_push(self, notification: Notification):
        """Send push notification - placeholder for actual implementation"""
        # TODO: Integrate with push service (Firebase, OneSignal, etc.)
        print(f"Sending push to user {notification.user_id}: {notification.title}")
        pass

    def _should_send_email(self, user: User) -> bool:
        """Check if user wants email notifications"""
        # TODO: Check user notification preferences
        return user.email is not None

    def _should_send_sms(self, user: User) -> bool:
        """Check if user wants SMS notifications"""
        # TODO: Check user notification preferences
        return user.phone is not None


async def send_password_reset_email(email: str, first_name: str, reset_url: str):
    """
    Send password reset email (standalone function)
    
    Args:
        email: User email address
        first_name: User first name
        reset_url: URL for password reset
    """
    # TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    # For now, just log the reset URL
    print(f"Password reset email for {first_name} ({email})")
    print(f"Reset URL: {reset_url}")
    
    # In production, you would send an actual email like:
    # subject = "Réinitialisation de votre mot de passe - Santé"
    # body = f"""
    # Bonjour {first_name},
    # 
    # Vous avez demandé à réinitialiser votre mot de passe.
    # 
    # Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe:
    # {reset_url}
    # 
    # Ce lien est valable pendant 15 minutes.
    # 
    # Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    # 
    # Cordialement,
    # L'équipe Santé
    # """
    # await email_service.send(email, subject, body)
    pass

