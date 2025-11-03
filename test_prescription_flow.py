#!/usr/bin/env python3
"""
Script de test pour créer une prescription et vérifier qu'elle apparaît pour le patient
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    """Se connecter et obtenir un token"""
    response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Erreur de connexion: {response.status_code} - {response.text}")
        return None

def create_prescription(token, patient_id):
    """Créer une prescription en tant que docteur"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "patient_id": patient_id,
        "medication_name": "Paracétamol TEST",
        "dosage": "500mg",
        "frequency": "3 fois par jour",
        "duration_days": 7,
        "instructions": "Prendre après les repas",
        "refills_allowed": 2,
        "auto_renewal_enabled": False,
        "notes": "Prescription de test pour débogage"
    }
    
    print(f"\n📤 Envoi de la prescription:")
    print(json.dumps(payload, indent=2))
    
    response = requests.post(f"{BASE_URL}/prescriptions/", json=payload, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        print(f"\n✅ Prescription créée avec succès!")
        print(f"   ID: {data['id']}")
        print(f"   Patient ID: {data['patient_id']}")
        print(f"   Doctor ID: {data['doctor_id']}")
        print(f"   Status: {data['status']}")
        return data['id']
    else:
        print(f"\n❌ Erreur lors de la création: {response.status_code}")
        print(f"   Détails: {response.text}")
        return None

def list_prescriptions(token):
    """Lister les prescriptions pour l'utilisateur connecté"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/prescriptions/", headers=headers)
    
    if response.status_code == 200:
        prescriptions = response.json()
        print(f"\n📋 Prescriptions trouvées: {len(prescriptions)}")
        for p in prescriptions:
            print(f"   - ID: {p['id']}, Médicament: {p['medication_name']}, Patient: {p['patient_id']}, Docteur: {p['doctor_id']}, Status: {p['status']}")
        return prescriptions
    else:
        print(f"\n❌ Erreur lors de la récupération: {response.status_code}")
        print(f"   Détails: {response.text}")
        return []

def main():
    print("=" * 80)
    print("TEST DE CRÉATION ET RÉCUPÉRATION DE PRESCRIPTIONS")
    print("=" * 80)
    
    # Configuration
    DOCTOR_EMAIL = "mmm@example.com"
    DOCTOR_PASSWORD = "mmm"
    PATIENT_EMAIL = "mm@example.com"
    PATIENT_PASSWORD = "mm"
    PATIENT_ID = 1  # ID du patient mm@example.com
    
    # Étape 1: Connexion docteur
    print("\n" + "=" * 80)
    print("ÉTAPE 1: CONNEXION DOCTEUR")
    print("=" * 80)
    doctor_token = login(DOCTOR_EMAIL, DOCTOR_PASSWORD)
    if not doctor_token:
        print("❌ Impossible de se connecter en tant que docteur")
        return
    print(f"✅ Docteur connecté (token: {doctor_token[:20]}...)")
    
    # Étape 2: Voir les prescriptions existantes du docteur
    print("\n" + "=" * 80)
    print("ÉTAPE 2: PRESCRIPTIONS EXISTANTES DU DOCTEUR")
    print("=" * 80)
    doctor_prescriptions = list_prescriptions(doctor_token)
    
    # Étape 3: Créer une nouvelle prescription
    print("\n" + "=" * 80)
    print("ÉTAPE 3: CRÉATION D'UNE NOUVELLE PRESCRIPTION")
    print("=" * 80)
    prescription_id = create_prescription(doctor_token, PATIENT_ID)
    if not prescription_id:
        print("❌ Impossible de créer la prescription")
        return
    
    # Étape 4: Vérifier que le docteur voit la prescription
    print("\n" + "=" * 80)
    print("ÉTAPE 4: VÉRIFICATION CÔTÉ DOCTEUR")
    print("=" * 80)
    doctor_prescriptions_after = list_prescriptions(doctor_token)
    
    # Étape 5: Connexion patient
    print("\n" + "=" * 80)
    print("ÉTAPE 5: CONNEXION PATIENT")
    print("=" * 80)
    patient_token = login(PATIENT_EMAIL, PATIENT_PASSWORD)
    if not patient_token:
        print("❌ Impossible de se connecter en tant que patient")
        return
    print(f"✅ Patient connecté (token: {patient_token[:20]}...)")
    
    # Étape 6: Vérifier que le patient voit la prescription
    print("\n" + "=" * 80)
    print("ÉTAPE 6: VÉRIFICATION CÔTÉ PATIENT")
    print("=" * 80)
    patient_prescriptions = list_prescriptions(patient_token)
    
    # Résumé
    print("\n" + "=" * 80)
    print("RÉSUMÉ")
    print("=" * 80)
    print(f"Prescription créée: ID {prescription_id}")
    print(f"Visible par le docteur: {'✅ OUI' if any(p['id'] == prescription_id for p in doctor_prescriptions_after) else '❌ NON'}")
    print(f"Visible par le patient: {'✅ OUI' if any(p['id'] == prescription_id for p in patient_prescriptions) else '❌ NON'}")
    
    if not any(p['id'] == prescription_id for p in patient_prescriptions):
        print("\n⚠️  PROBLÈME: Le patient ne voit pas la prescription!")
        print(f"   Patient ID dans la prescription: {PATIENT_ID}")
        print(f"   Patient connecté: ID à vérifier")

if __name__ == "__main__":
    main()
