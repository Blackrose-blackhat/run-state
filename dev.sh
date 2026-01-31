#!/usr/bin/env bash
set -e

echo "▶ killing existing engine processes"
pkexec pkill -f portwatch-engine || true
sleep 1

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

# Create a wrapper script that runs the engine with sudo
WRAPPER="$TAURI_BIN_DIR/portwatch-engine-wrapper"
cat > "$WRAPPER" << 'EOF'
#!/usr/bin/env bash
# This wrapper runs the engine with elevated privileges for socket access
exec pkexec "$(dirname "$0")/portwatch-engine" "$@"
EOF
chmod +x "$WRAPPER"

cd ../app

echo "▶ starting tauri"
npm run tauri dev
