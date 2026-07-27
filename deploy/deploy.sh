#!/bin/sh
# Build the site and (re)deploy the viabaltica-app container.
set -e
cd "$(dirname "$0")/.."

PORT=5000 BASE_PATH=/ pnpm --filter @workspace/tallinn-shore-tours run build
docker compose up -d --build

echo "Deployed: https://privatetourstallinn.com"
