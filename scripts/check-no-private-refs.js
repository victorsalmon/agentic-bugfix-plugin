#!/usr/bin/env node
/**
 * check-no-private-refs.js
 *
 * Scans the public plugin for private, environment-specific references that
 * must not leak into the portable copy. Exits non-zero if any forbidden token
 * is found outside the exempted files.
 *
 * This is the canonical implementation; the shell wrapper runs it when bash is
 * available, and `npm run check` falls back to it directly on Windows.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Forbidden tokens: each pattern matches a private canonical reference or
 * environment-specific detail that must be generalized away before projection.
 * Keep in sync with `check-no-private-refs.sh` (see docs/SYNC.md).
 */
const FORBIDDEN_PATTERNS = [
  /C:\\+Repos/,
  /currents-bookkeeping|currentsbk/,
  /aqe|AQE|mcp_aqe|21004/,
  /FLEET_API_TOKEN/,
  /qa-suite|iqa-mode/,
  /Tasks\/(Code|Review|Complete|Manual)\//,
  /Invoke-(GitPullSafe|SafeCommit)\.ps1/,
];

/**
 * Files that legitimately mention the forbidden tokens: the scanner scripts
 * themselves, the sync documentation that lists them as examples, and the
 * scanner's own test, which must contain planted token shapes to prove the
 * detection and redaction behaviour.
 */
const EXCLUDED_FILENAMES = new Set([
  'check-no-private-refs.sh',
  'check-no-private-refs.js',
  'SYNC.md',
  'no-private-refs.test.js',
]);

/**
 * Directories that are not project source and should never be scanned:
 * VCS metadata, installed dependencies, salmon-run lane worktrees, local
 * dossiers, and build output.
 */
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  '.worktrees',
  '.4c',
  'dist',
  'coverage',
]);

/**
 * Recursively list regular files under a directory, skipping `SKIPPED_DIRECTORIES`.
 *
 * @param {string} dir - Absolute directory path.
 * @yields {string} Absolute file path.
 */
function* walkDirectoryTree(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      yield* walkDirectoryTree(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/**
 * Determine whether a file should be omitted from scanning.
 *
 * @param {string} filePath - Absolute file path.
 * @returns {boolean}
 */
function isExcludedFile(filePath) {
  return EXCLUDED_FILENAMES.has(path.basename(filePath));
}

/**
 * Collect every file that the leak check should examine.
 *
 * Scans the whole repository tree rather than a hand-maintained allowlist, so
 * a new file (a manifest, a workflow, an example) is guarded by default. Only
 * `SKIPPED_DIRECTORIES` and `EXCLUDED_FILENAMES` are omitted.
 *
 * @returns {string[]} Absolute file paths, in directory-walk order.
 */
function collectScanFiles() {
  const files = [];
  for (const file of walkDirectoryTree(REPO_ROOT)) {
    if (isExcludedFile(file)) continue;
    files.push(file);
  }
  return files;
}

/**
 * Find every line in a file that matches a forbidden pattern.
 *
 * Leak records are redacted by design: they carry the file path, line number,
 * matched pattern index, and pattern source — never the raw line content —
 * so report output and test failures cannot echo a live secret.
 *
 * @param {string} filePath - Absolute file path.
 * @returns {Generator<{rel: string, lineNumber: number, patternIndex: number, patternSource: string}>}
 */
function* findLeaksInFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const rel = path.relative(REPO_ROOT, filePath);

  for (const [index, line] of lines.entries()) {
    for (const [patternIndex, pattern] of FORBIDDEN_PATTERNS.entries()) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        yield { rel, lineNumber: index + 1, patternIndex, patternSource: pattern.source };
      }
    }
  }
}

/**
 * Format a single leak as a redacted, line-oriented report entry.
 *
 * @param {{rel: string, lineNumber: number, patternIndex: number, patternSource: string}} leak - Redacted leak record.
 * @returns {string}
 */
function formatLeak(leak) {
  return `${leak.rel}:${leak.lineNumber}: pattern #${leak.patternIndex} (${leak.patternSource})`;
}

/**
 * Report a single leak using the redacted line-oriented format.
 *
 * @param {{rel: string, lineNumber: number, patternIndex: number, patternSource: string}} leak - Redacted leak record.
 */
function reportLeak(leak) {
  console.log(formatLeak(leak));
}

/**
 * Run the leak check and exit with the appropriate status.
 */
function runLeakCheck() {
  let leaksFound = false;
  const files = collectScanFiles();

  for (const file of files) {
    for (const leak of findLeaksInFile(file)) {
      leaksFound = true;
      reportLeak(leak);
    }
  }

  if (leaksFound) {
    console.log();
    console.log('FAIL: private references found above. Generalize them per docs/SYNC.md.');
    process.exit(1);
  }

  console.log('clean — no private references found');
}

if (require.main === module) {
  runLeakCheck();
}

module.exports = {
  FORBIDDEN_PATTERNS,
  EXCLUDED_FILENAMES,
  SKIPPED_DIRECTORIES,
  collectScanFiles,
  findLeaksInFile,
  formatLeak,
  reportLeak,
};
