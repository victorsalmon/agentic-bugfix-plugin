/**
 * validate-json.test.js
 *
 * Offline contract tests for the manifest validator. Importing the module must
 * not run the CLI or call `process.exit`, so the suite can exercise the pure
 * helpers and assert the repository manifests pass.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  PLUGIN_REQUIRED_FIELDS,
  getMissingKeys,
  validateTopLevelManifest,
  validateMarketplacePlugins,
  runValidation,
} = require('../scripts/validate-json.js');

function withSilencedConsole(fn) {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

describe('validate-json helpers', () => {
  it('importing the module exposes the validator without running the CLI', () => {
    assert.equal(typeof getMissingKeys, 'function');
    assert.equal(typeof validateTopLevelManifest, 'function');
    assert.equal(typeof validateMarketplacePlugins, 'function');
    assert.equal(typeof runValidation, 'function');
  });

  it('getMissingKeys reports only the absent required keys', () => {
    assert.deepEqual(getMissingKeys({ name: 'x' }, ['name', 'version']), ['version']);
    assert.deepEqual(getMissingKeys({ name: 'x', version: '1' }, ['name', 'version']), []);
  });

  it('validateTopLevelManifest accepts complete and rejects incomplete manifests', () => {
    const result = withSilencedConsole(() => ({
      complete: validateTopLevelManifest('demo.json', { name: 'x', version: '1' }, [
        'name',
        'version',
      ]),
      incomplete: validateTopLevelManifest('demo.json', { name: 'x' }, ['name', 'version']),
    }));
    assert.equal(result.complete, true);
    assert.equal(result.incomplete, false);
  });

  it('validateMarketplacePlugins requires the plugin contract fields', () => {
    const result = withSilencedConsole(() => ({
      complete: validateMarketplacePlugins('marketplace.json', [
        { name: 'x', version: '1', description: 'd', license: 'MIT' },
      ]),
      incomplete: validateMarketplacePlugins('marketplace.json', [{ name: 'x' }]),
    }));
    assert.equal(result.complete, true);
    assert.equal(result.incomplete, false);
    assert.ok(PLUGIN_REQUIRED_FIELDS.includes('description'));
  });

  it('the repository manifests pass validation', () => {
    assert.equal(
      withSilencedConsole(() => runValidation()),
      true,
    );
  });
});
