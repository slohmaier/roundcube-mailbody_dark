#!/usr/bin/env bash
# All-in-one: bring up the stack -> set up (user + newsletter mail).
#   ./start.sh            (Docker directly)
#   DOCKER="sudo docker" ./start.sh
set -euo pipefail
cd "$(dirname "$0")"
DOCKER="${DOCKER:-docker}"

# The container reads the mounted plugin as www-data; a restrictive umask can
# leave files unreadable -> "Failed to load plugin file". a+rX fixes that.
chmod -R a+rX ..

$DOCKER compose up -d
./setup.sh
