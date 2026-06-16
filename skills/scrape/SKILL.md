# scrape

Read-only structured scraping: extract text, links, structured data, and screenshots
from web pages without user interaction.

## Setup

```bash
ROOT="${CLAUDE_PLUGIN_ROOT:?}"
if [ -x "$ROOT/browse/dist/browse" ]; then
  B="$ROOT/browse/dist/browse"
else
  B="bun run $ROOT/browse/src/cli.ts"
fi
```

## Basic scraping

```bash
$B goto https://example.com
$B text                          # all visible text
$B links                         # all links (text + href)
$B html                          # full page HTML
$B html "article.main-content"   # scoped to a CSS selector
```

## Structured snapshot

`snapshot` is the primary tool for understanding page structure:

```bash
$B goto https://news.ycombinator.com
$B snapshot                      # interactive element map with @refs
$B snapshot -s "table.itemlist"  # scope to a selector
$B snapshot -d 3                 # limit depth (default: unlimited)
$B snapshot -o hn.json           # save to JSON for processing
```

The snapshot output assigns `@e1`, `@e2`, ... refs to elements. Use them in follow-up
commands without re-running snapshot:
```bash
$B text @e5    # text of a specific element
$B html @e5    # HTML of a specific element
$B attrs @e5   # all attributes
```

## Forms and data tables

```bash
$B forms                         # all form fields and current values
$B accessibility                 # accessibility tree (structured, good for tables)
```

## Screenshots

```bash
$B screenshot                    # full page
$B screenshot --viewport         # visible area only
$B screenshot --clip 0,0,800,400 # clip to bounding box
$B screenshot @e3                # screenshot a specific element
$B screenshot output.png         # save to file
$B pdf output.pdf                # save as PDF
$B responsive screenshots/       # multiple viewport sizes
```

## JavaScript extraction

For data that's only in JS state or requires custom extraction:

```bash
$B js "document.title"
$B js "Array.from(document.querySelectorAll('h2')).map(h => h.textContent)"
$B eval extract.js               # run a JS file, print return value
```

## Multi-page scraping

Use `chain` to run a sequence of commands atomically:

```bash
cat <<'EOF' | $B chain
[
  {"cmd": "goto", "args": ["https://news.ycombinator.com"]},
  {"cmd": "links", "args": []},
  {"cmd": "screenshot", "args": ["hn.png"]}
]
EOF
```

Or drive a loop from shell:

```bash
for url in https://example.com/page/1 https://example.com/page/2; do
  $B goto "$url"
  $B text
done
```

## Comparing two pages

```bash
$B diff https://staging.example.com https://example.com
```

Produces a text + visual diff — useful for comparing staging vs. production.

## Authenticated scraping

If the site requires login, import cookies first (see `setup-browser-cookies` skill):

```bash
$B cookie-import-browser chrome --domain example.com
$B goto https://example.com/dashboard
$B text
```

## Output formats

| Command | Output |
|---------|--------|
| `text` | Plain text, newline-separated |
| `html` | Raw HTML |
| `links` | Tab-separated: `text\thref` per line |
| `snapshot -o file.json` | JSON: `{elements: [{id, text, role, selector, ...}]}` |
| `screenshot file.png` | PNG image |
| `pdf file.pdf` | PDF |
| `js <expr>` | JSON-serialized return value |

## Performance & rate limiting

The browser reuses a single Chromium instance across commands (daemon model), so
subsequent navigations are fast. For rate-limited sites, add waits:

```bash
$B goto https://example.com/page/1
$B wait --networkidle
$B text
```

## Read-only discipline

The `scrape` skill is intended for read-only extraction. Avoid `click`, `fill`, `type`,
and `press` unless strictly necessary for navigation (e.g., closing a cookie banner before
extracting content). For interactive automation, use the `browse` skill instead.
