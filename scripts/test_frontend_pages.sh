#!/usr/bin/env bash

# Automated smoke-test for frontend pages (Next.js) used by the UI.
# Verifies key public and portal pages respond with 2xx and contain
# expected text markers where possible.

set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] Missing required command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command grep

BASE_URL_FRONT=${BASE_URL_FRONT:-"http://localhost:3000"}

log() {
  printf '\n[%s] %s\n' "$1" "$2"
}

RESULTS=()
add_result() {
  RESULTS+=("$1|$2|$3")
}

curl_page() {
  local name=$1
  local path=$2
  local expect_substring=${3:-}

  local url="${BASE_URL_FRONT}${path}"
  local tmp_body
  tmp_body=$(mktemp)
  local status

  status=$(curl -sS -H 'Accept: text/html' -o "$tmp_body" -w "%{http_code}" -X GET "$url" || true)

  local pass="FAIL"
  if [[ $status =~ ^2 ]]; then
    pass="PASS"
  fi

  local details="HTTP ${status} $(head -c 200 "$tmp_body" | tr '\n' ' ')"

  # If we have an expected substring, verify it exists in the response body
  if [[ $pass == "PASS" && -n $expect_substring ]]; then
    if ! grep -qi -- "$expect_substring" "$tmp_body"; then
      pass="FAIL"
      details="HTTP ${status} (missing text: ${expect_substring})"
    fi
  fi

  add_result "$name" "$pass" "$details"
  rm -f "$tmp_body"
}

log INFO "Running frontend (Next.js) page checks against ${BASE_URL_FRONT}"

# Public pages
curl_page "Home page" "/" "Santé"
curl_page "Login page" "/login" "Se connecter"
curl_page "Register page" "/register"
curl_page "Public doctor search" "/search-doctors" "Rechercher un médecin"

# Patient portal pages (client redirects may occur; we still expect 2xx + base markers)
curl_page "Patient - Dashboard" "/patient/dashboard"
curl_page "Patient - Book appointment" "/patient/book-appointment"
curl_page "Patient - Appointments" "/patient/appointments"
curl_page "Patient - Profile" "/patient/profile"
curl_page "Patient - Medical records" "/patient/medical-records"
curl_page "Patient - Prescriptions" "/patient/prescriptions"
curl_page "Patient - Search doctors" "/patient/search-doctors" "Rechercher un médecin"

# Doctor portal (smoke)
curl_page "Doctor - Dashboard" "/doctor/dashboard"

# Admin portal (smoke)
curl_page "Admin - Dashboard" "/admin/dashboard"

log INFO "\n==== Frontend Page Test Summary ===="
for entry in "${RESULTS[@]}"; do
  IFS='|' read -r label outcome details <<<"$entry"
  printf "%-55s %s\n" "$label" "$outcome"
  if [[ $outcome == "FAIL" ]]; then
    printf "    %s\n" "$details"
  fi
done

log INFO "Note: Protected pages may rely on client-side redirects; this script validates server responses and key text markers only."
