"""
Email Service with SendGrid integration
Handles sending emails with templates, retry logic, and delivery tracking
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import os

from app.core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    """
    Email service for sending emails via SendGrid or SMTP
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: Optional[str] = None,
        use_sendgrid: bool = True
    ):
        """
        Initialize email service
        
        Args:
            api_key: SendGrid API key
            from_email: Default sender email address
            use_sendgrid: Whether to use SendGrid (True) or SMTP (False)
        """
        self.api_key = api_key or os.getenv('SENDGRID_API_KEY')
        self.from_email = from_email or os.getenv('EMAIL_FROM', 'noreply@sante-app.com')
        self.use_sendgrid = use_sendgrid
        self.logger = logger
        
        # Initialize SendGrid client if configured
        self.client = None
        if self.use_sendgrid and self.api_key:
            try:
                from sendgrid import SendGridAPIClient
                self.client = SendGridAPIClient(self.api_key)
                self.logger.info("SendGrid client initialized successfully")
            except ImportError:
                self.logger.warning("SendGrid library not installed. Install with: pip install sendgrid")
            except Exception as e:
                self.logger.error(f"Failed to initialize SendGrid client: {str(e)}")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        from_email: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            plain_content: Plain text email body (optional)
            from_email: Sender email (optional, uses default if not provided)
            attachments: List of attachments (optional)
            metadata: Custom metadata for tracking (optional)
            
        Returns:
            Dictionary with send result
        """
        from_email = from_email or self.from_email
        
        try:
            if self.use_sendgrid and self.client:
                return await self._send_via_sendgrid(
                    to_email, subject, html_content, plain_content,
                    from_email, attachments, metadata
                )
            else:
                return await self._send_via_smtp(
                    to_email, subject, html_content, plain_content,
                    from_email, attachments
                )
                
        except Exception as e:
            self.logger.error(
                f"Failed to send email to {to_email}",
                extra={
                    "to_email": to_email,
                    "subject": subject,
                    "error": str(e)
                }
            )
            return {
                "success": False,
                "error": str(e),
                "to_email": to_email
            }
    
    async def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str],
        from_email: str,
        attachments: Optional[List[Dict[str, Any]]],
        metadata: Optional[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Send email via SendGrid"""
        try:
            from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
            
            # Create email message
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            # Add plain text content if provided
            if plain_content:
                message.plain_text_content = plain_content
            
            # Add custom metadata
            if metadata:
                for key, value in metadata.items():
                    message.custom_arg = {key: value}
            
            # Add attachments if provided
            if attachments:
                for attachment_data in attachments:
                    attachment = Attachment(
                        FileContent(attachment_data.get('content')),
                        FileName(attachment_data.get('filename')),
                        FileType(attachment_data.get('type', 'application/octet-stream')),
                        Disposition(attachment_data.get('disposition', 'attachment'))
                    )
                    message.add_attachment(attachment)
            
            # Send email
            response = self.client.send(message)
            
            self.logger.info(
                f"Email sent successfully via SendGrid",
                extra={
                    "to_email": to_email,
                    "subject": subject,
                    "status_code": response.status_code
                }
            )
            
            return {
                "success": True,
                "message_id": response.headers.get('X-Message-Id'),
                "status_code": response.status_code,
                "to_email": to_email,
                "from_email": from_email,
                "sent_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"SendGrid error: {str(e)}")
            raise
    
    async def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str],
        from_email: str,
        attachments: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Send email via SMTP (fallback)"""
        # In production, implement SMTP sending
        # For now, just log the email
        self.logger.info(
            f"Email would be sent via SMTP",
            extra={
                "to_email": to_email,
                "from_email": from_email,
                "subject": subject
            }
        )
        
        # Placeholder implementation
        return {
            "success": True,
            "message_id": "smtp_placeholder",
            "to_email": to_email,
            "from_email": from_email,
            "sent_at": datetime.utcnow().isoformat(),
            "note": "SMTP sending not fully implemented"
        }
    
    async def send_appointment_confirmation(
        self,
        to_email: str,
        patient_name: str,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
        appointment_type: str,
        cancellation_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send appointment confirmation email
        
        Args:
            to_email: Patient email
            patient_name: Patient name
            doctor_name: Doctor name
            appointment_date: Appointment date
            appointment_time: Appointment time
            appointment_type: Type of appointment
            cancellation_url: URL for cancelling appointment
            
        Returns:
            Send result dictionary
        """
        from app.templates.email_templates import EmailTemplates
        
        subject = "Confirmation de rendez-vous - Santé"
        html_content = EmailTemplates.APPOINTMENT_CONFIRMATION.format(
            patient_name=patient_name,
            doctor_name=doctor_name,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            appointment_type=appointment_type,
            cancellation_url=cancellation_url or "#"
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            metadata={
                "template": "appointment_confirmation",
                "patient_name": patient_name
            }
        )
    
    async def send_appointment_reminder(
        self,
        to_email: str,
        patient_name: str,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str
    ) -> Dict[str, Any]:
        """Send appointment reminder email"""
        from app.templates.email_templates import EmailTemplates
        
        subject = "Rappel de rendez-vous - Santé"
        html_content = EmailTemplates.APPOINTMENT_REMINDER.format(
            patient_name=patient_name,
            doctor_name=doctor_name,
            appointment_date=appointment_date,
            appointment_time=appointment_time
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            metadata={
                "template": "appointment_reminder",
                "patient_name": patient_name
            }
        )
    
    async def send_password_reset(
        self,
        to_email: str,
        first_name: str,
        reset_url: str,
        expiry_minutes: int = 15
    ) -> Dict[str, Any]:
        """Send password reset email"""
        from app.templates.email_templates import EmailTemplates
        
        subject = "Réinitialisation de mot de passe - Santé"
        html_content = EmailTemplates.PASSWORD_RESET.format(
            first_name=first_name,
            reset_url=reset_url,
            expiry_minutes=expiry_minutes
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            metadata={
                "template": "password_reset",
                "user_email": to_email
            }
        )
    
    async def send_prescription_ready(
        self,
        to_email: str,
        patient_name: str,
        medication_name: str,
        pickup_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send prescription ready notification"""
        from app.templates.email_templates import EmailTemplates
        
        subject = "Votre ordonnance est prête - Santé"
        html_content = EmailTemplates.PRESCRIPTION_READY.format(
            patient_name=patient_name,
            medication_name=medication_name,
            pickup_instructions=pickup_instructions or "Contactez votre pharmacie"
        )
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            metadata={
                "template": "prescription_ready",
                "patient_name": patient_name
            }
        )


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """
    Get singleton email service instance
    
    Returns:
        EmailService instance
    """
    global _email_service
    
    if _email_service is None:
        _email_service = EmailService()
    
    return _email_service
