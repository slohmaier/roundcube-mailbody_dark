#!/usr/bin/env bash
# Generates example screenshots of the plugin:
#   1. brings up the test stack
#   2. creates the user + delivers the synthetic newsletter (setup.sh)
#   3. installs Playwright + Chromium (if needed)
#   4. captures the mail body (Off/Dark/Light) + settings -> out/
#
# Usage:            ./generate.sh
# Docker via sudo:  DOCKER="sudo docker" ./generate.sh
set -euo pipefail
cd "$(dirname "$0")"

DOCKER="${DOCKER:-docker}"
BASE="http://127.0.0.1:8098"

echo ">> Make plugin files readable by the web server user ..."
# The container reads the mounted plugin as www-data; a restrictive umask can
# leave files unreadable -> "Failed to load plugin file". a+rX fixes that.
chmod -R a+rX ../..

echo ">> Bring up the stack ..."
( cd .. && $DOCKER compose up -d )

echo ">> Wait for Roundcube ..."
for i in $(seq 1 60); do curl -sf "$BASE/" -o /dev/null && break; sleep 2; done

echo ">> Create user + newsletter mail ..."
( cd .. && DOCKER="$DOCKER" ./setup.sh )

echo ">> Provide Playwright + Chromium ..."
[ -d node_modules/playwright ] || npm install --no-audit --no-fund
npx playwright install chromium

echo ">> Take screenshots ..."
node shoot.mjs

echo ""
echo "Done. Screenshots in: $(pwd)/out/"
