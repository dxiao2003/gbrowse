#!/usr/bin/env bash
# Run the gbrowse test suite. Headed/extension tests need an X display, so we
# run under xvfb-run when available (Linux). Falls back to a plain run otherwise
# (e.g. macOS, or when a real display is present).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

if [ -z "${DISPLAY:-}" ] && command -v xvfb-run >/dev/null 2>&1; then
  exec xvfb-run -a bun test browse/test/ "$@"
fi

if [ -z "${DISPLAY:-}" ]; then
  echo "[gbrowse] No DISPLAY and xvfb-run not found — headed/extension tests will fail." >&2
  echo "[gbrowse] On Linux: sudo apt-get install -y xvfb x11-utils" >&2
fi
exec bun test browse/test/ "$@"
