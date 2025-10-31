"""
Medical data validation service
"""
import re
from typing import Optional, List, Dict, Tuple


class MedicationDatabase:
    """
    Simplified medication database for validation
    In production, integrate with:
    - RxNorm (US)
    - WHO ATC Classification
    - National drug databases
    """
    
    # Common medications (sample database)
    MEDICATIONS = {
        'amoxicillin': {
            'name': 'Amoxicillin',
            'class': 'antibiotic',
            'common_dosages': ['250mg', '500mg', '875mg'],
            'forms': ['tablet', 'capsule', 'suspension'],
            'warnings': ['penicillin allergy']
        },
        'ibuprofen': {
            'name': 'Ibuprofen',
            'class': 'nsaid',
            'common_dosages': ['200mg', '400mg', '600mg', '800mg'],
            'forms': ['tablet', 'capsule', 'liquid'],
            'warnings': ['stomach ulcers', 'kidney disease']
        },
        'metformin': {
            'name': 'Metformin',
            'class': 'antidiabetic',
            'common_dosages': ['500mg', '850mg', '1000mg'],
            'forms': ['tablet', 'extended-release'],
            'warnings': ['kidney disease', 'liver disease']
        },
        'lisinopril': {
            'name': 'Lisinopril',
            'class': 'ace_inhibitor',
            'common_dosages': ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
            'forms': ['tablet'],
            'warnings': ['pregnancy', 'kidney disease']
        },
        'atorvastatin': {
            'name': 'Atorvastatin',
            'class': 'statin',
            'common_dosages': ['10mg', '20mg', '40mg', '80mg'],
            'forms': ['tablet'],
            'warnings': ['liver disease', 'pregnancy']
        },
        'levothyroxine': {
            'name': 'Levothyroxine',
            'class': 'thyroid_hormone',
            'common_dosages': ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg'],
            'forms': ['tablet'],
            'warnings': ['heart disease']
        },
        'omeprazole': {
            'name': 'Omeprazole',
            'class': 'proton_pump_inhibitor',
            'common_dosages': ['10mg', '20mg', '40mg'],
            'forms': ['capsule', 'tablet'],
            'warnings': ['long-term use risks']
        }
    }
    
    # Drug interactions (simplified)
    INTERACTIONS = {
        ('ibuprofen', 'lisinopril'): {
            'severity': 'moderate',
            'description': 'NSAIDs may reduce the effectiveness of ACE inhibitors and increase risk of kidney problems'
        },
        ('atorvastatin', 'omeprazole'): {
            'severity': 'minor',
            'description': 'May slightly reduce atorvastatin effectiveness'
        }
    }
    
    @classmethod
    def search_medication(cls, name: str) -> Optional[Dict]:
        """
        Search for a medication by name
        
        Args:
            name: Medication name (case-insensitive)
        
        Returns:
            Medication info if found, None otherwise
        """
        name_lower = name.lower().strip()
        return cls.MEDICATIONS.get(name_lower)
    
    @classmethod
    def validate_medication_name(cls, name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate medication name
        
        Args:
            name: Medication name
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not name or len(name.strip()) < 2:
            return False, "Medication name is too short"
        
        med = cls.search_medication(name)
        if not med:
            return False, f"Medication '{name}' not found in database. Please verify spelling."
        
        return True, None
    
    @classmethod
    def check_interactions(cls, medications: List[str]) -> List[Dict]:
        """
        Check for drug interactions
        
        Args:
            medications: List of medication names
        
        Returns:
            List of interaction warnings
        """
        interactions = []
        medications_lower = [m.lower().strip() for m in medications]
        
        # Check all pairs
        for i, med1 in enumerate(medications_lower):
            for med2 in medications_lower[i+1:]:
                # Check both orders
                interaction = cls.INTERACTIONS.get((med1, med2)) or cls.INTERACTIONS.get((med2, med1))
                if interaction:
                    interactions.append({
                        'medications': [med1, med2],
                        'severity': interaction['severity'],
                        'description': interaction['description']
                    })
        
        return interactions


class DosageValidator:
    """Validate medication dosage formats"""
    
    # Common dosage patterns
    DOSAGE_PATTERNS = [
        r'^\d+(\.\d+)?\s*(mg|mcg|g|ml|units?)$',  # e.g., "500mg", "2.5mg", "10mcg"
        r'^\d+(\.\d+)?\s*(mg|mcg|g|ml|units?)/\d+(\.\d+)?\s*(mg|mcg|g|ml|units?)$',  # e.g., "500mg/5ml"
        r'^\d+(\.\d+)?\s*(mg|mcg|g|ml|units?)\s+\d+\s+times?\s+(daily|per\s+day)$',  # e.g., "500mg 2 times daily"
    ]
    
    @classmethod
    def validate_dosage_format(cls, dosage: str) -> Tuple[bool, Optional[str]]:
        """
        Validate dosage format
        
        Args:
            dosage: Dosage string
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not dosage or not dosage.strip():
            return False, "Dosage cannot be empty"
        
        dosage_clean = dosage.lower().strip()
        
        # Check against patterns
        for pattern in cls.DOSAGE_PATTERNS:
            if re.match(pattern, dosage_clean):
                return True, None
        
        return False, f"Invalid dosage format: '{dosage}'. Expected format like '500mg' or '10mg 2 times daily'"
    
    @classmethod
    def validate_dosage_range(cls, dosage: str, medication: str) -> Tuple[bool, Optional[str]]:
        """
        Validate if dosage is within common range for medication
        
        Args:
            dosage: Dosage string
            medication: Medication name
        
        Returns:
            Tuple of (is_valid, warning_message)
        """
        med_info = MedicationDatabase.search_medication(medication)
        if not med_info:
            return True, None  # Can't validate without medication info
        
        # Extract dosage amount (simplified)
        dosage_lower = dosage.lower().strip()
        common_dosages = [d.lower() for d in med_info['common_dosages']]
        
        # Check if dosage starts with a common dosage
        is_common = any(dosage_lower.startswith(common) for common in common_dosages)
        
        if not is_common:
            return True, f"Unusual dosage for {medication}. Common dosages: {', '.join(med_info['common_dosages'])}"
        
        return True, None


class MedicalTerminologyValidator:
    """Validate medical terminology"""
    
    # Common medical terms (sample)
    COMMON_DIAGNOSES = [
        'hypertension', 'diabetes', 'asthma', 'copd', 'pneumonia',
        'bronchitis', 'sinusitis', 'gastritis', 'arthritis', 'migraine',
        'depression', 'anxiety', 'insomnia', 'anemia', 'obesity'
    ]
    
    COMMON_SYMPTOMS = [
        'fever', 'cough', 'headache', 'nausea', 'vomiting', 'diarrhea',
        'fatigue', 'dizziness', 'chest pain', 'shortness of breath',
        'abdominal pain', 'back pain', 'sore throat', 'rash'
    ]
    
    @classmethod
    def validate_diagnosis(cls, diagnosis: str) -> Tuple[bool, Optional[str]]:
        """
        Validate diagnosis terminology
        
        Args:
            diagnosis: Diagnosis text
        
        Returns:
            Tuple of (is_valid, warning_message)
        """
        if not diagnosis or len(diagnosis.strip()) < 3:
            return False, "Diagnosis is too short"
        
        diagnosis_lower = diagnosis.lower().strip()
        
        # Check if it contains at least one common term
        contains_medical_term = any(
            term in diagnosis_lower 
            for term in cls.COMMON_DIAGNOSES + cls.COMMON_SYMPTOMS
        )
        
        if not contains_medical_term:
            return True, "Diagnosis does not contain recognized medical terms. Please verify."
        
        return True, None


class MedicalDataValidator:
    """Main medical data validation service"""
    
    @staticmethod
    def validate_prescription(
        medication: str,
        dosage: str,
        other_medications: Optional[List[str]] = None
    ) -> Dict:
        """
        Comprehensive prescription validation
        
        Args:
            medication: Medication name
            dosage: Dosage string
            other_medications: List of other medications patient is taking
        
        Returns:
            Dictionary with validation results and warnings
        """
        results = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'interactions': []
        }
        
        # Validate medication name
        is_valid, error = MedicationDatabase.validate_medication_name(medication)
        if not is_valid:
            results['valid'] = False
            results['errors'].append(error)
        
        # Validate dosage format
        is_valid, error = DosageValidator.validate_dosage_format(dosage)
        if not is_valid:
            results['valid'] = False
            results['errors'].append(error)
        else:
            # Check dosage range
            is_valid, warning = DosageValidator.validate_dosage_range(dosage, medication)
            if warning:
                results['warnings'].append(warning)
        
        # Check drug interactions
        if other_medications:
            all_meds = [medication] + other_medications
            interactions = MedicationDatabase.check_interactions(all_meds)
            if interactions:
                results['interactions'] = interactions
                for interaction in interactions:
                    if interaction['severity'] in ['severe', 'moderate']:
                        results['warnings'].append(
                            f"Drug interaction: {interaction['description']}"
                        )
        
        return results
    
    @staticmethod
    def validate_diagnosis(diagnosis: str) -> Dict:
        """
        Validate diagnosis
        
        Args:
            diagnosis: Diagnosis text
        
        Returns:
            Dictionary with validation results
        """
        results = {
            'valid': True,
            'warnings': []
        }
        
        is_valid, warning = MedicalTerminologyValidator.validate_diagnosis(diagnosis)
        if not is_valid:
            results['valid'] = False
        if warning:
            results['warnings'].append(warning)
        
        return results
