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
files_total=0
files_passed=0
tests_pass=0
tests_fail=0
tests_skip=0
SECONDS=0
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

for f in browse/test/*.test.ts; do
  files_total=$((files_total + 1))
  # Stream output live (tee) while capturing it to tally per-file counts.
  bun test "$f" 2>&1 | tee "$tmp"
  rc=${PIPESTATUS[0]}

  # bun prints one summary block per file: " N pass" / " N fail" / " N skip".
  p=$(grep -oE '^ *[0-9]+ pass' "$tmp" | grep -oE '[0-9]+' | tail -1)
  x=$(grep -oE '^ *[0-9]+ fail' "$tmp" | grep -oE '[0-9]+' | tail -1)
  s=$(grep -oE '^ *[0-9]+ skip' "$tmp" | grep -oE '[0-9]+' | tail -1)
  tests_pass=$((tests_pass + ${p:-0}))
  tests_fail=$((tests_fail + ${x:-0}))
  tests_skip=$((tests_skip + ${s:-0}))

  if [ "$rc" -eq 0 ]; then
    files_passed=$((files_passed + 1))
  else
    fail=1
    failed_files+=("$f")
  fi
done

tests_total=$((tests_pass + tests_fail + tests_skip))
echo ""
echo "════════════════════════ gbrowse test summary ════════════════════════"
printf '  Files:  %d passed, %d failed  (%d total)\n' \
  "$files_passed" "$((files_total - files_passed))" "$files_total"
printf '  Tests:  %d passed, %d failed, %d skipped  (%d total)\n' \
  "$tests_pass" "$tests_fail" "$tests_skip" "$tests_total"
printf '  Time:   %dm%02ds\n' "$((SECONDS / 60))" "$((SECONDS % 60))"
if [ "$fail" -ne 0 ]; then
  echo "  ----------------------------------------------------------------"
  echo "  FAILED files (${#failed_files[@]}):"
  printf '    %s\n' "${failed_files[@]}"
fi
echo "═══════════════════════════════════════════════════════════════════════"
exit "$fail"
