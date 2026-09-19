/**
 * manifests.test.js
 *
 * Offline contract tests for the public JSON manifests: every manifest must
 * parse and carry the required public metadata, and versions must stay in
 * sync across the package and plugin manifests.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

function readJson(rel) {
  const raw = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
  return JSON.parse(raw);
}

describe('package.json metadata', () => {
  it('parses and has the required public fields', () => {
    const pkg = readJson('package.json');
    for (const field of ['name', 'description', 'license', 'author', 'repository']) {
      assert.ok(pkg[field], `package.json missing required field: ${field}`);
    }
    assert.ok(pkg.repository.url, 'package.json repository.url must be set');
  });
});

describe('client plugin manifests', () => {
  for (const rel of ['.claude-plugin/plugin.json', '.zcode-plugin/plugin.json']) {
    it(`${rel} parses and has name/description/version/license`, () => {
      const manifest = readJson(rel);
      for (const field of ['name', 'description', 'version', 'license']) {
        assert.ok(manifest[field], `${rel} missing required field: ${field}`);
      }
      assert.equal(typeof manifest.description, 'string');
      assert.ok(manifest.description.length > 0, `${rel} description must be non-empty`);
    });
  }
});

describe('marketplace.json', () => {
  it('parses and every plugin entry has name/description', () => {
    const marketplace = readJson('marketplace.json');
    assert.ok(marketplace.name, 'marketplace.json missing required field: name');
    assert.ok(Array.isArray(marketplace.plugins), 'marketplace.json plugins must be an array');
    assert.ok(marketplace.plugins.length > 0, 'marketplace.json plugins must not be empty');
    for (const plugin of marketplace.plugins) {
      assert.ok(plugin.name, 'marketplace plugin entry missing required field: name');
      assert.ok(
        plugin.description && plugin.description.length > 0,
        `marketplace plugin "${plugin.name}" missing non-empty description`,
      );
    }
  });
});

describe('version sync', () => {
  it('package, plugin, and marketplace versions agree', () => {
    const pkg = readJson('package.json');
    const claude = readJson('.claude-plugin/plugin.json');
    const zcode = readJson('.zcode-plugin/plugin.json');
    const marketplace = readJson('marketplace.json');
    assert.equal(claude.version, pkg.version, '.claude-plugin/plugin.json version drift');
    assert.equal(zcode.version, pkg.version, '.zcode-plugin/plugin.json version drift');
    for (const plugin of marketplace.plugins) {
      if (plugin.version) {
        assert.equal(
          plugin.version,
          pkg.version,
          `marketplace plugin "${plugin.name}" version drift`,
        );
      }
    }
  });
});
