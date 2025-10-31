"""
Password policy enforcement with strong security requirements
"""
import re
from typing import Tuple, List


class PasswordPolicy:
    """
    Password policy enforcement class
    
    Default requirements:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    
    MIN_LENGTH = 12
    SPECIAL_CHARACTERS = "!@#$%^&*(),.?\":{}|<>"
    
    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, str]:
        """
        Validate password against security policy
        
        Args:
            password: Password to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not password:
            return False, "Password is required"
        
        # Check minimum length
        if len(password) < PasswordPolicy.MIN_LENGTH:
            return False, f"Password must be at least {PasswordPolicy.MIN_LENGTH} characters long"
        
        # Check for uppercase letter
        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"
        
        # Check for lowercase letter
        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"
        
        # Check for digit
        if not re.search(r"\d", password):
            return False, "Password must contain at least one digit"
        
        # Check for special character
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False, "Password must contain at least one special character"
        
        # Check for common weak passwords
        weak_passwords = [
            "password123!",
            "admin123456!",
            "welcome12345!",
            "Password123!",
            "Qwerty123456!",
        ]
        
        if password.lower() in [p.lower() for p in weak_passwords]:
            return False, "Password is too common, please choose a stronger password"
        
        return True, "Password is strong"
    
    @staticmethod
    def get_password_requirements() -> List[str]:
        """
        Get list of password requirements
        
        Returns:
            List of requirement strings
        """
        return [
            f"At least {PasswordPolicy.MIN_LENGTH} characters long",
            "At least one uppercase letter (A-Z)",
            "At least one lowercase letter (a-z)",
            "At least one digit (0-9)",
            "At least one special character (!@#$%^&*(),.?\":{}|<>)",
            "Not a commonly used password"
        ]
    
    @staticmethod
    def calculate_password_strength(password: str) -> dict:
        """
        Calculate password strength score and provide feedback
        
        Args:
            password: Password to analyze
            
        Returns:
            Dictionary with strength score and feedback
        """
        score = 0
        feedback = []
        
        # Length check
        if len(password) >= PasswordPolicy.MIN_LENGTH:
            score += 20
        elif len(password) >= 8:
            score += 10
            feedback.append(f"Password should be at least {PasswordPolicy.MIN_LENGTH} characters")
        else:
            feedback.append(f"Password is too short (minimum {PasswordPolicy.MIN_LENGTH} characters)")
        
        # Uppercase check
        if re.search(r"[A-Z]", password):
            score += 15
        else:
            feedback.append("Add uppercase letters")
        
        # Lowercase check
        if re.search(r"[a-z]", password):
            score += 15
        else:
            feedback.append("Add lowercase letters")
        
        # Digit check
        if re.search(r"\d", password):
            score += 15
        else:
            feedback.append("Add numbers")
        
        # Special character check
        if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            score += 15
        else:
            feedback.append("Add special characters")
        
        # Length bonus
        if len(password) >= 16:
            score += 10
        
        # Character diversity bonus
        unique_chars = len(set(password))
        if unique_chars >= 10:
            score += 10
        
        # Determine strength level
        if score >= 90:
            strength = "excellent"
        elif score >= 75:
            strength = "strong"
        elif score >= 60:
            strength = "good"
        elif score >= 40:
            strength = "fair"
        else:
            strength = "weak"
        
        return {
            "score": score,
            "strength": strength,
            "feedback": feedback if feedback else ["Password meets all requirements"]
        }


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Convenience function to validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    return PasswordPolicy.validate_password_strength(password)


def get_password_requirements() -> List[str]:
    """
    Convenience function to get password requirements
    
    Returns:
        List of requirement strings
    """
    return PasswordPolicy.get_password_requirements()
