# gbrowse

Fast headless + headed browser for QA, dogfooding, and scraping — driven by Claude.

`gbrowse` is a [Claude Code](https://claude.com/claude-code) plugin that gives Claude a
real browser it can drive: navigate pages, read and diff snapshots, click and type,
manage tabs and cookies, take screenshots, scrape structured data, and run an
interactive agent session inside a headed Chromium sidebar.

## Origin & attribution

`gbrowse` is extracted from **[gstack](https://github.com/garrytan/gstack)**, a larger agentic
engineering toolkit. gstack's browser-automation capability was already cleanly
separated from the rest of the system, so it was lifted into this standalone repo and
repackaged as a self-contained Claude Code plugin.

Everything browser-related — the Playwright/CDP daemon, the snapshot/diff engine, the
Chrome MV3 extension with its xterm terminal sidebar, the multi-layer prompt-injection
security model, and the cookie-import tooling — comes from gstack. Everything else
(the review/QA/ship skills, gbrain, telemetry, checkpoint/plan-mode machinery, iOS
tooling, etc.) was deliberately left behind.

## What you get

The plugin ships four skills:

| Skill | What it does |
|-------|--------------|
| `browse` | Fast headless browser for QA, dogfooding, and web automation (~80 commands). |
| `open-browser` | Launch a headed (visible) Chromium with the gbrowse sidebar extension and an interactive Claude terminal pane. |
| `scrape` | Read-only structured scraping: text, links, structured data, and screenshots — no interaction. |
| `setup-browser-cookies` | Import cookies from your real browser (Chrome/Firefox/Safari) so the headless browser can reach sites you're logged into. |

## Requirements

- **[Bun](https://bun.sh) ≥ 1.0** — the daemon is Bun-native (`Bun.serve`, `Bun.spawn`,
  `bun:sqlite`, Bun PTY). This is the one hard requirement.
- **Chromium** — installed once via Playwright (a few hundred MB; see Setup).
- A display (or Xvfb) is only needed for the headed `open-browser` flow. Headless
  `browse`/`scrape` run anywhere.

> **Windows:** Bun can't drive Playwright Chromium directly on Windows; a Node server
> bundle (`server-node.mjs`) is the workaround. Windows support is experimental.

## Install

### As a Claude Code plugin (recommended)

From within Claude Code, add this repo as a plugin marketplace and install it:

```
/plugin marketplace add /path/to/gbrowse      # or a git URL once published
/plugin install gbrowse
```

The **first `browse` invocation** detects missing Playwright/Chromium and runs setup
then ("first-time setup, downloading Chromium…"). A **SessionStart** hook prints a 
one-line nudge if dependencies are missing. Just start using the `browse`
skill and let it self-heal on first use. Alternatively you can manually install
Playwright/Chromium by invoking
```
/path/to/gbrowse/install.sh
```

### Standalone (without the plugin system)

```bash
git clone <this-repo> gbrowse
cd gbrowse
./scripts/install.sh
```

`install.sh` runs `bun install`, `bunx playwright install chromium`, and
`bun run vendor:xterm` (copies xterm into the extension).

## Usage

Within Claude Code, just invoke the skills (e.g. ask Claude to browse, scrape, or open
a visible browser). Under the hood each skill drives the same CLI/daemon.

Quick smoke test from the shell:

```bash
bun run browse/src/cli.ts goto https://example.com
bun run browse/src/cli.ts text
bun run browse/src/cli.ts screenshot
```

## Development

The browser daemon and CLI live in `browse/src/` (TypeScript, Bun). Key paths:

```
browse/src/      daemon + CLI: Playwright/CDP control, snapshot/diff, tabs, cookies, security
browse/test/     test suite (~100 tests) — the repo's CI
extension/       Chrome MV3 extension: sidebar, xterm terminal, CSS inspector, @ref overlays
browser-skills/  example deterministic Playwright "browser skill" (hackernews-frontpage)
skills/          the four Claude Code SKILL.md docs
scripts/         install.sh (setup) and build.sh (compile binary)
hooks/           SessionStart dependency-check hook
```

Common commands (see `package.json`):

```bash
bun run dev        # run the CLI:    bun run browse/src/cli.ts
bun run server     # run the daemon: bun run browse/src/server.ts
bun test           # run the test suite (bun test browse/test/)
bun run build      # compile a self-contained binary to browse/dist/browse
bun run vendor:xterm   # re-vendor xterm assets into extension/lib/
```

On-disk state (Chromium profile with cookies/logins, downloaded ML models, security
learnings) lives in `~/.gbrowse/`, kept out of any working tree. Set `CHROMIUM_PROFILE`
to isolate the profile per workspace.

### Testing

```bash
bun test browse/test/
```

Run `scripts/install.sh` first — some tests require Playwright/Chromium. A subset of
tests touch live network or the ML model and may be gated or skipped accordingly.

## License

MIT — see [LICENSE](LICENSE).
