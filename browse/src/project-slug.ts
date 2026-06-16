/**
 * Project slug resolution for the browse daemon.
 *
 * Used by domain-skills (per-project storage) and sidebar prompt-context
 * injection. Cached after first call — slug is derived from the daemon's
 * git remote (or env override) and doesn't change between commands.
 */

import * as path from 'path';

let cachedSlug: string | null = null;

export function getCurrentProjectSlug(): string {
  if (cachedSlug) return cachedSlug;
  const explicit = process.env.GBROWSE_PROJECT_SLUG ?? process.env.GSTACK_PROJECT_SLUG;
  if (explicit) {
    cachedSlug = explicit;
    return explicit;
  }
  try {
    const proc = Bun.spawnSync(['git', 'remote', 'get-url', 'origin'], {
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 2_000,
    });
    if (proc.exitCode === 0) {
      const url = proc.stdout.toString().trim();
      // SSH:   git@github.com:owner/repo.git → owner-repo
      // HTTPS: https://github.com/owner/repo.git → owner-repo
      const match = url.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
      if (match) {
        cachedSlug = `${match[1]}-${match[2]}`;
        return cachedSlug;
      }
    }
    // Fallback: git root basename
    const rootProc = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel'], {
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 2_000,
    });
    if (rootProc.exitCode === 0) {
      const root = rootProc.stdout.toString().trim();
      cachedSlug = (root ? path.basename(root) : null) || 'unknown';
      return cachedSlug;
    }
  } catch {
    // fall through
  }
  cachedSlug = 'unknown';
  return cachedSlug;
}

/** Reset cache; for tests only. */
export function _resetProjectSlugCache(): void {
  cachedSlug = null;
}
