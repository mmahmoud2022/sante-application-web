"""
Enhanced appointment slot algorithm with advanced features
"""
from datetime import datetime, time, timedelta, date as date_type
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentType, AppointmentStatus
from app.models.schedule import DoctorSchedule
from app.schemas.doctor import AppointmentSlot


class AppointmentTypeConfig:
    """Configuration for different appointment types"""
    
    CONFIGURATIONS = {
        AppointmentType.IN_PERSON: {
            'default_duration': 30,
            'buffer_time': 5,
            'allow_overbooking': False
        },
        AppointmentType.VIDEO_CALL: {
            'default_duration': 20,
            'buffer_time': 0,  # No buffer needed for video calls
            'allow_overbooking': True  # Can handle back-to-back video calls
        },
        AppointmentType.PHONE_CALL: {
            'default_duration': 15,
            'buffer_time': 0,
            'allow_overbooking': True
        }
    }
    
    @classmethod
    def get_duration(cls, appointment_type: AppointmentType, custom_duration: Optional[int] = None) -> int:
        """Get appointment duration with type-specific defaults"""
        if custom_duration:
            return custom_duration
        return cls.CONFIGURATIONS[appointment_type]['default_duration']
    
    @classmethod
    def get_buffer_time(cls, appointment_type: AppointmentType) -> int:
        """Get buffer time for appointment type"""
        return cls.CONFIGURATIONS[appointment_type]['buffer_time']
    
    @classmethod
    def allows_overbooking(cls, appointment_type: AppointmentType) -> bool:
        """Check if appointment type allows overbooking"""
        return cls.CONFIGURATIONS[appointment_type]['allow_overbooking']


class BreakTimeManager:
    """Manage break times and lunch hours"""
    
    @staticmethod
    def get_default_breaks() -> List[Dict]:
        """
        Get default break times
        
        Returns:
            List of break time definitions
        """
        return [
            {
                'name': 'lunch',
                'start_time': time(12, 0),
                'end_time': time(13, 0),
                'days': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
        ]
    
    @staticmethod
    def is_during_break(
        slot_time: datetime,
        breaks: Optional[List[Dict]] = None
    ) -> bool:
        """
        Check if a time slot falls during a break period
        
        Args:
            slot_time: Datetime to check
            breaks: List of break definitions (uses defaults if None)
        
        Returns:
            True if slot is during a break
        """
        if breaks is None:
            breaks = BreakTimeManager.get_default_breaks()
        
        slot_time_only = slot_time.time()
        day_name = slot_time.strftime('%A').lower()
        
        for break_period in breaks:
            if day_name in break_period.get('days', []):
                if break_period['start_time'] <= slot_time_only < break_period['end_time']:
                    return True
        
        return False


class OverbookingPrevention:
    """Prevent appointment overbooking"""
    
    @staticmethod
    def check_slot_availability(
        db: Session,
        doctor_id: int,
        appointment_time: datetime,
        duration_minutes: int,
        appointment_type: AppointmentType,
        exclude_appointment_id: Optional[int] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if a time slot is available
        
        Args:
            db: Database session
            doctor_id: Doctor ID
            appointment_time: Requested appointment time
            duration_minutes: Appointment duration
            appointment_type: Type of appointment
            exclude_appointment_id: Appointment ID to exclude (for updates)
        
        Returns:
            Tuple of (is_available, error_message)
        """
        # Calculate time window
        appointment_end = appointment_time + timedelta(minutes=duration_minutes)
        
        # Add buffer time
        buffer_minutes = AppointmentTypeConfig.get_buffer_time(appointment_type)
        search_end = appointment_end + timedelta(minutes=buffer_minutes)
        
        # Query for overlapping appointments
        query = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.status.in_([
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED
            ]),
            Appointment.appointment_date < search_end,
            Appointment.appointment_date + timedelta(minutes=Appointment.duration_minutes) > appointment_time
        )
        
        if exclude_appointment_id:
            query = query.filter(Appointment.id != exclude_appointment_id)
        
        overlapping = query.all()
        
        # Check if overbooking is allowed for this type
        if overlapping:
            if not AppointmentTypeConfig.allows_overbooking(appointment_type):
                return False, f"Time slot is already booked. Next available slot is after {overlapping[0].appointment_date}"
            
            # Even if overbooking is allowed, limit concurrent appointments
            concurrent_limit = 3  # Maximum concurrent video/phone appointments
            if len(overlapping) >= concurrent_limit:
                return False, f"Maximum concurrent appointments reached ({concurrent_limit})"
        
        return True, None
    
    @staticmethod
    def get_next_available_slot(
        db: Session,
        doctor_id: int,
        start_time: datetime,
        duration_minutes: int,
        appointment_type: AppointmentType,
        max_search_hours: int = 24
    ) -> Optional[datetime]:
        """
        Find the next available appointment slot
        
        Args:
            db: Database session
            doctor_id: Doctor ID
            start_time: Start searching from this time
            duration_minutes: Required duration
            appointment_type: Type of appointment
            max_search_hours: Maximum hours to search ahead
        
        Returns:
            Next available slot datetime or None
        """
        current_time = start_time
        end_time = start_time + timedelta(hours=max_search_hours)
        slot_interval = timedelta(minutes=15)  # Check every 15 minutes
        
        while current_time < end_time:
            is_available, _ = OverbookingPrevention.check_slot_availability(
                db, doctor_id, current_time, duration_minutes, appointment_type
            )
            
            if is_available:
                # Also check if it's during break time
                if not BreakTimeManager.is_during_break(current_time):
                    return current_time
            
            current_time += slot_interval
        
        return None


class SmartSlotGenerator:
    """Generate optimized appointment slots"""
    
    @staticmethod
    def generate_optimized_slots(
        db: Session,
        doctor_id: int,
        target_date: date_type,
        appointment_type: AppointmentType,
        custom_breaks: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """
        Generate optimized appointment slots with all constraints
        
        Args:
            db: Database session
            doctor_id: Doctor ID
            target_date: Date to generate slots for
            appointment_type: Type of appointments
            custom_breaks: Custom break times
        
        Returns:
            List of available slots with metadata
        """
        from app.services.doctor_service import get_available_slots_for_date
        
        # Get base slots from schedule
        base_slots = get_available_slots_for_date(db, doctor_id=doctor_id, target_date=target_date)
        
        optimized_slots = []
        
        for slot in base_slots:
            # Parse slot time
            hour, minute = map(int, slot.time.split(':'))
            slot_datetime = datetime.combine(target_date, time(hour, minute))
            
            # Skip if during break
            if BreakTimeManager.is_during_break(slot_datetime, custom_breaks):
                continue
            
            # Get appropriate duration for appointment type
            duration = AppointmentTypeConfig.get_duration(
                appointment_type,
                custom_duration=slot.duration
            )
            
            # Check availability with overbooking rules
            is_available, message = OverbookingPrevention.check_slot_availability(
                db, doctor_id, slot_datetime, duration, appointment_type
            )
            
            if is_available:
                optimized_slots.append({
                    'time': slot.time,
                    'duration': duration,
                    'location': slot.location,
                    'appointment_type': appointment_type.value,
                    'buffer_time': AppointmentTypeConfig.get_buffer_time(appointment_type),
                    'allows_overbooking': AppointmentTypeConfig.allows_overbooking(appointment_type)
                })
        
        return optimized_slots
    
    @staticmethod
    def suggest_alternative_slots(
        db: Session,
        doctor_id: int,
        preferred_date: date_type,
        appointment_type: AppointmentType,
        days_to_search: int = 7
    ) -> List[Dict]:
        """
        Suggest alternative slots if preferred date is full
        
        Args:
            db: Database session
            doctor_id: Doctor ID
            preferred_date: Preferred date
            appointment_type: Type of appointment
            days_to_search: Number of days to search
        
        Returns:
            List of alternative slots across multiple days
        """
        suggestions = []
        
        for day_offset in range(days_to_search):
            check_date = preferred_date + timedelta(days=day_offset)
            
            slots = SmartSlotGenerator.generate_optimized_slots(
                db, doctor_id, check_date, appointment_type
            )
            
            if slots:
                suggestions.append({
                    'date': check_date.isoformat(),
                    'slots': slots[:3],  # Top 3 slots per day
                    'total_available': len(slots)
                })
                
                # Stop if we have enough suggestions
                if len(suggestions) >= 3:
                    break
        
        return suggestions
