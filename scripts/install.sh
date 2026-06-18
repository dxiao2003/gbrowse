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

install_xvfb_with_apt() {
  "$@" apt-get update -qq &&
    "$@" env DEBIAN_FRONTEND=noninteractive apt-get install -y -q xvfb x11-utils
}

print_xvfb_manual_hint() {
  echo "gbrowse: NOTE - to enable headed mode/tests on Debian/Ubuntu, run:"
  echo "  sudo apt-get update && sudo apt-get install -y xvfb x11-utils"
}

# Headed mode (open-browser) and the test suite need an X display. On headless
# Linux that means Xvfb. Best-effort: skipped on macOS and when already present.
if [ "$(uname -s)" = "Linux" ] && ! command -v Xvfb >/dev/null 2>&1; then
  echo "gbrowse: Xvfb not found (only needed for headed mode + tests)."
  if command -v apt-get >/dev/null 2>&1; then
    if [ "$(id -u)" -eq 0 ]; then
      echo "gbrowse: installing Xvfb via apt-get..."
      install_xvfb_with_apt || {
        echo "gbrowse: WARNING - could not install xvfb/x11-utils automatically."
        print_xvfb_manual_hint
      }
    elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
      echo "gbrowse: installing Xvfb via passwordless sudo..."
      install_xvfb_with_apt sudo -n || {
        echo "gbrowse: WARNING - could not install xvfb/x11-utils automatically."
        print_xvfb_manual_hint
      }
    else
      echo "gbrowse: NOTE - skipping automatic Xvfb install because non-interactive sudo is unavailable."
      print_xvfb_manual_hint
    fi
  else
    echo "gbrowse: NOTE - install 'xvfb' and 'x11-utils' via your package manager for headed mode + tests."
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
