"""
SMS Notification Service
Handles sending SMS notifications using Twilio or other providers
"""
from typing import Optional
from datetime import datetime
import os

# For production, you would install and import:
# from twilio.rest import Client


class SMSService:
    """Service for sending SMS notifications"""

    def __init__(self):
        """
        Initialize SMS service with credentials
        
        In production, these would come from environment variables or config
        """
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        
        # Initialize Twilio client (when Twilio is installed)
        # self.client = Client(self.account_sid, self.auth_token)
        self.client = None
        
        # Check if credentials are configured
        self.is_configured = all([
            self.account_sid,
            self.auth_token,
            self.from_number
        ])

    def send_sms(
        self,
        to_number: str,
        message: str,
        reference_id: Optional[str] = None
    ) -> dict:
        """
        Send an SMS message
        
        Args:
            to_number: Recipient phone number (E.164 format: +33612345678)
            message: Message content (max 160 characters for single SMS)
            reference_id: Optional reference for tracking
            
        Returns:
            Dictionary with send result
        """
        if not self.is_configured:
            print(f"[SMS] Not configured. Would send to {to_number}: {message}")
            return {
                "success": False,
                "error": "SMS service not configured",
                "message": message,
                "to": to_number,
            }
        
        try:
            # In production with Twilio:
            # message = self.client.messages.create(
            #     body=message,
            #     from_=self.from_number,
            #     to=to_number
            # )
            # 
            # return {
            #     "success": True,
            #     "sid": message.sid,
            #     "status": message.status,
            #     "to": to_number,
            #     "from": self.from_number,
            #     "reference_id": reference_id,
            # }
            
            # Placeholder for development
            print(f"[SMS] To: {to_number}")
            print(f"[SMS] Message: {message}")
            print(f"[SMS] Reference: {reference_id}")
            
            return {
                "success": True,
                "sid": "placeholder_sid",
                "status": "sent",
                "to": to_number,
                "from": self.from_number,
                "reference_id": reference_id,
            }
            
        except Exception as e:
            print(f"[SMS] Error sending to {to_number}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "to": to_number,
            }

    def send_appointment_reminder(
        self,
        patient_phone: str,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
        appointment_id: int
    ) -> dict:
        """
        Send appointment reminder SMS
        
        Args:
            patient_phone: Patient's phone number
            doctor_name: Doctor's name
            appointment_date: Appointment date (formatted)
            appointment_time: Appointment time
            appointment_id: Appointment ID for reference
            
        Returns:
            Send result dictionary
        """
        message = (
            f"Rappel RDV Santé: "
            f"Rendez-vous avec Dr. {doctor_name} "
            f"le {appointment_date} à {appointment_time}. "
            f"Réf: #{appointment_id}"
        )
        
        return self.send_sms(
            to_number=patient_phone,
            message=message,
            reference_id=f"appointment_{appointment_id}"
        )

    def send_appointment_confirmation(
        self,
        patient_phone: str,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
        appointment_id: int
    ) -> dict:
        """
        Send appointment confirmation SMS
        """
        message = (
            f"Santé: Votre RDV avec Dr. {doctor_name} "
            f"le {appointment_date} à {appointment_time} "
            f"est confirmé. Réf: #{appointment_id}"
        )
        
        return self.send_sms(
            to_number=patient_phone,
            message=message,
            reference_id=f"appointment_confirm_{appointment_id}"
        )

    def send_appointment_cancellation(
        self,
        patient_phone: str,
        appointment_date: str,
        appointment_time: str,
        appointment_id: int
    ) -> dict:
        """
        Send appointment cancellation SMS
        """
        message = (
            f"Santé: Votre RDV du {appointment_date} "
            f"à {appointment_time} a été annulé. "
            f"Veuillez nous contacter. Réf: #{appointment_id}"
        )
        
        return self.send_sms(
            to_number=patient_phone,
            message=message,
            reference_id=f"appointment_cancel_{appointment_id}"
        )

    def send_prescription_ready(
        self,
        patient_phone: str,
        medication_name: str,
        pharmacy_name: Optional[str] = None
    ) -> dict:
        """
        Send prescription ready notification
        """
        if pharmacy_name:
            message = (
                f"Santé: Votre ordonnance pour {medication_name} "
                f"est prête chez {pharmacy_name}."
            )
        else:
            message = f"Santé: Votre ordonnance pour {medication_name} est prête."
        
        return self.send_sms(
            to_number=patient_phone,
            message=message,
            reference_id=f"prescription_{medication_name}"
        )

    def send_verification_code(
        self,
        phone_number: str,
        verification_code: str
    ) -> dict:
        """
        Send verification code for two-factor authentication
        
        Args:
            phone_number: Phone number to send code to
            verification_code: 6-digit verification code
            
        Returns:
            Send result dictionary
        """
        message = f"Santé: Votre code de vérification est {verification_code}. Valide 10 minutes."
        
        return self.send_sms(
            to_number=phone_number,
            message=message,
            reference_id=f"2fa_{verification_code}"
        )

    def send_password_reset_code(
        self,
        phone_number: str,
        reset_code: str
    ) -> dict:
        """
        Send password reset code via SMS
        
        Args:
            phone_number: Phone number
            reset_code: Reset code
            
        Returns:
            Send result dictionary
        """
        message = f"Santé: Code de réinitialisation: {reset_code}. Valide 15 minutes."
        
        return self.send_sms(
            to_number=phone_number,
            message=message,
            reference_id=f"reset_{reset_code}"
        )

    def format_phone_number(self, phone: str, country_code: str = "+33") -> str:
        """
        Format phone number to E.164 format
        
        Args:
            phone: Phone number (may have various formats)
            country_code: Country code (default: +33 for France)
            
        Returns:
            Formatted phone number
        """
        # Remove spaces, dashes, dots, parentheses
        cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
        
        # If already has country code, return as is
        if cleaned.startswith('+'):
            return cleaned
        
        # If starts with 0, replace with country code
        if cleaned.startswith('0'):
            cleaned = cleaned[1:]
        
        return f"{country_code}{cleaned}"

    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate phone number format
        
        Args:
            phone: Phone number to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Basic validation - in production, use a library like phonenumbers
        cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
        
        # E.164 format: +[country code][number]
        # Length: 7-15 digits (including country code)
        if cleaned.startswith('+') and 7 <= len(cleaned) <= 15:
            return True
        
        # French mobile: 0[6-7]XXXXXXXX (10 digits)
        if cleaned.startswith('0') and len(cleaned) == 10:
            return True
        
        return False


# Singleton instance
_sms_service = None


def get_sms_service() -> SMSService:
    """
    Get singleton SMS service instance
    
    Returns:
        SMSService instance
    """
    global _sms_service
    if _sms_service is None:
        _sms_service = SMSService()
    return _sms_service


# Integration with notification service
async def send_sms_notification(
    phone_number: str,
    message: str,
    reference_id: Optional[str] = None
) -> dict:
    """
    Convenience function to send SMS
    
    Args:
        phone_number: Recipient phone number
        message: Message content
        reference_id: Optional reference ID
        
    Returns:
        Send result dictionary
    """
    sms_service = get_sms_service()
    return sms_service.send_sms(phone_number, message, reference_id)
