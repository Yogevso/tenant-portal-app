#!/bin/sh
set -eu

escape_for_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

APP_NAME_ESCAPED="$(escape_for_js "${VITE_APP_NAME:-Tenant Portal}")"
API_BASE_URL_ESCAPED="$(escape_for_js "${VITE_API_BASE_URL:-same-origin}")"

cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__TENANT_PORTAL_CONFIG__ = {
  appName: "${APP_NAME_ESCAPED}",
  apiBaseUrl: "${API_BASE_URL_ESCAPED}"
};
EOF
