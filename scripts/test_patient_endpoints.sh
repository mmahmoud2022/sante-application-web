#!/usr/bin/env bash

# Automated smoke-test for patient-facing API flows used by the frontend.
# It provisions a temporary doctor & patient, wires up a schedule, then
# exercises the endpoints invoked by the patient UI. Any failing calls are
# reported in the final summary so gaps between frontend expectations and
# backend capabilities are easy to spot.

set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] Missing required command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command jq

BASE_URL=${BASE_URL:-"http://localhost:8000"}
DATE_CMD=${DATE_CMD:-"date"}

ensure_value() {
  local label=$1
  local value=$2
  if [[ -z $value || $value == "null" ]]; then
    echo "[ERROR] Missing expected value for ${label}." >&2
    exit 1
  fi
}

log() {
  printf '\n[%s] %s\n' "$1" "$2"
}

RESULTS=()
add_result() {
  RESULTS+=("$1|$2|$3")
}

TMP_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

json_escape() {
  printf '%s' "$1" | jq -R -r @json
}

curl_request() {
  local name=$1
  local method=$2
  local path=$3
  local token=${4:-""}
  local body=${5:-""}
  local expected=${6:-"2xx"}

  local url="${BASE_URL}${path}"
  local tmp_body
  tmp_body=$(mktemp "${TMP_DIR}/resp.XXXXXX")
  local status
  local accept_header="-H"
  local accept_value="Accept: application/json"
  local content_header=()
  local data_args=()
  local auth_header=()

  if [[ -n $token ]]; then
    auth_header=(-H "Authorization: Bearer ${token}")
  fi

  if [[ -n $body ]]; then
    content_header=(-H "Content-Type: application/json")
    data_args=(-d "$body")
  fi

  status=$(curl -sS "${auth_header[@]}" "$accept_header" "$accept_value" "${content_header[@]}" "${data_args[@]}" -o "$tmp_body" -w "%{http_code}" -X "$method" "$url" || true)

  local body_content
  body_content=$(cat "$tmp_body")

  local pass="FAIL"
  case "$expected" in
    2xx)
      [[ $status =~ ^2 ]] && pass="PASS"
      ;;
    20x)
      [[ $status == 200 || $status == 201 || $status == 204 ]] && pass="PASS"
      ;;
    201)
      [[ $status == 201 ]] && pass="PASS"
      ;;
    204)
      [[ $status == 204 ]] && pass="PASS"
      ;;
    4xx)
      [[ $status =~ ^4 ]] && pass="PASS"
      ;;
    *)
      [[ $status == "$expected" ]] && pass="PASS"
      ;;
  esac

  add_result "$name" "$pass" "HTTP ${status} ${body_content}"

  printf '%s' "$body_content"
}

# Helper to extract access token from login response
extract_token() {
  jq -r '.access_token' <<<"$1"
}

TS=$(date +%s)
DOCTOR_EMAIL="doctor.patient.${TS}@example.com"
PATIENT_EMAIL="patient.front.${TS}@example.com"
PASSWORD="StrongPassw0rd!"

NEXT_TUESDAY=$($DATE_CMD -d 'next tuesday' +%F)
APPOINTMENT_TIME="10:00"

log INFO "Registering temporary doctor (${DOCTOR_EMAIL})"
DOCTOR_REGISTER_RESPONSE=$(curl -sS -H 'Content-Type: application/json' -d "{\"email\":\"${DOCTOR_EMAIL}\",\"password\":\"${PASSWORD}\",\"first_name\":\"Front\",\"last_name\":\"Doctor\",\"role\":\"doctor\"}" "${BASE_URL}/api/v1/auth/register")
DOCTOR_ID=$(jq -r '.id' <<<"$DOCTOR_REGISTER_RESPONSE")
ensure_value "doctor id" "$DOCTOR_ID"

log INFO "Authenticating doctor"
DOCTOR_LOGIN_RESPONSE=$(curl -sS -H 'Content-Type: application/x-www-form-urlencoded' -d "username=${DOCTOR_EMAIL}&password=${PASSWORD}" "${BASE_URL}/api/v1/auth/login")
DOCTOR_TOKEN=$(extract_token "$DOCTOR_LOGIN_RESPONSE")
ensure_value "doctor access token" "$DOCTOR_TOKEN"

log INFO "Creating doctor schedule for Tuesday ${NEXT_TUESDAY}"
SCHEDULE_PAYLOAD=$(cat <<JSON
{
  "schedule_type": "regular",
  "day_of_week": "tuesday",
  "start_time": "10:00",
  "end_time": "13:00",
  "slot_duration_minutes": 30,
  "buffer_time_minutes": 0,
  "max_patients_per_slot": 1,
  "location": "Test Cabinet"
}
JSON
)
SCHEDULE_RESPONSE=$(curl -sS -H 'Content-Type: application/json' -H "Authorization: Bearer ${DOCTOR_TOKEN}" -d "$SCHEDULE_PAYLOAD" "${BASE_URL}/api/v1/schedules/")
SCHEDULE_ID=$(jq -r '.id' <<<"$SCHEDULE_RESPONSE")
ensure_value "schedule id" "$SCHEDULE_ID"

log INFO "Registering temporary patient (${PATIENT_EMAIL})"
PATIENT_REGISTER_RESPONSE=$(curl -sS -H 'Content-Type: application/json' -d "{\"email\":\"${PATIENT_EMAIL}\",\"password\":\"${PASSWORD}\",\"first_name\":\"Front\",\"last_name\":\"Patient\",\"role\":\"patient\"}" "${BASE_URL}/api/v1/auth/register")
PATIENT_ID=$(jq -r '.id' <<<"$PATIENT_REGISTER_RESPONSE")
ensure_value "patient id" "$PATIENT_ID"

log INFO "Authenticating patient"
PATIENT_LOGIN_RESPONSE=$(curl -sS -H 'Content-Type: application/x-www-form-urlencoded' -d "username=${PATIENT_EMAIL}&password=${PASSWORD}" "${BASE_URL}/api/v1/auth/login")
PATIENT_TOKEN=$(extract_token "$PATIENT_LOGIN_RESPONSE")
ensure_value "patient access token" "$PATIENT_TOKEN"

log INFO "Running patient endpoint checks"

curl_request "Patient - Get profile" GET "/api/v1/users/me" "$PATIENT_TOKEN" '' 2xx >/dev/null

UPDATE_BODY=$(printf '{"phone":"%s"}' "0000000000")
curl_request "Patient - Update profile" PUT "/api/v1/users/me" "$PATIENT_TOKEN" "$UPDATE_BODY" 2xx >/dev/null

curl_request "Patient - List doctors" GET "/api/v1/users/doctors" "$PATIENT_TOKEN" '' 2xx >/dev/null

BOOKING_PATH="/api/v1/patient/book-appointment?doctor=${DOCTOR_ID}&date=${NEXT_TUESDAY}"
curl_request "Patient - Booking context" GET "$BOOKING_PATH" "$PATIENT_TOKEN" '' 2xx >/dev/null

APPOINTMENT_BODY=$(cat <<JSON
{
  "doctor_id": ${DOCTOR_ID},
  "appointment_date": "${NEXT_TUESDAY}T${APPOINTMENT_TIME}",
  "appointment_time": "${APPOINTMENT_TIME}",
  "appointment_type": "in_person",
  "chief_complaint": "Automated test",
  "notes": "frontend test script"
}
JSON
)
APPOINTMENT_RESPONSE=$(curl_request "Patient - Create appointment" POST "/api/v1/appointments/" "$PATIENT_TOKEN" "$APPOINTMENT_BODY" 201)
APPOINTMENT_ID=$(jq -r '.id' <<<"$APPOINTMENT_RESPONSE")

curl_request "Patient - List appointments" GET "/api/v1/appointments/" "$PATIENT_TOKEN" '' 2xx >/dev/null

SLOTS_PATH="/api/v1/appointments/available-slots?doctor_id=${DOCTOR_ID}&date=${NEXT_TUESDAY}"
curl_request "Patient - Available slots" GET "$SLOTS_PATH" "$PATIENT_TOKEN" '' 2xx >/dev/null || true

CANCEL_PATH="/api/v1/appointments/${APPOINTMENT_ID}/cancel"
CANCEL_BODY='{ "reason": "Automated test" }'
curl_request "Patient - Cancel appointment" PATCH "$CANCEL_PATH" "$PATIENT_TOKEN" "$CANCEL_BODY" 2xx >/dev/null || true

curl_request "Patient - Appointment stats" GET "/api/v1/appointments/stats/overview" "$PATIENT_TOKEN" '' 2xx >/dev/null

curl_request "Patient - Prescriptions" GET "/api/v1/prescriptions/" "$PATIENT_TOKEN" '' 2xx >/dev/null

curl_request "Patient - Medical records" GET "/api/v1/medical-records/" "$PATIENT_TOKEN" '' 2xx >/dev/null

DOCUMENTS_PATH="/api/v1/documents/?patient_id=${PATIENT_ID}"
curl_request "Patient - Documents list" GET "$DOCUMENTS_PATH" "$PATIENT_TOKEN" '' 2xx >/dev/null

curl_request "Patient - Notifications" GET "/api/v1/notifications/" "$PATIENT_TOKEN" '' 2xx >/dev/null

log INFO "\n==== Patient Endpoint Test Summary ===="
for entry in "${RESULTS[@]}"; do
  IFS='|' read -r label outcome details <<<"$entry"
  printf "%-65s %s\n" "$label" "$outcome"
  if [[ $outcome == "FAIL" ]]; then
    printf "    %s\n" "$details"
  fi
done

log INFO "Doctor ID: ${DOCTOR_ID}, Patient ID: ${PATIENT_ID}, Appointment ID: ${APPOINTMENT_ID}"
log INFO "Reminder: If any item failed, check backend logs and the API contract for mismatches."
