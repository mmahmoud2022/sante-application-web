"""
Analytics Service
Provides analytics and metrics for the platform
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.user import User
from app.models.appointment import Appointment


class AnalyticsService:
    """Service for generating analytics and metrics"""

    def __init__(self, db: Session):
        self.db = db

    def get_user_statistics(self) -> Dict[str, Any]:
        """
        Get overall user statistics
        
        Returns:
            Dictionary with user counts by role and status
        """
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()
        inactive_users = total_users - active_users
        
        patients = self.db.query(User).filter(User.role == "patient").count()
        doctors = self.db.query(User).filter(User.role == "doctor").count()
        admins = self.db.query(User).filter(User.role == "admin").count()
        
        verified_users = self.db.query(User).filter(User.is_verified == True).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "patients": patients,
            "doctors": doctors,
            "admins": admins,
            "verified_users": verified_users,
            "verification_rate": (verified_users / total_users * 100) if total_users > 0 else 0,
        }

    def get_appointment_statistics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get appointment statistics for the last N days
        
        Args:
            days: Number of days to look back (default: 30)
            
        Returns:
            Dictionary with appointment metrics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        total_appointments = self.db.query(Appointment).filter(
            Appointment.created_at >= cutoff_date
        ).count()
        
        pending = self.db.query(Appointment).filter(
            and_(
                Appointment.status == "pending",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        confirmed = self.db.query(Appointment).filter(
            and_(
                Appointment.status == "confirmed",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        completed = self.db.query(Appointment).filter(
            and_(
                Appointment.status == "completed",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        cancelled = self.db.query(Appointment).filter(
            and_(
                Appointment.status == "cancelled",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        # Today's appointments
        today = datetime.utcnow().date()
        today_appointments = self.db.query(Appointment).filter(
            func.date(Appointment.appointment_date) == today
        ).count()
        
        return {
            "period_days": days,
            "total_appointments": total_appointments,
            "pending": pending,
            "confirmed": confirmed,
            "completed": completed,
            "cancelled": cancelled,
            "completion_rate": (completed / total_appointments * 100) if total_appointments > 0 else 0,
            "cancellation_rate": (cancelled / total_appointments * 100) if total_appointments > 0 else 0,
            "today_appointments": today_appointments,
        }

    def get_doctor_performance(self, doctor_id: int, days: int = 30) -> Dict[str, Any]:
        """
        Get performance metrics for a specific doctor
        
        Args:
            doctor_id: ID of the doctor
            days: Number of days to look back (default: 30)
            
        Returns:
            Dictionary with doctor performance metrics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        total_appointments = self.db.query(Appointment).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        completed = self.db.query(Appointment).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.status == "completed",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        cancelled = self.db.query(Appointment).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.status == "cancelled",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        # Unique patients
        unique_patients = self.db.query(func.count(func.distinct(Appointment.patient_id))).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.created_at >= cutoff_date
            )
        ).scalar()
        
        return {
            "doctor_id": doctor_id,
            "period_days": days,
            "total_appointments": total_appointments,
            "completed_appointments": completed,
            "cancelled_appointments": cancelled,
            "unique_patients": unique_patients,
            "completion_rate": (completed / total_appointments * 100) if total_appointments > 0 else 0,
        }

    def get_revenue_statistics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get revenue statistics (placeholder - requires payment integration)
        
        Args:
            days: Number of days to look back (default: 30)
            
        Returns:
            Dictionary with revenue metrics
        """
        # This is a placeholder. In production, you would query actual payment records
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        completed_appointments = self.db.query(Appointment).filter(
            and_(
                Appointment.status == "completed",
                Appointment.created_at >= cutoff_date
            )
        ).count()
        
        # Placeholder calculation (assumes 50€ per appointment)
        estimated_revenue = completed_appointments * 50
        
        return {
            "period_days": days,
            "completed_appointments": completed_appointments,
            "estimated_revenue": estimated_revenue,
            "currency": "EUR",
            "note": "This is an estimated calculation. Integrate with payment provider for actual revenue."
        }

    def get_growth_metrics(self) -> Dict[str, Any]:
        """
        Get platform growth metrics
        
        Returns:
            Dictionary with growth statistics
        """
        now = datetime.utcnow()
        
        # Users registered in the last 7 days
        week_ago = now - timedelta(days=7)
        new_users_week = self.db.query(User).filter(
            User.created_at >= week_ago
        ).count()
        
        # Users registered in the last 30 days
        month_ago = now - timedelta(days=30)
        new_users_month = self.db.query(User).filter(
            User.created_at >= month_ago
        ).count()
        
        # Appointments in the last 7 days
        new_appointments_week = self.db.query(Appointment).filter(
            Appointment.created_at >= week_ago
        ).count()
        
        # Appointments in the last 30 days
        new_appointments_month = self.db.query(Appointment).filter(
            Appointment.created_at >= month_ago
        ).count()
        
        return {
            "new_users_last_7_days": new_users_week,
            "new_users_last_30_days": new_users_month,
            "new_appointments_last_7_days": new_appointments_week,
            "new_appointments_last_30_days": new_appointments_month,
        }

    def get_dashboard_metrics(self, user_id: Optional[int] = None, role: str = "admin") -> Dict[str, Any]:
        """
        Get comprehensive dashboard metrics based on user role
        
        Args:
            user_id: User ID (for doctor-specific metrics)
            role: User role (admin, doctor, patient)
            
        Returns:
            Dictionary with role-specific metrics
        """
        if role == "admin":
            return {
                "users": self.get_user_statistics(),
                "appointments": self.get_appointment_statistics(),
                "revenue": self.get_revenue_statistics(),
                "growth": self.get_growth_metrics(),
            }
        elif role == "doctor" and user_id:
            return {
                "performance": self.get_doctor_performance(user_id),
                "appointments": self.get_appointment_statistics(),
            }
        else:
            # Patient dashboard metrics
            return {
                "appointments": self.get_appointment_statistics(),
            }


def get_analytics_service(db: Session) -> AnalyticsService:
    """Factory function to get analytics service instance"""
    return AnalyticsService(db)
