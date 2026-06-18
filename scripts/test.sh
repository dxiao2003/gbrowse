#!/usr/bin/env bash
# Run the gbrowse test suite.
#
# Two reasons this is a script rather than a plain `bun test browse/test/`:
#
#  1. Headed/extension tests need an X display. On a headless Linux box we
#     re-exec the whole run under a single xvfb-run (install: apt-get install
#     -y xvfb x11-utils). With a real $DISPLAY (or on macOS) this is skipped.
#
#  2. The browser tests each launch a real Chromium. Run together in bun's
#     single shared process they starve each other (tabs time out) and a stray
#     teardown can take the whole runner down. So with no args we run each test
#     file in its own bun process — isolation keeps one file from killing or
#     slowing the rest — and aggregate the exit codes.
#
# Pass args (a file path, `-t <name>`, etc.) to run just those directly in one
# process, e.g. `bun run test browse/test/snapshot.test.ts`.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Re-exec once under xvfb-run so the whole loop shares one virtual display.
if [ -z "${DISPLAY:-}" ] && [ -z "${GBROWSE_XVFB:-}" ] && command -v xvfb-run >/dev/null 2>&1; then
  exec env GBROWSE_XVFB=1 xvfb-run -a bash "$0" "$@"
fi
if [ -z "${DISPLAY:-}" ]; then
  echo "[gbrowse] No DISPLAY and xvfb-run not found — headed/extension tests will fail." >&2
  echo "[gbrowse] On Linux: sudo apt-get install -y xvfb x11-utils" >&2
fi

# Explicit args → run directly in a single process.
if [ "$#" -gt 0 ]; then
  exec bun test "$@"
fi

# No args → one process per file for isolation.
fail=0
failed_files=()
for f in browse/test/*.test.ts; do
  if ! bun test "$f"; then
    fail=1
    failed_files+=("$f")
  fi
done

echo ""
if [ "$fail" -ne 0 ]; then
  echo "[gbrowse] FAILED files (${#failed_files[@]}):" >&2
  printf '  %s\n' "${failed_files[@]}" >&2
else
  echo "[gbrowse] All test files passed."
fi
exit "$fail"
