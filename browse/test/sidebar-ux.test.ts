/**
 * Tests for sidebar UX changes:
 * - System prompt does not bake in page URL (navigation fix)
 * - --resume is never used (stale context fix)
 * - /sidebar-chat response includes agentStatus
 * - Sidebar HTML has updated banner, placeholder, stop button
 * - Narration instructions present in system prompt
 */

import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ─── System prompt tests (server.ts spawnClaude) ─────────────────
// ─── /sidebar-chat response includes agentStatus ─────────────────

// ─── Sidebar HTML tests ──────────────────────────────────────────

// ─── Sidebar JS tests ───────────────────────────────────────────

// ─── Sidebar agent queue poll (sidebar-agent.ts) ─────────────────

// ─── System prompt size (TTFO optimization) ──────────────────────

// ─── TTFO latency chain invariants ──────────────────────────────

// ─── Browser tab bar ────────────────────────────────────────────

// ─── Bidirectional tab sync ──────────────────────────────────────

describe('sidebar→browser tab switch', () => {
  const bmSrc = fs.readFileSync(path.join(ROOT, 'src', 'browser-manager.ts'), 'utf-8');

  test('switchTab supports bringToFront option', () => {
    expect(bmSrc).toContain('switchTab(id: number, opts?');
    expect(bmSrc).toContain('bringToFront');
    // Default behavior still brings to front (opt-out, not opt-in)
    expect(bmSrc).toContain('bringToFront !== false');
  });
});

describe('browser→sidebar tab sync', () => {
  const bmSrc = fs.readFileSync(path.join(ROOT, 'src', 'browser-manager.ts'), 'utf-8');
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'server.ts'), 'utf-8');
  const js = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');

  test('syncActiveTabByUrl method exists on BrowserManager', () => {
    expect(bmSrc).toContain('syncActiveTabByUrl(activeUrl: string)');
  });

  test('syncActiveTabByUrl updates activeTabId when URL matches a different tab', () => {
    const fn = bmSrc.slice(
      bmSrc.indexOf('syncActiveTabByUrl('),
      bmSrc.indexOf('syncActiveTabByUrl(') + 1200,
    );
    expect(fn).toContain('this.activeTabId = id');
    // Exact match
    expect(fn).toContain('pageUrl === activeUrl');
    // Fuzzy match (origin+pathname)
    expect(fn).toContain('activeOriginPath');
    expect(fn).toContain('fuzzyId');
  });

  test('context.on("page") tracks user-created tabs', () => {
    expect(bmSrc).toContain("context.on('page'");
    expect(bmSrc).toContain('this.pages.set(id, page)');
    // Should log when new tab detected
    expect(bmSrc).toContain('New tab detected');
  });

  test('page close handler removes tab from pages map', () => {
    expect(bmSrc).toContain("page.on('close'");
    expect(bmSrc).toContain('this.pages.delete(id)');
    expect(bmSrc).toContain('Tab closed');
  });

  test('syncActiveTabByUrl skips when only 1 tab (no ambiguity)', () => {
    const fn = bmSrc.slice(
      bmSrc.indexOf('syncActiveTabByUrl('),
      bmSrc.indexOf('syncActiveTabByUrl(') + 600,
    );
    expect(fn).toContain('this.pages.size <= 1');
  });

  test('background.js listens for chrome.tabs.onActivated', () => {
    const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');
    expect(bgSrc).toContain('chrome.tabs.onActivated.addListener');
    expect(bgSrc).toContain('browserTabActivated');
  });
});

// ─── Event relay (processAgentEvent) ────────────────────────────

// ─── Per-tab chat context ────────────────────────────────────────

// ─── Sidebar CSS tests ──────────────────────────────────────────

describe('sidebar CSS (sidepanel.css)', () => {
  const css = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.css'), 'utf-8');

  test('stop button style exists', () => {
    expect(css).toContain('.stop-btn');
  });

  test('stop button uses error color', () => {
    const stopBtnSection = css.slice(
      css.indexOf('.stop-btn {'),
      css.indexOf('}', css.indexOf('.stop-btn {')) + 1,
    );
    expect(stopBtnSection).toContain('--error');
  });

  test('experimental-banner no longer uses amber warning colors', () => {
    const bannerSection = css.slice(
      css.indexOf('.experimental-banner {'),
      css.indexOf('}', css.indexOf('.experimental-banner {')) + 1,
    );
    // Should not be amber/warning anymore
    expect(bannerSection).not.toContain('245, 158, 11, 0.15');
    expect(bannerSection).not.toContain('#F59E0B');
  });

  test('tool description uses system font not mono', () => {
    const toolSection = css.slice(
      css.indexOf('.agent-tool {'),
      css.indexOf('}', css.indexOf('.agent-tool {')) + 1,
    );
    expect(toolSection).toContain('font-system');
    expect(toolSection).not.toContain('font-mono');
  });
});

// ─── Inspector message allowlist fix ────────────────────────────

describe('inspector message allowlist fix', () => {
  const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');

  test('ALLOWED_TYPES includes inspector message types', () => {
    const allowListSection = bgSrc.slice(
      bgSrc.indexOf('const ALLOWED_TYPES'),
      bgSrc.indexOf(']);', bgSrc.indexOf('const ALLOWED_TYPES')) + 3,
    );
    expect(allowListSection).toContain('startInspector');
    expect(allowListSection).toContain('stopInspector');
    expect(allowListSection).toContain('elementPicked');
    expect(allowListSection).toContain('pickerCancelled');
    expect(allowListSection).toContain('applyStyle');
    expect(allowListSection).toContain('inspectResult');
  });
});

// ─── CSP fallback basic picker ──────────────────────────────────

describe('CSP fallback basic picker', () => {
  const contentSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'content.js'), 'utf-8');
  const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');

  test('content.js contains startBasicPicker message handler', () => {
    expect(contentSrc).toContain("msg.type === 'startBasicPicker'");
    expect(contentSrc).toContain('startBasicPicker()');
  });

  test('content.js contains captureBasicData function with getComputedStyle', () => {
    expect(contentSrc).toContain('function captureBasicData(');
    expect(contentSrc).toContain('getComputedStyle(');
    expect(contentSrc).toContain('getBoundingClientRect()');
  });

  test('content.js contains CSSOM iteration with cross-origin try/catch', () => {
    expect(contentSrc).toContain('document.styleSheets');
    expect(contentSrc).toContain('cssRules');
  });

  test('content.js saves and restores outline on elements', () => {
    expect(contentSrc).toContain('basicPickerSavedOutline');
    // Outline is restored in cleanup and highlight functions
    expect(contentSrc).toContain('.style.outline = basicPickerSavedOutline');
  });

  test('content.js basic picker sends inspectResult with mode basic', () => {
    expect(contentSrc).toContain("mode: 'basic'");
    expect(contentSrc).toContain("type: 'inspectResult'");
  });

  test('content.js basic picker cleans up on Escape', () => {
    expect(contentSrc).toContain('onBasicKeydown');
    expect(contentSrc).toContain("e.key === 'Escape'");
    expect(contentSrc).toContain('basicPickerCleanup');
  });

  test('background.js injectInspector has separate try blocks for executeScript and insertCSS', () => {
    const injectFn = bgSrc.slice(
      bgSrc.indexOf('async function injectInspector('),
      bgSrc.indexOf('\n}', bgSrc.indexOf('async function injectInspector(') + 1) + 2,
    );
    // executeScript and insertCSS should be in separate try blocks
    expect(injectFn).toContain('executeScript');
    expect(injectFn).toContain('insertCSS');
    // Fallback sends startBasicPicker
    expect(injectFn).toContain("type: 'startBasicPicker'");
    expect(injectFn).toContain("mode: 'basic'");
  });

  test('background.js stores inspectorMode for routing', () => {
    expect(bgSrc).toContain('inspectorMode');
  });
});

// ─── Cleanup and screenshot buttons ─────────────────────────────

describe('cleanup and screenshot buttons', () => {
  const html = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.html'), 'utf-8');
  const js = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');
  const css = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.css'), 'utf-8');

  test('sidepanel.html contains cleanup and screenshot buttons in inspector', () => {
    expect(html).toContain('inspector-cleanup-btn');
    expect(html).toContain('inspector-screenshot-btn');
    expect(html).toContain('inspector-action-btn');
  });

  test('sidepanel.html contains cleanup and screenshot buttons in chat toolbar', () => {
    expect(html).toContain('chat-cleanup-btn');
    expect(html).toContain('chat-screenshot-btn');
    expect(html).toContain('quick-actions');
  });

  test('sidepanel.js screenshot handler POSTs to /command with screenshot', () => {
    expect(js).toContain("command: 'screenshot'");
  });

  test('sidepanel.css contains inspector-action-btn styles', () => {
    expect(css).toContain('.inspector-action-btn');
    expect(css).toContain('.inspector-action-btn.loading');
  });

  test('sidepanel.css contains quick-action-btn styles for chat toolbar', () => {
    expect(css).toContain('.quick-action-btn');
    expect(css).toContain('.quick-action-btn.loading');
    expect(css).toContain('.quick-actions');
  });

  test('cleanup and screenshot use shared helper functions', () => {
    expect(js).toContain('async function runCleanup(');
    expect(js).toContain('async function runScreenshot(');
    // Both inspector and chat buttons are wired
    expect(js).toContain('chatCleanupBtn');
    expect(js).toContain('chatScreenshotBtn');
  });

  test('sidepanel.css contains chat-notification styles', () => {
    expect(css).toContain('.chat-notification');
  });
});

describe('cleanup heuristics (write-commands.ts)', () => {
  const wcSrc = fs.readFileSync(path.join(ROOT, 'src', 'write-commands.ts'), 'utf-8');

  test('cleanup defaults to --all when no args provided', () => {
    // Should not throw on empty args, should default to doAll
    expect(wcSrc).toContain('if (args.length === 0)');
    expect(wcSrc).toContain('doAll = true');
  });

  test('CLEANUP_SELECTORS has overlays category', () => {
    expect(wcSrc).toContain('overlays: [');
    expect(wcSrc).toContain('paywall');
    expect(wcSrc).toContain('newsletter');
    expect(wcSrc).toContain('interstitial');
    expect(wcSrc).toContain('push-notification');
    expect(wcSrc).toContain('app-banner');
  });

  test('CLEANUP_SELECTORS ads has major ad networks', () => {
    expect(wcSrc).toContain('doubleclick');
    expect(wcSrc).toContain('googlesyndication');
    expect(wcSrc).toContain('amazon-adsystem');
    expect(wcSrc).toContain('outbrain');
    expect(wcSrc).toContain('taboola');
    expect(wcSrc).toContain('criteo');
  });

  test('CLEANUP_SELECTORS cookies has major consent frameworks', () => {
    expect(wcSrc).toContain('onetrust');
    expect(wcSrc).toContain('CybotCookiebot');
    expect(wcSrc).toContain('truste');
    expect(wcSrc).toContain('qc-cmp2');
    expect(wcSrc).toContain('Quantcast');
  });

  test('cleanup uses !important to override inline styles', () => {
    // Elements with inline style="display:block" need !important to hide
    expect(wcSrc).toContain("setProperty('display', 'none', 'important')");
  });

  test('cleanup unlocks scroll (body overflow:hidden)', () => {
    expect(wcSrc).toContain("overflow === 'hidden'");
    expect(wcSrc).toContain("setProperty('overflow', 'auto', 'important')");
  });

  test('cleanup removes blur effects (paywall blur)', () => {
    expect(wcSrc).toContain("filter?.includes('blur')");
    expect(wcSrc).toContain("setProperty('filter', 'none', 'important')");
  });

  test('cleanup removes article truncation (max-height)', () => {
    expect(wcSrc).toContain('truncat');
    expect(wcSrc).toContain("setProperty('max-height', 'none', 'important')");
  });

  test('cleanup collapses empty ad placeholder whitespace', () => {
    expect(wcSrc).toContain('empty placeholders');
    // Should check text content length before collapsing
    expect(wcSrc).toContain('text.length < 20');
  });

  test('sticky cleanup skips gbrowse control indicator', () => {
    expect(wcSrc).toContain("gbrowse-ctrl");
  });

  test('CLEANUP_SELECTORS has clutter category', () => {
    expect(wcSrc).toContain('clutter: [');
    expect(wcSrc).toContain('audio-player');
    expect(wcSrc).toContain('podcast-player');
    expect(wcSrc).toContain('puzzle');
    expect(wcSrc).toContain('recirculation');
    expect(wcSrc).toContain('everlit');
  });

  test('cleanup removes "ADVERTISEMENT" text labels', () => {
    expect(wcSrc).toContain('adTextPatterns');
    expect(wcSrc).toContain('/^advertisement$/i');
    expect(wcSrc).toContain('/article continues/i');
    expect(wcSrc).toContain('ad labels');
  });

  test('sticky cleanup preserves topmost full-width nav bar', () => {
    // Should preserve the first full-width element near the top
    expect(wcSrc).toContain('preservedTopNav');
    expect(wcSrc).toContain('viewportWidth * 0.8');
    // Should sort sticky elements by vertical position
    expect(wcSrc).toContain('sort((a, b) => a.top - b.top)');
  });
});

describe('chat toolbar buttons disabled state', () => {
  const js = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');
  const css = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.css'), 'utf-8');

  test('setActionButtonsEnabled function exists', () => {
    expect(js).toContain('function setActionButtonsEnabled(enabled)');
  });

  test('buttons are disabled when disconnected', () => {
    // updateConnection should call setActionButtonsEnabled(false) when no URL
    expect(js).toContain('setActionButtonsEnabled(false)');
    expect(js).toContain('setActionButtonsEnabled(true)');
  });

  test('runCleanup silently returns when disconnected (no error spam)', () => {
    // Should NOT show "Not connected" notification, just return silently
    const cleanupFn = js.slice(
      js.indexOf('async function runCleanup('),
      js.indexOf('\n}', js.indexOf('async function runCleanup(') + 1) + 2,
    );
    expect(cleanupFn).not.toContain('Not connected to browse server');
  });

  test('CSS has disabled style for action buttons', () => {
    expect(css).toContain('.quick-action-btn.disabled');
    expect(css).toContain('.inspector-action-btn.disabled');
    expect(css).toContain('pointer-events: none');
  });
});

// ─── Chat message dedup ─────────────────────────────────────────

// ─── Agent conciseness and focus stealing ───────────────────────

describe('sidebar agent conciseness + no focus stealing', () => {
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'server.ts'), 'utf-8');
  const bmSrc = fs.readFileSync(path.join(ROOT, 'src', 'browser-manager.ts'), 'utf-8');

  test('switchTab has bringToFront option', () => {
    expect(bmSrc).toContain('bringToFront?: boolean');
    expect(bmSrc).toContain('bringToFront !== false');
  });

  test('handleCommand tab pinning does NOT steal focus', () => {
    // All switchTab calls in handleCommand should use bringToFront: false
    const handleFn = serverSrc.slice(
      serverSrc.indexOf('async function handleCommand('),
      serverSrc.indexOf('\n// ', serverSrc.indexOf('async function handleCommand(') + 200),
    );
    const switchCalls = handleFn.match(/switchTab\([^)]+\)/g) || [];
    for (const call of switchCalls) {
      expect(call).toContain('bringToFront: false');
    }
  });
});

// ─── LLM-based cleanup architecture ─────────────────────────────

describe('LLM-based cleanup (smart agent cleanup)', () => {
  const js = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');
  const wcSrc = fs.readFileSync(path.join(ROOT, 'src', 'write-commands.ts'), 'utf-8');

  test('deterministic cleanup still has comprehensive selectors as first pass', () => {
    // The deterministic $B cleanup --all still needs good selectors for the quick pass
    expect(wcSrc).toContain('ads: [');
    expect(wcSrc).toContain('cookies: [');
    expect(wcSrc).toContain('social: [');
    expect(wcSrc).toContain('overlays: [');
    expect(wcSrc).toContain('clutter: [');
  });

  test('deterministic cleanup clutter covers audio/podcast widgets', () => {
    expect(wcSrc).toContain('audio-player');
    expect(wcSrc).toContain('podcast-player');
    expect(wcSrc).toContain('listen-widget');
    expect(wcSrc).toContain('everlit');
    expect(wcSrc).toContain("'audio'"); // bare audio elements
  });

  test('deterministic cleanup clutter covers sidebar recirculation', () => {
    expect(wcSrc).toContain('most-popular');
    expect(wcSrc).toContain('most-read');
    expect(wcSrc).toContain('recommended');
    expect(wcSrc).toContain('taboola');
    expect(wcSrc).toContain('outbrain');
    expect(wcSrc).toContain('nativo');
  });

  test('deterministic cleanup clutter covers games/puzzles', () => {
    expect(wcSrc).toContain('puzzle');
    expect(wcSrc).toContain('daily-game');
    expect(wcSrc).toContain('crossword-promo');
  });

  test('ad label text detection catches common patterns', () => {
    expect(wcSrc).toContain('/^advertisement$/i');
    expect(wcSrc).toContain('/^sponsored$/i');
    expect(wcSrc).toContain('/^promoted$/i');
    expect(wcSrc).toContain('/article continues/i');
    expect(wcSrc).toContain('/continues below/i');
    expect(wcSrc).toContain('/^paid content$/i');
    expect(wcSrc).toContain('/^partner content$/i');
  });

  test('ad label detection skips elements with too much text (not a label)', () => {
    // Should skip elements with >50 chars (probably real content)
    expect(wcSrc).toContain('text.length > 50');
  });

  test('ad label detection hides parent wrapper when small enough', () => {
    // If parent has little content, hide the whole wrapper
    expect(wcSrc).toContain('parent.textContent');
    expect(wcSrc).toContain('trim().length < 80');
  });

  test('sticky removal sorts by vertical position (topmost first)', () => {
    expect(wcSrc).toContain('sort((a, b) => a.top - b.top)');
  });

  test('sticky removal preserves first full-width element near top', () => {
    expect(wcSrc).toContain('preservedTopNav');
    // Should check element spans most of viewport
    expect(wcSrc).toContain('viewportWidth * 0.8');
    // Should only preserve the first one
    expect(wcSrc).toContain('!preservedTopNav');
    // Should check it's near the top
    expect(wcSrc).toContain('top <= 50');
    // Should check it's not too tall (it's a nav, not a hero)
    expect(wcSrc).toContain('height < 120');
  });

  test('sticky removal still skips semantic nav/header elements', () => {
    expect(wcSrc).toContain("tag === 'nav'");
    expect(wcSrc).toContain("tag === 'header'");
    expect(wcSrc).toContain("role') === 'navigation'");
  });
});

// ─── Welcome page + sidebar auto-open ────────────────────────────

describe('welcome page', () => {
  const welcomePath = path.join(ROOT, 'src', 'welcome.html');
  const welcomeExists = fs.existsSync(welcomePath);
  const welcomeSrc = welcomeExists ? fs.readFileSync(welcomePath, 'utf-8') : '';

  test('welcome.html exists in browse/src/', () => {
    expect(welcomeExists).toBe(true);
  });

  test('welcome page has GBrowse Browser branding', () => {
    expect(welcomeSrc).toContain('GBrowse Browser');
  });

  test('welcome page has extension-ready listener to hide prompt', () => {
    expect(welcomeSrc).toContain('gbrowse-extension-ready');
    expect(welcomeSrc).toContain('sidebar-prompt');
  });

  test('welcome page points RIGHT toward sidebar (not UP at toolbar)', () => {
    // Up arrow can never align with browser chrome. Right arrow always
    // points toward the sidebar area regardless of window size.
    expect(welcomeSrc).not.toContain('arrow-up');
    expect(welcomeSrc).toContain('arrow-right');
  });

  test('welcome page has left-aligned text (no center-align on headings)', () => {
    // User preference: always left-align, never center
    expect(welcomeSrc).not.toMatch(/text-align:\s*center/);
  });

  test('welcome page uses dark theme', () => {
    expect(welcomeSrc).toContain('#0C0C0C'); // --base (near-black)
    expect(welcomeSrc).toContain('#141414'); // --surface (card bg)
  });
});

describe('server /welcome endpoint', () => {
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'server.ts'), 'utf-8');

  test('/welcome endpoint exists in server.ts', () => {
    expect(serverSrc).toContain("url.pathname === '/welcome'");
  });

  test('/welcome serves HTML content type', () => {
    const welcomeSection = serverSrc.slice(
      serverSrc.indexOf("url.pathname === '/welcome'"),
      serverSrc.indexOf("url.pathname === '/health'"),
    );
    expect(welcomeSection).toContain("'Content-Type': 'text/html");
  });

  test('/welcome serves fallback HTML if no welcome file found', () => {
    const welcomeSection = serverSrc.slice(
      serverSrc.indexOf("url.pathname === '/welcome'"),
      serverSrc.indexOf("url.pathname === '/health'"),
    );
    // Changed from 302 redirect to about:blank (ERR_UNSAFE_REDIRECT on Windows)
    // to inline HTML fallback page (PR #822)
    expect(welcomeSection).toContain('GBrowse Browser ready');
    expect(welcomeSection).toContain('status: 200');
  });
});

describe('headed launch navigates to welcome page', () => {
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'server.ts'), 'utf-8');

  test('server navigates to /welcome after startup in headed mode', () => {
    // Navigation must happen AFTER Bun.serve() starts (not during launchHeaded)
    // because the HTTP server needs to be listening before the browser requests /welcome
    const afterServe = serverSrc.slice(serverSrc.indexOf('Bun.serve('));
    expect(afterServe).toContain('/welcome');
    expect(afterServe).toContain("getConnectionMode() === 'headed'");
  });

  test('welcome navigation does NOT happen in browser-manager (too early)', () => {
    const bmSrc = fs.readFileSync(path.join(ROOT, 'src', 'browser-manager.ts'), 'utf-8');
    // browser-manager.ts should NOT navigate to /welcome because the server
    // isn't listening yet when launchHeaded() runs
    const launchHeadedSection = bmSrc.slice(
      bmSrc.indexOf('async launchHeaded('),
      bmSrc.indexOf('// Browser disconnect handler'),
    );
    expect(launchHeadedSection).not.toContain('/welcome');
  });
});

describe('sidebar auto-open (background.js)', () => {
  const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');

  test('autoOpenSidePanel function exists with retry logic', () => {
    expect(bgSrc).toContain('async function autoOpenSidePanel');
    expect(bgSrc).toContain('attempt < 5');
  });

  test('auto-open fires on install AND on every service worker startup', () => {
    // onInstalled fires on first install / extension update
    expect(bgSrc).toContain('chrome.runtime.onInstalled.addListener');
    expect(bgSrc).toContain('autoOpenSidePanel()');
    // Top-level call fires on every service worker startup
    const topLevelCalls = bgSrc.match(/^autoOpenSidePanel\(\)/gm);
    expect(topLevelCalls).not.toBeNull();
    expect(topLevelCalls!.length).toBeGreaterThanOrEqual(1);
  });

  test('retry uses backoff delays (not fixed interval)', () => {
    expect(bgSrc).toContain('500');
    expect(bgSrc).toContain('1000');
    expect(bgSrc).toContain('2000');
    expect(bgSrc).toContain('3000');
    expect(bgSrc).toContain('5000');
  });

  test('auto-open uses chrome.sidePanel.open with windowId', () => {
    expect(bgSrc).toContain('chrome.sidePanel.open');
    expect(bgSrc).toContain('windowId');
  });

  test('auto-open logs success and failure for debugging', () => {
    expect(bgSrc).toContain('Side panel opened on attempt');
    expect(bgSrc).toContain('Side panel auto-open failed');
  });
});

describe('sidebar arrow hint hide flow (4-step signal chain)', () => {
  // The arrow hint on the welcome page should ONLY hide when the sidebar
  // is actually opened, not when the extension content script loads.
  //
  // Signal flow:
  //   1. sidepanel.js connects → sends { type: 'sidebarOpened' } to background
  //   2. background.js receives → relays to active tab's content script
  //   3. content.js receives 'sidebarOpened' → dispatches 'gbrowse-extension-ready'
  //   4. welcome.html listens for 'gbrowse-extension-ready' → hides arrow
  //
  const contentSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'content.js'), 'utf-8');
  const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');
  const spSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');
  const welcomeSrc = fs.readFileSync(path.join(ROOT, 'src', 'welcome.html'), 'utf-8');

  // Step 1: sidepanel sends sidebarOpened when connected
  test('step 1: sidepanel sends sidebarOpened message on connect', () => {
    expect(spSrc).toContain("{ type: 'sidebarOpened' }");
  });

  // Step 2: background.js accepts and relays sidebarOpened
  test('step 2: background.js allows sidebarOpened message type', () => {
    expect(bgSrc).toContain("'sidebarOpened'");
    // Must be in ALLOWED_TYPES
    const allowedBlock = bgSrc.slice(
      bgSrc.indexOf('ALLOWED_TYPES'),
      bgSrc.indexOf('ALLOWED_TYPES') + 300,
    );
    expect(allowedBlock).toContain('sidebarOpened');
  });

  test('step 2: background.js relays sidebarOpened to active tab content script', () => {
    expect(bgSrc).toContain("msg.type === 'sidebarOpened'");
    // Should send to active tab via chrome.tabs.sendMessage
    const handler = bgSrc.slice(
      bgSrc.indexOf("msg.type === 'sidebarOpened'"),
      bgSrc.indexOf("msg.type === 'sidebarOpened'") + 400,
    );
    expect(handler).toContain('chrome.tabs.sendMessage');
    expect(handler).toContain("{ type: 'sidebarOpened' }");
  });

  // Step 3: content.js fires gbrowse-extension-ready ONLY on sidebarOpened
  test('step 3: content.js dispatches extension-ready on sidebarOpened message', () => {
    expect(contentSrc).toContain("msg.type === 'sidebarOpened'");
    expect(contentSrc).toContain("new CustomEvent('gbrowse-extension-ready')");
  });

  test('step 3: content.js does NOT auto-fire extension-ready on load', () => {
    // The old pattern was: fire immediately when content script loads.
    // Now it should only fire when sidebarOpened message arrives.
    // Check there's no top-level dispatchEvent outside the message handler.
    const beforeListener = contentSrc.slice(0, contentSrc.indexOf('chrome.runtime.onMessage'));
    expect(beforeListener).not.toContain("dispatchEvent(new CustomEvent('gbrowse-extension-ready'))");
  });

  // Step 4: welcome page hides arrow on gbrowse-extension-ready
  test('step 4: welcome page hides arrow on gbrowse-extension-ready event', () => {
    expect(welcomeSrc).toContain("'gbrowse-extension-ready'");
    expect(welcomeSrc).toContain("classList.add('hidden')");
  });

  test('step 4: welcome page does NOT auto-hide via status pill polling', () => {
    // The old fallback (checkPill/gbrowse-status-pill) would hide the arrow
    // as soon as the content script injected the pill, even without sidebar open.
    expect(welcomeSrc).not.toContain('checkPill');
    expect(welcomeSrc).not.toContain('gbrowse-status-pill');
  });
});

describe('sidebar auth race prevention', () => {
  const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');
  const spSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');

  test('getPort response includes authToken (not just port + connected)', () => {
    // The auth race: sidepanel calls getPort, gets {port, connected} but no token.
    // All subsequent requests fail 401. Token must be in the getPort response.
    const getPortHandler = bgSrc.slice(
      bgSrc.indexOf("msg.type === 'getPort'"),
      bgSrc.indexOf("msg.type === 'setPort'"),
    );
    expect(getPortHandler).toContain('token: authToken');
  });

  test('tryConnect uses token from getPort response', () => {
    // Sidepanel must pass resp.token to updateConnection, not null
    const start = spSrc.indexOf('function tryConnect()');
    const end = spSrc.indexOf('\ntryConnect();', start); // top-level call after the function
    const tryConnectFn = spSrc.slice(start, end);
    expect(tryConnectFn).toContain('resp.token');
    expect(tryConnectFn).not.toContain('updateConnection(url, null)');
  });
});

describe('startup health check fast-retry', () => {
  const bgSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'background.js'), 'utf-8');

  test('initial health check retries every 1s (not 10s)', () => {
    // The server may not be listening when the extension starts because
    // Chromium launches before Bun.serve(). A 10s gap means the user
    // stares at "Connecting..." for 10 seconds. 1s retry fixes this.
    expect(bgSrc).toContain('startupAttempts');
    expect(bgSrc).toContain('setInterval(async ()');
    // Fast retry uses 1000ms, not the 10000ms slow poll
    expect(bgSrc).toContain('}, 1000);');
  });

  test('startup retry stops after connection or max attempts', () => {
    expect(bgSrc).toContain('isConnected || startupAttempts >= 15');
    expect(bgSrc).toContain('clearInterval(startupCheck)');
  });

  test('slow 10s polling only starts after startup phase completes', () => {
    expect(bgSrc).toContain('if (!healthInterval)');
    expect(bgSrc).toContain('setInterval(checkHealth, 10000)');
  });
});

describe('sidebar debug visibility when stuck', () => {
  const spSrc = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');

  test('connection state machine has a dead state with user-visible message', () => {
    expect(spSrc).toContain("'dead'");
    expect(spSrc).toContain('MAX_RECONNECT_ATTEMPTS');
  });

  test('reconnect attempt counter is visible in the UI', () => {
    // The banner should show attempt count so user knows something is happening
    expect(spSrc).toContain('reconnectAttempts');
  });
});

describe('BROWSE_NO_AUTOSTART (sidebar headless prevention)', () => {
  const cliSrc = fs.readFileSync(path.join(ROOT, 'src', 'cli.ts'), 'utf-8');

  test('cli.ts checks BROWSE_NO_AUTOSTART before starting a new server', () => {
    // ensureServer must check this env var BEFORE calling startServer()
    const start = cliSrc.indexOf('async function ensureServer(');
    const after = cliSrc.indexOf('\nasync function ', start + 1);
    const ensureServerFn = cliSrc.slice(start, after > start ? after : start + 4000);
    expect(ensureServerFn).toContain('BROWSE_NO_AUTOSTART');
    expect(ensureServerFn).toContain('process.exit(1)');
  });

  test('cli.ts shows actionable error message when BROWSE_NO_AUTOSTART blocks', () => {
    expect(cliSrc).toContain('/open-gbrowse-browser');
    expect(cliSrc).toContain('BROWSE_NO_AUTOSTART is set');
  });

  test('BROWSE_NO_AUTOSTART check happens before lock acquisition', () => {
    // The guard must be BEFORE the lock acquisition. If it's after,
    // we'd acquire a lock and then exit, leaving a stale lock file.
    const ensureServerStart = cliSrc.indexOf('async function ensureServer()');
    const noAutoStart = cliSrc.indexOf('BROWSE_NO_AUTOSTART', ensureServerStart);
    const lockAcquisition = cliSrc.indexOf('Acquire lock', ensureServerStart);
    expect(noAutoStart).toBeGreaterThan(0);
    expect(lockAcquisition).toBeGreaterThan(0);
    expect(noAutoStart).toBeLessThan(lockAcquisition);
  });
});

// ─── Tool-result file filtering (sidebar-agent.ts) ──────────────

// ─── Sidebar skips empty tool_use entries (sidepanel.js) ────────

// ─── Tool calls collapse into "See reasoning" on agent_done ─────

// ─── Idle timeout disabled in headed mode (server.ts) ───────────
//
// The original 'idle check skips in headed mode' string-grep test was deleted
// in v1.42.3.0 — it would have passed even with the dual-instance bug present
// because it only grepped for "=== 'headed'" + 'return' in the same window.
// Behavioral coverage lives in browse/test/server-factory.test.ts under the
// 'idle timer + onDisconnect dual-instance fix' describe block, which
// exercises the headed/headless/tunnel branches of idleCheckTick directly.

// ─── Shutdown kills sidebar-agent daemon (server.ts) ────────────

// ─── Cookie button in sidebar footer ────────────────────────────

describe('cookie import button (sidebar)', () => {
  const html = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.html'), 'utf-8');
  const js = fs.readFileSync(path.join(ROOT, '..', 'extension', 'sidepanel.js'), 'utf-8');

  test('quick actions toolbar has cookies button', () => {
    expect(html).toContain('id="chat-cookies-btn"');
    expect(html).toContain('Cookies');
  });

  test('cookies button navigates to cookie-picker', () => {
    expect(js).toContain("'chat-cookies-btn'");
    expect(js).toContain('cookie-picker');
  });
});

// ─── Model routing (server.ts) ──────────────────────────────────
