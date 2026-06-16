/**
 * Lightweight telemetry — local-only analytics log.
 *
 * Writes to ~/.gbrowse/analytics/browse-telemetry.jsonl.
 * Hostname + aggregate counters only; no body content, no agent text, no command args.
 * Off by default; opt in via GBROWSE_TELEMETRY_OFF=0.
 *
 * Fire-and-forget: never blocks the calling path. Errors swallowed.
 *
 * Events:
 *   domain_skill_saved          {host, scope, state, bytes}
 *   domain_skill_state_changed  {host, from_state, to_state}
 *   domain_skill_save_blocked   {host, reason}
 *   domain_skill_fired          {host, source, version}
 *   cdp_method_called           {domain, method, allowed, scope}
 *   cdp_method_denied           {domain, method}
 *   cdp_method_lock_acquire_ms  {domain, method, ms}
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

function gbrowseHome(): string {
  return (
    process.env.GBROWSE_HOME ??
    process.env.GSTACK_HOME ??
    path.join(os.homedir(), '.gbrowse')
  );
}

function analyticsDir(): string {
  return path.join(gbrowseHome(), 'analytics');
}

function telemetryFile(): string {
  return path.join(analyticsDir(), 'browse-telemetry.jsonl');
}

let lastEnsuredDir: string | null = null;
async function ensureDir(): Promise<void> {
  const dir = analyticsDir();
  if (lastEnsuredDir === dir) return;
  await fs.mkdir(dir, { recursive: true });
  lastEnsuredDir = dir;
}

let telemetryDisabled: boolean | null = null;
function isDisabled(): boolean {
  if (telemetryDisabled !== null) return telemetryDisabled;
  // Check kill-switch env vars.
  if (process.env.GBROWSE_TELEMETRY_OFF === '1' || process.env.GSTACK_TELEMETRY_OFF === '1') {
    telemetryDisabled = true;
    return true;
  }
  // Default OFF — no skill preamble to configure it.
  // Set GBROWSE_TELEMETRY_OFF=0 to enable local analytics logging.
  telemetryDisabled = true;
  return true;
}

export interface TelemetryEvent {
  event: string;
  [key: string]: unknown;
}

/** Fire-and-forget log. Never throws. */
export function logTelemetry(payload: TelemetryEvent): void {
  if (isDisabled()) return;
  const enriched = { ...payload, ts: new Date().toISOString() };
  ensureDir()
    .then(() => fs.appendFile(telemetryFile(), JSON.stringify(enriched) + '\n', 'utf8'))
    .catch(() => {
      // Telemetry must never crash the caller. If the disk is full or perms
      // are wrong, swallow silently — there's nothing useful to do here.
    });
}

/** Test-only: reset cached state. */
export function _resetTelemetryCache(): void {
  telemetryDisabled = null;
  lastEnsuredDir = null;
}
