#!/usr/bin/env bash
set -euo pipefail

# Copies the built client scripts from the sibling repos into overlay/assets.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SDK="$ROOT/gvm-sdk"
ADMIN="$ROOT/gvm-sdk-admin"
OUT="$(dirname "$0")/assets"

mkdir -p "$OUT"

cp "$SDK/dist/gvm.js" "$SDK/dist/gvm-overlay.js" "$OUT/"
cp "$ADMIN/dist/gvm-admin.js" "$OUT/"

echo "Copied gvm.js, gvm-overlay.js, gvm-admin.js -> $OUT"
