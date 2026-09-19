/**
 * no-private-refs.test.js
 *
 * Offline guard against private-reference leaks: reuses the canonical scanner
 * logic from scripts/check-no-private-refs.js (single source of truth — no
 * duplicated patterns) and asserts the scanned tree is clean.
 *
 * Report output is redacted by design: leak records carry the file path, line
 * number, matched pattern index, and pattern source — never the raw line
 * content — so a failing assertion cannot echo a live secret.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  FORBIDDEN_PATTERNS,
  EXCLUDED_FILENAMES,
  collectScanFiles,
  findLeaksInFile,
  formatLeak,
} = require('../scripts/check-no-private-refs.js');

const REPO_ROOT = path.resolve(__dirname, '..');

const PLANTED_SECRET = 'FLEET_API_TOKEN=x';

function writeTempFixture(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-private-refs-'));
  const file = path.join(dir, 'fixture.md');
  fs.writeFileSync(file, content, 'utf8');
  return { dir, file };
}

describe('no private references', () => {
  it('scanner is armed with at least one forbidden pattern', () => {
    assert.ok(FORBIDDEN_PATTERNS.length > 0, 'FORBIDDEN_PATTERNS must not be empty');
  });

  it('scanner covers at least one file', () => {
    assert.ok(collectScanFiles().length > 0, 'collectScanFiles() must not be empty');
  });

  it('scans the whole tree, including manifests, examples, and CI config', () => {
    const scanned = collectScanFiles().map((file) =>
      path.relative(REPO_ROOT, file).split(path.sep).join('/'),
    );
    for (const expected of [
      'package.json',
      'SECURITY.md',
      'CODE_OF_CONDUCT.md',
      'examples/usage.md',
      '.github/workflows/ci.yml',
      'tests/manifests.test.js',
    ]) {
      assert.ok(scanned.includes(expected), `expected scan coverage for ${expected}`);
    }
  });

  it('never scans skipped directories', () => {
    for (const file of collectScanFiles()) {
      const segments = path.relative(REPO_ROOT, file).split(path.sep);
      for (const skipped of ['.git', 'node_modules', '.worktrees', '.4c', 'dist', 'coverage']) {
        assert.ok(!segments.includes(skipped), `skipped directory was scanned: ${file}`);
      }
    }
  });

  it('no scanned file contains a forbidden private reference', () => {
    const leaks = [];
    for (const file of collectScanFiles()) {
      for (const leak of findLeaksInFile(file)) {
        leaks.push(formatLeak(leak));
      }
    }
    assert.equal(leaks.length, 0, `private references found:\n${leaks.join('\n')}`);
  });

  it('leak records carry the pattern source and never echo raw line content', () => {
    const { dir, file } = writeTempFixture(`header\n${PLANTED_SECRET}\nfooter\n`);
    try {
      const leaks = [...findLeaksInFile(file)];
      assert.ok(leaks.length > 0, 'planted forbidden token must be detected (fail closed)');
      for (const leak of leaks) {
        assert.equal(typeof leak.lineNumber, 'number');
        assert.equal(typeof leak.patternIndex, 'number');
        assert.ok(
          leak.patternIndex >= 0 && leak.patternIndex < FORBIDDEN_PATTERNS.length,
          'patternIndex must identify the matched pattern',
        );
        assert.equal(leak.patternSource, FORBIDDEN_PATTERNS[leak.patternIndex].source);
        assert.ok(!('line' in leak), 'leak record must not carry raw line content');
        const report = formatLeak(leak);
        assert.ok(
          report.includes(leak.lineNumber.toString()),
          'report must contain the line number',
        );
        assert.ok(
          report.includes(`pattern #${leak.patternIndex}`),
          'report must contain the matched pattern index',
        );
        assert.ok(report.includes(leak.patternSource), 'report must contain the pattern source');
        assert.ok(!report.includes(PLANTED_SECRET), 'report must not echo the matched secret');
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('failing assertion output for a real leak contains no raw secret text', () => {
    const { dir, file } = writeTempFixture(`${PLANTED_SECRET}\n`);
    try {
      const leaks = [];
      for (const leak of findLeaksInFile(file)) {
        leaks.push(formatLeak(leak));
      }
      assert.ok(leaks.length > 0, 'planted forbidden token must be detected (fail closed)');
      const output = `private references found:\n${leaks.join('\n')}`;
      assert.ok(
        !output.includes(PLANTED_SECRET),
        'assertion output must not contain raw secret text',
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exclusion behavior is unchanged', () => {
    assert.ok(EXCLUDED_FILENAMES.has('check-no-private-refs.sh'));
    assert.ok(EXCLUDED_FILENAMES.has('check-no-private-refs.js'));
    assert.ok(EXCLUDED_FILENAMES.has('SYNC.md'));
    for (const file of collectScanFiles()) {
      assert.ok(!EXCLUDED_FILENAMES.has(path.basename(file)), `excluded file was scanned: ${file}`);
    }
  });

  it('flags the plain single-backslash absolute path (pattern #0)', () => {
    const { dir, file } = writeTempFixture('see C:\\Repos\\Public\\x for details\n');
    try {
      const leaks = [...findLeaksInFile(file)];
      assert.ok(leaks.length >= 1, 'plain C:\\Repos form must be detected');
      assert.ok(
        leaks.some((leak) => leak.patternIndex === 0),
        'plain form must match pattern #0',
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('flags the JSON-escaped double-backslash absolute path (pattern #0)', () => {
    const { dir, file } = writeTempFixture('{"path": "C:\\\\Repos\\\\Public\\\\x"}\n');
    try {
      const leaks = [...findLeaksInFile(file)];
      assert.ok(leaks.length >= 1, 'escaped C:\\\\Repos form must be detected');
      assert.ok(
        leaks.some((leak) => leak.patternIndex === 0),
        'escaped form must match pattern #0',
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('redacts escaped-path leak reports (no raw line content)', () => {
    const escapedLine = '{"path": "C:\\\\Repos\\\\Public\\\\x"}';
    const { dir, file } = writeTempFixture(`${escapedLine}\n`);
    try {
      const leaks = [...findLeaksInFile(file)];
      assert.ok(leaks.length >= 1, 'escaped fixture must produce a leak');
      for (const leak of leaks) {
        assert.ok(!('line' in leak), 'leak record must not carry raw line content');
        const report = formatLeak(leak);
        assert.ok(!report.includes(escapedLine), 'report must not echo raw line content');
        assert.ok(
          report.includes(`pattern #${leak.patternIndex}`),
          'report must carry pattern index',
        );
        assert.ok(report.includes(leak.patternSource), 'report must carry pattern source');
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
