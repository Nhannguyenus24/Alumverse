#!/usr/bin/env bash
# Strict mode: exit on error (-e), exit on unset variables (-u), and catch errors in pipes (-o pipefail)
set -euo pipefail

# Check if the environment configuration file (.env) exists
if [ ! -f .env ]; then
  echo ".env not found"
  exit 1
fi

# Enable automatic exporting of variables to the environment
set -a
# Load the environment variables from the local file
source .env
# Disable automatic exporting after loading
set +a

# Display a status message including the port number defined in SERVER_PORT
echo "Starting main service on port $SERVER_PORT"

# Execute the Spring Boot application using the Maven Wrapper
./mvnw spring-boot:run