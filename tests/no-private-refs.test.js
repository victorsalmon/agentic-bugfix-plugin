/**
 * no-private-refs.test.js
 *
 * Offline guard against private-reference leaks: reuses the canonical scanner
 * logic from scripts/check-no-private-refs.js (single source of truth — no
 * duplicated patterns) and asserts the scanned tree is clean.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  FORBIDDEN_PATTERNS,
  collectScanFiles,
  findLeaksInFile,
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
        leaks.push(`${leak.rel}:${leak.lineNumber}:${leak.line}`);
      }
    }
    assert.equal(leaks.length, 0, `private references found:\n${leaks.join('\n')}`);
  });
});
