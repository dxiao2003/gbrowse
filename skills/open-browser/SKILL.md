---
name: open-browser
description: Launch headed Chromium with the gbrowse sidebar extension and connect browser automation commands to it.
---

# open-browser

Launch a headed (visible) Chromium browser with the gbrowse sidebar extension pre-loaded.
The sidebar provides a terminal pane running an interactive agent session.

## Setup

For Codex, set `GBROWSE_PLUGIN_ROOT` to the installed gbrowse plugin directory.
Claude Code sets `CLAUDE_PLUGIN_ROOT` automatically.

```bash
ROOT="${CLAUDE_PLUGIN_ROOT:-${GBROWSE_PLUGIN_ROOT:?set GBROWSE_PLUGIN_ROOT to the gbrowse plugin root}}"
if [ -x "$ROOT/browse/dist/browse" ]; then
  B="$ROOT/browse/dist/browse"
else
  B="bun run $ROOT/browse/src/cli.ts"
fi
```

If dependencies aren't installed yet, install them (idempotent — safe to re-run):
```bash
if [ ! -d "$ROOT/node_modules" ]; then
  "$ROOT/scripts/install.sh"
fi
```

## Launching headed Chromium

```bash
$B connect
```

This:
1. Starts the browse daemon in headed mode on port 34567
2. Opens a real Chromium window with the gbrowse sidebar extension auto-loaded
3. The sidebar connects to the daemon automatically

Once connected, all `browse` skill commands work against the live headed browser.

## Navigation in headed mode

```bash
$B goto https://example.com
$B snapshot
$B click @e5
$B fill @e3 "search query"
$B press Enter
$B screenshot
```

## Switching between headless and headed

```bash
$B connect     # switch to headed (restarts daemon if needed)
$B disconnect  # switch back to headless (extension detaches)
```

## Aliases

`connect-chrome` is an alias for `connect`.

## The sidebar extension

The Chrome extension (MV3) provides:
- **Terminal pane**: interactive PTY for the terminal agent
- **Inspector**: CSS element inspector with @ref overlay support
- **Sidebar chat**: real-time agent interaction alongside the page

The extension auto-connects to the daemon on port 34567. No manual setup needed.

## Linux / headless servers

On a headless Linux server, use Xvfb:
```bash
Xvfb :99 -screen 0 1280x800x24 &
export DISPLAY=:99
$B connect
```

Or use the headless (`browse`) skill instead and export screenshots/PDFs.

## Profiles and cookies

The Chromium profile is shared across sessions and stored at `~/.gbrowse/chromium-profile/`.
Cookies and logins persist across `connect`/`disconnect` cycles.

To use a per-workspace profile:
```bash
export CHROMIUM_PROFILE=/path/to/my-profile
$B connect
```

## Troubleshooting

If the browser window doesn't appear:
- macOS: it may have opened behind other windows or in a different Space
- Linux: ensure a display is available (DISPLAY env var or Xvfb)
- Check `$B status` to confirm the daemon is running in headed mode
