#!/bin/bash
set -e

echo "=== Building platform ==="
npx nx build platform --configuration=production

echo "=== Building inventory ==="
npx nx build inventory --configuration=production
cp -r dist/apps/inventory dist/apps/platform/inventory

echo "=== Building admin ==="
npx nx build admin --configuration=production
cp -r dist/apps/admin dist/apps/platform/admin

echo "=== Build complete ==="
