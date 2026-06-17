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
bun x playwright install chromium

echo "gbrowse: vendoring xterm for the browser extension..."
if [ -f "$ROOT/package.json" ] && grep -q '"vendor:xterm"' "$ROOT/package.json"; then
  bun run vendor:xterm
fi

echo "gbrowse: setup complete."
echo ""
echo "Run a quick smoke test:"
echo "  bun run $ROOT/browse/src/cli.ts goto https://example.com && bun run $ROOT/browse/src/cli.ts text"
