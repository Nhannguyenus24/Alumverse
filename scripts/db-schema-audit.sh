#!/usr/bin/env bash
# Compare DB schema (event module) against docs/postgre.sql expectations.
#
# Usage:
#   ./scripts/db-schema-audit.sh local          # Docker container "db"
#   ./scripts/db-schema-audit.sh cloud          # Requires DATABASE_URL (read-only audit)
#   ./scripts/db-schema-audit.sh sync-local     # Apply migration then audit (LOCAL ONLY)
#
# Cloud example (read-only audit — do NOT use sync on production without review):
#   export DATABASE_URL='postgresql://user:pass@host:5432/postgres?sslmode=require'
#   ./scripts/db-schema-audit.sh cloud

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIT_SQL="$ROOT/docs/migrations/audit_event_schema.sql"
MIGRATION_SQL="$ROOT/docs/migrations/2026-06-17_event_flow.sql"

run_psql() {
  local label="$1"
  shift
  echo ""
  echo "========== $label =========="
  "$@" -f "$AUDIT_SQL" 2>&1 || true
}

run_psql_docker() {
  local container="${DB_CONTAINER:-db}"
  if ! docker ps --format '{{.Names}}' | grep -qx "$container"; then
    echo "ERROR: Docker container '$container' is not running."
    echo "Start it: docker compose up -d db"
    exit 1
  fi
  echo ""
  echo "========== LOCAL ($container) =========="
  docker exec -i "$container" psql -U user -d db -v ON_ERROR_STOP=1 < "$AUDIT_SQL"
}

run_psql_url() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: Set DATABASE_URL for cloud audit."
    echo "  export DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require'"
    exit 1
  fi
  if ! command -v psql >/dev/null 2>&1; then
    echo "ERROR: psql not in PATH. Install PostgreSQL client or use Docker:"
    echo "  docker run --rm -e DATABASE_URL postgres:15-alpine psql \"\$DATABASE_URL\" -f - < audit.sql"
    exit 1
  fi
  run_psql "CLOUD (DATABASE_URL)" psql "$DATABASE_URL" -v ON_ERROR_STOP=1
}

apply_migration_local() {
  local container="${DB_CONTAINER:-db}"
  echo "Applying migration to LOCAL ($container)..."
  docker exec -i "$container" psql -U user -d db -v ON_ERROR_STOP=1 < "$MIGRATION_SQL"
  echo "Migration applied."
}

case "${1:-local}" in
  local)
    run_psql_docker
    ;;
  cloud)
    run_psql_url
    ;;
  sync-local)
    apply_migration_local
    run_psql_docker
    ;;
  *)
    echo "Usage: $0 {local|cloud|sync-local}"
    exit 1
    ;;
esac
