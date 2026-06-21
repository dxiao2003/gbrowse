---
name: setup-browser-cookies
description: Import Chrome, Firefox, or Safari cookies into the gbrowse Chromium profile for authenticated browsing.
---

# setup-browser-cookies

Import cookies from your real browser (Chrome, Firefox, Safari) into the gbrowse
Chromium profile so the headless browser can access sites you're already logged into.

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

## Import cookies from an installed browser

```bash
$B cookie-import-browser chrome
$B cookie-import-browser firefox
$B cookie-import-browser safari
```

This reads cookies directly from the browser's cookie store on disk.

### Filter by domain

```bash
$B cookie-import-browser chrome --domain github.com
$B cookie-import-browser chrome --domain .google.com
```

### Using the default browser

```bash
$B cookie-import-browser
```

Detects the system default browser automatically.

## Import from a JSON file

Export cookies from a browser extension (e.g. EditThisCookie, Cookie-Editor) as JSON,
then import:

```bash
$B cookie-import /path/to/cookies.json
```

The JSON format is an array of cookie objects with standard fields:
`name`, `value`, `domain`, `path`, `expires`, `httpOnly`, `secure`, `sameSite`.

## Verify imported cookies

```bash
$B goto https://github.com
$B cookies              # list all cookies for current domain
$B text                 # confirm you're logged in (check for username etc.)
```

## Scope and persistence

Imported cookies are added to the shared Chromium profile at `~/.gbrowse/chromium-profile/`.
They persist across browse sessions until they expire or are cleared.

To use a per-workspace profile (isolating cookies per project):
```bash
export CHROMIUM_PROFILE=/path/to/my-profile
$B cookie-import-browser chrome
```

## Troubleshooting

**Browser is running:** Close Chrome/Firefox before importing — the browser locks its
cookie database while open, preventing reads.

**macOS permissions:** On macOS, Chrome's cookie database is encrypted with the system
keychain. If import fails with a keychain error, try:
- Closing Chrome first
- Granting Terminal/your shell full disk access in System Preferences → Security & Privacy

**Cookie not working:** Some sites use `HttpOnly` cookies that aren't accessible to JS but
are sent by the browser automatically. `cookie-import-browser` copies these correctly.
Manually constructed JSON files may miss them if exported via JS-based extensions.
