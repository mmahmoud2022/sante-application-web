"""
Email templates for various notifications
"""


class EmailTemplates:
    """Email template collection"""
    
    # Base template for all emails
    BASE_TEMPLATE = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #4F46E5;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }}
            .footer {{
                background-color: #f5f5f5;
                padding: 15px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
            }}
            .info-box {{
                background-color: #e0e7ff;
                border-left: 4px solid #4F46E5;
                padding: 15px;
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Santé</h1>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2025 Santé. Tous droits réservés.</p>
        </div>
    </body>
    </html>
    """
    
    APPOINTMENT_CONFIRMATION = BASE_TEMPLATE.format(
        content="""
        <h2>Confirmation de rendez-vous</h2>
        <p>Bonjour {patient_name},</p>
        <p>Votre rendez-vous avec <strong>Dr. {doctor_name}</strong> a été confirmé avec succès.</p>
        
        <div class="info-box">
            <p><strong>Date :</strong> {appointment_date}</p>
            <p><strong>Heure :</strong> {appointment_time}</p>
            <p><strong>Type :</strong> {appointment_type}</p>
        </div>
        
        <p>Veuillez arriver 10 minutes avant l'heure de votre rendez-vous.</p>
        
        <p>Si vous devez annuler, merci de le faire au moins 24 heures à l'avance.</p>
        <p style="text-align: center;">
            <a href="{cancellation_url}" class="button">Annuler le rendez-vous</a>
        </p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    APPOINTMENT_REMINDER = BASE_TEMPLATE.format(
        content="""
        <h2>Rappel de rendez-vous</h2>
        <p>Bonjour {patient_name},</p>
        <p>Ceci est un rappel pour votre rendez-vous à venir.</p>
        
        <div class="info-box">
            <p><strong>Médecin :</strong> Dr. {doctor_name}</p>
            <p><strong>Date :</strong> {appointment_date}</p>
            <p><strong>Heure :</strong> {appointment_time}</p>
        </div>
        
        <p>N'oubliez pas d'apporter vos documents médicaux et votre carte d'assurance.</p>
        
        <p>À bientôt,<br>L'équipe Santé</p>
        """
    )
    
    APPOINTMENT_CANCELLATION = BASE_TEMPLATE.format(
        content="""
        <h2>Annulation de rendez-vous</h2>
        <p>Bonjour {patient_name},</p>
        <p>Votre rendez-vous du <strong>{appointment_date}</strong> à <strong>{appointment_time}</strong> avec Dr. {doctor_name} a été annulé.</p>
        
        <p>Si vous n'avez pas effectué cette annulation, veuillez nous contacter immédiatement.</p>
        
        <p>Pour prendre un nouveau rendez-vous, connectez-vous à votre espace patient.</p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    PASSWORD_RESET = BASE_TEMPLATE.format(
        content="""
        <h2>Réinitialisation de votre mot de passe</h2>
        <p>Bonjour {first_name},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        
        <p style="text-align: center;">
            <a href="{reset_url}" class="button">Réinitialiser le mot de passe</a>
        </p>
        
        <p>Ce lien est valable pendant <strong>{expiry_minutes} minutes</strong>.</p>
        
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.</p>
        
        <p>Pour votre sécurité, ne partagez jamais ce lien.</p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    EMAIL_VERIFICATION = BASE_TEMPLATE.format(
        content="""
        <h2>Vérification de votre adresse email</h2>
        <p>Bonjour {first_name},</p>
        <p>Merci de vous être inscrit sur Santé !</p>
        
        <p>Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
        
        <p style="text-align: center;">
            <a href="{verification_url}" class="button">Vérifier mon email</a>
        </p>
        
        <p>Ce lien est valable pendant 24 heures.</p>
        
        <p>Si vous n'avez pas créé de compte sur Santé, ignorez cet email.</p>
        
        <p>Bienvenue,<br>L'équipe Santé</p>
        """
    )
    
    PRESCRIPTION_READY = BASE_TEMPLATE.format(
        content="""
        <h2>Votre ordonnance est prête</h2>
        <p>Bonjour {patient_name},</p>
        <p>Votre ordonnance pour <strong>{medication_name}</strong> est maintenant disponible.</p>
        
        <div class="info-box">
            <p><strong>Instructions de retrait :</strong></p>
            <p>{pickup_instructions}</p>
        </div>
        
        <p>N'oubliez pas d'apporter votre carte d'identité et votre carte Vitale.</p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    PRESCRIPTION_EXPIRING = BASE_TEMPLATE.format(
        content="""
        <h2>Votre ordonnance arrive à expiration</h2>
        <p>Bonjour {patient_name},</p>
        <p>Votre ordonnance pour <strong>{medication_name}</strong> expire le <strong>{expiry_date}</strong>.</p>
        
        <p>Si vous avez besoin de renouveler cette ordonnance, veuillez prendre rendez-vous avec votre médecin.</p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    NEW_MESSAGE = BASE_TEMPLATE.format(
        content="""
        <h2>Nouveau message</h2>
        <p>Bonjour {recipient_name},</p>
        <p>Vous avez reçu un nouveau message de <strong>{sender_name}</strong>.</p>
        
        <div class="info-box">
            <p>{message_preview}</p>
        </div>
        
        <p style="text-align: center;">
            <a href="{message_url}" class="button">Lire le message</a>
        </p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    ACCOUNT_LOCKOUT = BASE_TEMPLATE.format(
        content="""
        <h2>Compte temporairement verrouillé</h2>
        <p>Bonjour {first_name},</p>
        <p>Votre compte a été temporairement verrouillé en raison de multiples tentatives de connexion infructueuses.</p>
        
        <p>Pour des raisons de sécurité, vous ne pourrez pas vous connecter pendant <strong>{lockout_duration} minutes</strong>.</p>
        
        <p>Si vous n'êtes pas à l'origine de ces tentatives, nous vous recommandons de réinitialiser votre mot de passe.</p>
        
        <p style="text-align: center;">
            <a href="{reset_password_url}" class="button">Réinitialiser le mot de passe</a>
        </p>
        
        <p>Cordialement,<br>L'équipe Santé</p>
        """
    )
    
    @staticmethod
    def get_template(template_name: str) -> str:
        """
        Get email template by name
        
        Args:
            template_name: Name of the template
            
        Returns:
            Template string
        """
        templates = {
            "appointment_confirmation": EmailTemplates.APPOINTMENT_CONFIRMATION,
            "appointment_reminder": EmailTemplates.APPOINTMENT_REMINDER,
            "appointment_cancellation": EmailTemplates.APPOINTMENT_CANCELLATION,
            "password_reset": EmailTemplates.PASSWORD_RESET,
            "email_verification": EmailTemplates.EMAIL_VERIFICATION,
            "prescription_ready": EmailTemplates.PRESCRIPTION_READY,
            "prescription_expiring": EmailTemplates.PRESCRIPTION_EXPIRING,
            "new_message": EmailTemplates.NEW_MESSAGE,
            "account_lockout": EmailTemplates.ACCOUNT_LOCKOUT,
        }
        
        return templates.get(template_name, EmailTemplates.BASE_TEMPLATE)
