#!/bin/sh
set -eu

is_http_url() {
  case "$1" in
    http://*|https://*) return 0 ;;
    *) return 1 ;;
  esac
}

if [ -n "${VITE_API_URL:-}" ] && is_http_url "$VITE_API_URL"; then
  API_URL="$VITE_API_URL"
elif [ -n "${SERVICE_FQDN_SERVER_3001:-}" ]; then
  HOST="${SERVICE_FQDN_SERVER_3001%%:*}"
  API_URL="https://${HOST}"
elif [ -n "${SERVICE_FQDN_SERVER:-}" ]; then
  HOST="${SERVICE_FQDN_SERVER%%:*}"
  API_URL="https://${HOST}"
else
  API_URL="http://server:3001"
fi

echo "[web] Building with VITE_API_URL=${API_URL}"
export VITE_API_URL="$API_URL"
exec bun run build
