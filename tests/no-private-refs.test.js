/**
 * no-private-refs.test.js
 *
 * Offline guard against private-reference leaks: reuses the canonical scanner
 * logic from scripts/check-no-private-refs.js (single source of truth — no
 * duplicated patterns) and asserts the scanned tree is clean.
 *
 * All failure output is redacted: leak records carry only the file path, line
 * number, matched pattern index, and pattern source — never raw line content.
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

describe('no private references', () => {
  it('scanner is armed with at least one forbidden pattern', () => {
    assert.ok(FORBIDDEN_PATTERNS.length > 0, 'FORBIDDEN_PATTERNS must not be empty');
  });

  it('scanner covers at least one file', () => {
    assert.ok(collectScanFiles().length > 0, 'collectScanFiles() must not be empty');
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

  it('leak records carry pattern identity and never echo raw content', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leakcheck-'));
    const fixture = path.join(dir, 'fixture.md');
    const secretLine = 'FLEET_API_TOKEN=x';
    fs.writeFileSync(fixture, `clean line\n${secretLine}\n`, 'utf8');
    try {
      const leaks = [...findLeaksInFile(fixture)];
      assert.ok(leaks.length > 0, 'planted token must produce at least one leak');
      for (const leak of leaks) {
        assert.equal(typeof leak.patternIndex, 'number');
        assert.ok(leak.patternIndex >= 0 && leak.patternIndex < FORBIDDEN_PATTERNS.length);
        assert.equal(leak.patternSource, FORBIDDEN_PATTERNS[leak.patternIndex].source);
        assert.ok(!('line' in leak), 'leak record must not carry raw line content');
        const line = formatLeak(leak);
        assert.ok(line.includes(String(leak.lineNumber)), 'report line must contain line number');
        assert.ok(line.includes(`pattern[${leak.patternIndex}]`), 'report line must contain pattern index');
        assert.ok(line.includes(leak.patternSource), 'report line must contain pattern source');
        assert.ok(!line.includes(secretLine), 'report line must not echo the matched secret');
      }
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
});
