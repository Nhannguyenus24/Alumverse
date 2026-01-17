#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo ".env not found"
  exit 1
fi

set -a

source .env

set +a

echo "Starting main service on port $SERVER_PORT"

./mvnw spring-boot:run
