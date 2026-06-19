#!/usr/bin/env bash
# Build browse into a self-contained binary at browse/dist/browse.
# Requires bun and node_modules (run install.sh first).
# The binary still requires node_modules/playwright + an installed Chromium at runtime.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

mkdir -p "$ROOT/browse/dist"

echo "gbrowse: building browse binary..."
cd "$ROOT"
bun build \
  --compile \
  --target bun \
  --outfile browse/dist/browse \
  browse/src/cli.ts

# bun build --compile writes the output as mode 0200 (write-only), so the exec
# bit must be set explicitly. On a normal filesystem this just works. Warn (don't
# fail) if it doesn't stick — e.g. on a virtiofs bind-mount that silently drops
# chmod — since the skills fall back to running from source, which is harmless.
echo "gbrowse: ensuring binary is executable..."
chmod +x "$ROOT/browse/dist/browse"
if [ ! -x "$ROOT/browse/dist/browse" ]; then
  echo "gbrowse: WARNING — could not set the executable bit on the binary;" >&2
  echo "  skills will fall back to running from source (this is harmless but slower)." >&2
fi

echo "gbrowse: writing version hash..."
git -C "$ROOT" rev-parse --short HEAD > "$ROOT/browse/dist/.version" 2>/dev/null || true

echo "gbrowse: built browse/dist/browse"
ls -lh "$ROOT/browse/dist/browse"
