#!/usr/bin/env bash
# Install gbrowse dependencies and Chromium.
# Run once after cloning, or after updating the plugin.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "gbrowse: installing dependencies..."
cd "$ROOT"
bun install

echo "gbrowse: installing Chromium (this may take a few minutes)..."
bunx playwright install chromium

echo "gbrowse: vendoring xterm for the browser extension..."
if [ -f "$ROOT/package.json" ] && grep -q '"vendor:xterm"' "$ROOT/package.json"; then
  bun run vendor:xterm
fi

echo "gbrowse: building the browse binary..."
"$SCRIPT_DIR/build.sh"

echo "gbrowse: setup complete."
echo ""
echo "Run a quick smoke test:"
echo "  $ROOT/browse/dist/browse goto https://example.com && $ROOT/browse/dist/browse text"
