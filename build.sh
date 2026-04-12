#!/bin/bash
set -e

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Running API spec codegen..."
cd lib/api-spec && pnpm run codegen && cd ../..

echo "==> Building frontend..."
cd artifacts/hydroges-docs && pnpm run build && cd ../..

echo "==> Building API server..."
cd artifacts/api-server && pnpm run build && cd ../..

echo "==> Build complete."
