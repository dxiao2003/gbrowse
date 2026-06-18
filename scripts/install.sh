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

# Headed mode (open-browser) and the test suite need an X display. On headless
# Linux that means Xvfb. Best-effort: skipped on macOS and when already present.
if [ "$(uname -s)" = "Linux" ] && ! command -v Xvfb >/dev/null 2>&1; then
  echo "gbrowse: installing Xvfb (virtual display for headed mode + tests)..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq && sudo apt-get install -y -q xvfb x11-utils || \
      echo "gbrowse: WARNING — could not install xvfb/x11-utils automatically; install them manually for headed mode + tests."
  else
    echo "gbrowse: NOTE — install 'xvfb' and 'x11-utils' via your package manager for headed mode + tests."
  fi
fi

echo "gbrowse: vendoring xterm for the browser extension..."
if [ -f "$ROOT/package.json" ] && grep -q '"vendor:xterm"' "$ROOT/package.json"; then
  bun run vendor:xterm
fi

echo "gbrowse: setup complete."
echo ""
echo "Run a quick smoke test:"
echo "  bun run $ROOT/browse/src/cli.ts goto https://example.com && bun run $ROOT/browse/src/cli.ts text"
