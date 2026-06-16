/**
 * find-browse — locate the gbrowse browse binary.
 *
 * Compiled to browse/dist/find-browse (standalone binary, no bun runtime needed).
 * Outputs the absolute path to the browse binary on stdout, or exits 1 if not found.
 */

import { accessSync, constants } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ─── Binary Discovery ───────────────────────────────────────────

function getGitRoot(): string | null {
  try {
    const proc = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    if (proc.exitCode !== 0) return null;
    return proc.stdout.toString().trim();
  } catch {
    return null;
  }
}

function isExecutable(p: string): boolean {
  try {
    accessSync(p, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findExecutable(base: string): string | null {
  if (isExecutable(base)) return base;
  if (process.platform === 'win32') {
    for (const ext of ['.exe', '.cmd', '.bat']) {
      const withExt = base + ext;
      if (isExecutable(withExt)) return withExt;
    }
  }
  return null;
}

export function locateBinary(): string | null {
  const root = getGitRoot();
  const home = homedir();
  const markers = ['.codex', '.agents', '.claude'];

  // Workspace-local takes priority (for development)
  if (root) {
    for (const m of markers) {
      const local = join(root, m, 'skills', 'gbrowse', 'browse', 'dist', 'browse');
      const found = findExecutable(local);
      if (found) return found;
    }

    // Source-checkout fallback (binary lives directly at <repo>/browse/dist/browse)
    const sourceCheckout = join(root, 'browse', 'dist', 'browse');
    const sourceFound = findExecutable(sourceCheckout);
    if (sourceFound) return sourceFound;
  }

  // Global fallback
  for (const m of markers) {
    const global = join(home, m, 'skills', 'gbrowse', 'browse', 'dist', 'browse');
    const found = findExecutable(global);
    if (found) return found;
  }

  return null;
}

// ─── Main ───────────────────────────────────────────────────────

function main() {
  const bin = locateBinary();
  if (!bin) {
    process.stderr.write('ERROR: browse binary not found. Run: cd <skill-dir> && scripts/install.sh\n');
    process.exit(1);
  }

  console.log(bin);
}

if (import.meta.main) {
  main();
}
