"""
Internationalization (i18n) support
"""
from typing import Optional
from fastapi import Request


# Translation dictionary for common messages
# In production, this would be loaded from .po/.mo files using gettext
TRANSLATIONS = {
    'en': {
        # Authentication messages
        'auth.invalid_credentials': 'Invalid email or password',
        'auth.account_locked': 'Account temporarily locked due to multiple failed login attempts',
        'auth.account_inactive': 'Account is inactive. Please contact support.',
        'auth.password_too_weak': 'Password does not meet security requirements',
        'auth.email_already_exists': 'Email already registered',
        
        # Validation messages
        'validation.required_field': 'This field is required',
        'validation.invalid_email': 'Invalid email address',
        'validation.invalid_phone': 'Invalid phone number',
        'validation.invalid_date': 'Invalid date format',
        
        # Appointment messages
        'appointment.not_found': 'Appointment not found',
        'appointment.slot_unavailable': 'This time slot is no longer available',
        'appointment.cannot_cancel': 'Cannot cancel appointment within 24 hours of scheduled time',
        'appointment.created': 'Appointment created successfully',
        'appointment.cancelled': 'Appointment cancelled successfully',
        
        # Error messages
        'error.internal_server': 'An internal server error occurred',
        'error.not_found': 'Resource not found',
        'error.forbidden': 'You do not have permission to access this resource',
        'error.unauthorized': 'Authentication required',
        
        # Success messages
        'success.created': 'Created successfully',
        'success.updated': 'Updated successfully',
        'success.deleted': 'Deleted successfully',
    },
    'fr': {
        # Authentication messages
        'auth.invalid_credentials': 'Email ou mot de passe invalide',
        'auth.account_locked': 'Compte temporairement verrouillé en raison de plusieurs tentatives de connexion échouées',
        'auth.account_inactive': 'Le compte est inactif. Veuillez contacter le support.',
        'auth.password_too_weak': 'Le mot de passe ne répond pas aux exigences de sécurité',
        'auth.email_already_exists': 'Email déjà enregistré',
        
        # Validation messages
        'validation.required_field': 'Ce champ est obligatoire',
        'validation.invalid_email': 'Adresse email invalide',
        'validation.invalid_phone': 'Numéro de téléphone invalide',
        'validation.invalid_date': 'Format de date invalide',
        
        # Appointment messages
        'appointment.not_found': 'Rendez-vous non trouvé',
        'appointment.slot_unavailable': 'Ce créneau horaire n\'est plus disponible',
        'appointment.cannot_cancel': 'Impossible d\'annuler le rendez-vous dans les 24 heures précédant l\'heure prévue',
        'appointment.created': 'Rendez-vous créé avec succès',
        'appointment.cancelled': 'Rendez-vous annulé avec succès',
        
        # Error messages
        'error.internal_server': 'Une erreur interne du serveur s\'est produite',
        'error.not_found': 'Ressource non trouvée',
        'error.forbidden': 'Vous n\'avez pas la permission d\'accéder à cette ressource',
        'error.unauthorized': 'Authentification requise',
        
        # Success messages
        'success.created': 'Créé avec succès',
        'success.updated': 'Mis à jour avec succès',
        'success.deleted': 'Supprimé avec succès',
    },
    'ar': {
        # Authentication messages
        'auth.invalid_credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        'auth.account_locked': 'تم قفل الحساب مؤقتًا بسبب محاولات تسجيل دخول فاشلة متعددة',
        'auth.account_inactive': 'الحساب غير نشط. يرجى الاتصال بالدعم.',
        'auth.password_too_weak': 'كلمة المرور لا تلبي متطلبات الأمان',
        'auth.email_already_exists': 'البريد الإلكتروني مسجل بالفعل',
        
        # Validation messages
        'validation.required_field': 'هذا الحقل مطلوب',
        'validation.invalid_email': 'عنوان البريد الإلكتروني غير صالح',
        'validation.invalid_phone': 'رقم الهاتف غير صالح',
        'validation.invalid_date': 'تنسيق التاريخ غير صالح',
        
        # Appointment messages
        'appointment.not_found': 'الموعد غير موجود',
        'appointment.slot_unavailable': 'هذا الوقت لم يعد متاحًا',
        'appointment.cannot_cancel': 'لا يمكن إلغاء الموعد خلال 24 ساعة من الوقت المحدد',
        'appointment.created': 'تم إنشاء الموعد بنجاح',
        'appointment.cancelled': 'تم إلغاء الموعد بنجاح',
        
        # Error messages
        'error.internal_server': 'حدث خطأ داخلي في الخادم',
        'error.not_found': 'المورد غير موجود',
        'error.forbidden': 'ليس لديك إذن للوصول إلى هذا المورد',
        'error.unauthorized': 'المصادقة مطلوبة',
        
        # Success messages
        'success.created': 'تم الإنشاء بنجاح',
        'success.updated': 'تم التحديث بنجاح',
        'success.deleted': 'تم الحذف بنجاح',
    },
    'es': {
        # Authentication messages
        'auth.invalid_credentials': 'Correo electrónico o contraseña no válidos',
        'auth.account_locked': 'Cuenta bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión',
        'auth.account_inactive': 'La cuenta está inactiva. Por favor, contacte con soporte.',
        'auth.password_too_weak': 'La contraseña no cumple con los requisitos de seguridad',
        'auth.email_already_exists': 'Correo electrónico ya registrado',
        
        # Validation messages
        'validation.required_field': 'Este campo es obligatorio',
        'validation.invalid_email': 'Dirección de correo electrónico no válida',
        'validation.invalid_phone': 'Número de teléfono no válido',
        'validation.invalid_date': 'Formato de fecha no válido',
        
        # Appointment messages
        'appointment.not_found': 'Cita no encontrada',
        'appointment.slot_unavailable': 'Este horario ya no está disponible',
        'appointment.cannot_cancel': 'No se puede cancelar la cita dentro de las 24 horas anteriores a la hora programada',
        'appointment.created': 'Cita creada con éxito',
        'appointment.cancelled': 'Cita cancelada con éxito',
        
        # Error messages
        'error.internal_server': 'Ocurrió un error interno del servidor',
        'error.not_found': 'Recurso no encontrado',
        'error.forbidden': 'No tienes permiso para acceder a este recurso',
        'error.unauthorized': 'Se requiere autenticación',
        
        # Success messages
        'success.created': 'Creado con éxito',
        'success.updated': 'Actualizado con éxito',
        'success.deleted': 'Eliminado con éxito',
    }
}


def get_language_from_request(request: Request) -> str:
    """
    Extract language preference from request
    
    Checks (in order):
    1. Query parameter: ?lang=fr
    2. Accept-Language header
    3. Default to 'en'
    
    Args:
        request: FastAPI request object
    
    Returns:
        Language code (e.g., 'en', 'fr', 'ar', 'es')
    """
    # Check query parameter
    lang = request.query_params.get('lang')
    if lang and lang in TRANSLATIONS:
        return lang
    
    # Check Accept-Language header
    accept_language = request.headers.get('accept-language', '')
    if accept_language:
        # Parse Accept-Language header (simplified)
        # Format: "en-US,en;q=0.9,fr;q=0.8"
        languages = accept_language.split(',')
        for lang_option in languages:
            lang_code = lang_option.split(';')[0].strip().split('-')[0].lower()
            if lang_code in TRANSLATIONS:
                return lang_code
    
    # Default to English
    return 'en'


def translate(key: str, language: str = 'en', **kwargs) -> str:
    """
    Translate a message key to the specified language
    
    Args:
        key: Translation key (e.g., 'auth.invalid_credentials')
        language: Target language code
        **kwargs: Variables to substitute in the message
    
    Returns:
        Translated message
    """
    # Get translation or fall back to English
    translations = TRANSLATIONS.get(language, TRANSLATIONS['en'])
    message = translations.get(key, key)
    
    # Substitute variables if provided
    if kwargs:
        try:
            message = message.format(**kwargs)
        except KeyError:
            pass
    
    return message


def get_translator(request: Request):
    """
    Get a translator function for the request's language
    
    Usage:
        t = get_translator(request)
        error_message = t('auth.invalid_credentials')
    
    Args:
        request: FastAPI request object
    
    Returns:
        Translation function
    """
    language = get_language_from_request(request)
    
    def t(key: str, **kwargs) -> str:
        return translate(key, language, **kwargs)
    
    return t


def get_supported_languages() -> list:
    """
    Get list of supported language codes
    
    Returns:
        List of language codes
    """
    return list(TRANSLATIONS.keys())


def add_translation(language: str, key: str, value: str):
    """
    Add or update a translation
    
    Args:
        language: Language code
        key: Translation key
        value: Translated message
    """
    if language not in TRANSLATIONS:
        TRANSLATIONS[language] = {}
    TRANSLATIONS[language][key] = value
