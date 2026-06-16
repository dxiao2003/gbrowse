# browse

Fast headless browser for QA, dogfooding, and web automation, driven by Claude.

## Setup

```bash
ROOT="${CLAUDE_PLUGIN_ROOT:?}"
if [ -x "$ROOT/browse/dist/browse" ]; then
  B="$ROOT/browse/dist/browse"
else
  B="bun run $ROOT/browse/src/cli.ts"
fi
```

If `$B goto https://example.com` fails with a Playwright/Chromium error, run:
```bash
"$ROOT/scripts/install.sh"
```

## Commands

### Navigation
```
$B goto <url>          # navigate to URL (starts daemon if not running)
$B back                # browser back
$B forward             # browser forward
$B reload              # reload current page
$B url                 # print current URL
```

### Reading content
```
$B text                # visible text of the page (no markup)
$B html [sel]          # full HTML, or just the element matching sel
$B links               # all links with text and href
$B forms               # form fields and their current values
$B accessibility       # accessibility tree
```

### Snapshots (primary QA tool)
```
$B snapshot            # interactive element map (IDs, text, role, selectors)
$B snapshot -d 2       # limit depth to 2
$B snapshot -s "main"  # scope to CSS selector
$B snapshot -a         # annotated screenshot with @ref labels
$B snapshot -D         # diff against previous snapshot
$B snapshot -C         # find non-ARIA clickable elements (@c refs)
$B snapshot -i         # inline screenshots of each element
$B snapshot -o out.json  # save to file
```

After `snapshot`, use `@e1`, `@e2`... as selectors in subsequent commands:
```
$B click @e3
$B fill @e4 "value"
$B hover @e1
```

### Interaction
```
$B click <sel>              # click element
$B fill <sel> <value>       # fill input
$B select <sel> <value>     # select dropdown option
$B hover <sel>              # hover element
$B type <text>              # type text (keyboard)
$B press <key>              # press key (e.g. Enter, Tab, ArrowDown)
$B scroll [sel]             # scroll element or page
$B wait <sel>               # wait for element to appear
$B wait --networkidle       # wait for network to go idle
$B wait --load              # wait for load event
$B upload <sel> <file...>   # file upload
$B viewport <WxH>           # set viewport size (e.g. 1280x800)
```

### JavaScript & inspection
```
$B js <expr>                # evaluate JS expression, print result
$B eval <file>              # evaluate a JS file
$B css <sel> <prop>         # get computed CSS property
$B attrs <sel>              # get all attributes of element
$B is visible <sel>         # check element state: visible|hidden|enabled|disabled|checked|editable|focused
$B console [--clear|--errors]  # captured console output
$B network [--clear]        # captured network requests
$B dialog [--clear]         # captured dialog events
$B cookies                  # all cookies
$B storage [set <k> <v>]    # local/session storage
$B perf                     # performance metrics
```

### Visual
```
$B screenshot               # full-page screenshot
$B screenshot --viewport    # viewport-only screenshot
$B screenshot --clip x,y,w,h  # clip region
$B screenshot @e2           # screenshot a specific element
$B screenshot path/out.png  # save to path
$B pdf [path]               # save as PDF
$B responsive [prefix]      # screenshot at multiple viewport sizes
```

### Comparison
```
$B diff <url1> <url2>       # visual + text diff between two URLs
```

### Multi-step chains (JSON from stdin)
```bash
echo '[{"cmd":"goto","args":["https://example.com"]},{"cmd":"text","args":[]}]' | $B chain
```

### Tabs
```
$B tabs                     # list open tabs
$B tab <id>                 # switch to tab
$B newtab [url]             # open new tab
$B closetab [id]            # close tab
```

### Server management
```
$B status                   # daemon status (port, pid, uptime)
$B stop                     # stop daemon gracefully
$B restart                  # restart daemon
$B cookie <name>=<value>    # set a cookie
$B header <name>:<value>    # set a request header
$B useragent <str>          # set User-Agent
```

### Dialogs
```
$B dialog-accept [text]     # accept a dialog (alert/confirm/prompt)
$B dialog-dismiss           # dismiss a dialog
```

## Global flags
```
$B --proxy socks5://...     # SOCKS5 proxy for all requests
$B --headed ...             # run in headed mode (shows browser window)
```

## QA patterns

### Basic page check
```bash
$B goto https://myapp.com/login
$B snapshot
$B fill @e2 "user@example.com"
$B fill @e3 "password"
$B click @e4
$B text
```

### Compare before/after a code change
```bash
$B goto https://myapp.com
$B snapshot -o before.json
# ... make changes ...
$B reload
$B snapshot -D   # diff against before
```

### Check responsive layout
```bash
$B goto https://myapp.com
$B responsive screenshots/
```

### Extract structured data
```bash
$B goto https://myapp.com/api-docs
$B text > docs.txt
```

## State & daemon

The daemon runs as a background process, persisting state in `.gbrowse/browse.json`
at the repo root. It auto-starts on first command and shuts down after idle timeout.

Per-session logs (console, network, dialog, audit) are in `.gbrowse/`.

Global state (Chromium profile, cookies/logins, ML models) is in `~/.gbrowse/`.

## Cookies & authentication

To carry your real browser's cookies (for sites that require login):

```bash
$B cookie-import-browser chrome
```

Or import from a JSON file:
```bash
$B cookie-import cookies.json
```

See the `setup-browser-cookies` skill for the full import workflow.
