#!/usr/bin/env bash
set -e

echo "▶ killing existing engine processes"
pkill -f portwatch-engine || true

echo "▶ building go engine"

ENGINE_DIR="$(pwd)/engine"
TAURI_BIN_DIR="$(pwd)/app/src-tauri/bin"
ENGINE_OUT="$TAURI_BIN_DIR/portwatch-engine"

mkdir -p "$TAURI_BIN_DIR"

cd "$ENGINE_DIR"

GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
  go build -o "$ENGINE_OUT" ./cmd/engine

chmod +x "$ENGINE_OUT"

echo "✓ engine built at $ENGINE_OUT"

cd ../app

echo "▶ starting tauri"
npm run tauri dev
