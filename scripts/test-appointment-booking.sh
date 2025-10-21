#!/bin/bash

# Script de test pour la création de rendez-vous
# Usage: ./test-appointment-booking.sh <access_token>

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <access_token>"
    echo "   Obtenez votre token en vous connectant sur http://127.0.0.1:3000"
    echo "   puis exécutez dans la console du navigateur: localStorage.getItem('access_token')"
    exit 1
fi

TOKEN="$1"
API_URL="http://127.0.0.1:8000/api/v1"

echo "🧪 Test de création de rendez-vous"
echo "================================="
echo ""

# Date de demain
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
APPOINTMENT_DATETIME="${TOMORROW}T10:00:00"

echo "📅 Date du rendez-vous : $TOMORROW"
echo "⏰ Heure : 10:00"
echo ""

# Créer le payload JSON
PAYLOAD=$(cat <<EOF
{
  "doctor_id": 7,
  "appointment_date": "$APPOINTMENT_DATETIME",
  "appointment_time": "10:00",
  "appointment_type": "IN_PERSON",
  "chief_complaint": "Consultation de contrôle",
  "reason": "Consultation de contrôle",
  "notes": "Test de réservation via script"
}
EOF
)

echo "📦 Payload :"
echo "$PAYLOAD" | jq .
echo ""

echo "🚀 Envoi de la requête POST à $API_URL/appointments/"
echo ""

# Envoyer la requête avec le slash final
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "$API_URL/appointments/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Extraire le code HTTP
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "📊 Code HTTP : $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ Succès ! Rendez-vous créé avec succès"
    echo ""
    echo "📋 Détails du rendez-vous :"
    echo "$BODY" | jq .
elif [ "$HTTP_STATUS" = "401" ]; then
    echo "❌ Erreur 401 : Non authentifié"
    echo "   Votre token a peut-être expiré. Reconnectez-vous."
    echo ""
    echo "📋 Détails :"
    echo "$BODY" | jq .
elif [ "$HTTP_STATUS" = "307" ]; then
    echo "❌ Erreur 307 : Redirection temporaire"
    echo "   Le backend tente de rediriger la requête."
    echo "   Cela ne devrait PAS arriver avec le slash final !"
    echo ""
    echo "🔍 Vérifiez que l'URL utilisée est bien : $API_URL/appointments/ (avec slash)"
elif [ "$HTTP_STATUS" = "422" ]; then
    echo "❌ Erreur 422 : Données invalides"
    echo ""
    echo "📋 Détails de l'erreur :"
    echo "$BODY" | jq .
else
    echo "❌ Erreur inattendue"
    echo ""
    echo "📋 Réponse :"
    echo "$BODY" | jq .
fi

echo ""
echo "================================="
echo "Test terminé"
