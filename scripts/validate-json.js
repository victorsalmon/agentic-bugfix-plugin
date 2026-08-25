#!/usr/bin/env node
/**
 * validate-json.js
 *
 * Validates the JSON plugin manifests and marketplace metadata. Exits non-zero
 * if any file is malformed or missing required fields that clients rely on.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Required fields for every plugin entry, regardless of whether it appears in a
 * client plugin manifest or the marketplace catalog.
 */
const PLUGIN_REQUIRED_FIELDS = ['name', 'version', 'description', 'license'];

/**
 * Manifests to validate, mapped to the top-level fields each one must contain.
 * These fields form the public contract for package and plugin metadata.
 */
const MANIFEST_DEFINITIONS = [
  { file: 'package.json', required: ['name', 'version', 'license', 'repository'] },
  { file: '.claude-plugin/plugin.json', required: ['name', 'version', 'description', 'license'] },
  { file: '.zcode-plugin/plugin.json', required: ['name', 'version', 'description', 'license'] },
  { file: 'marketplace.json', required: ['name', 'plugins'] }
];

/**
 * Return the subset of required keys that are missing from the given object.
 *
 * @param {object} obj
 * @param {string[]} requiredKeys
 * @returns {string[]}
 */
function getMissingKeys(obj, requiredKeys) {
  return requiredKeys.filter((key) => !(key in obj));
}

/**
 * Parse a JSON manifest and return the parsed object.
 *
 * @param {string} relativePath
 * @param {string} absolutePath
 * @returns {object|null} The parsed manifest, or `null` if parsing failed.
 */
function parseManifest(relativePath, absolutePath) {
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (err) {
    console.error(`FAIL: ${relativePath} is not valid JSON — ${err.message}`);
    return null;
  }
}

/**
 * Validate that a manifest contains all the required top-level fields.
 *
 * @param {string} relativePath
 * @param {object} data
 * @param {string[]} requiredKeys
 * @returns {boolean} Whether the manifest passed the top-level check.
 */
function validateTopLevelManifest(relativePath, data, requiredKeys) {
  const missing = getMissingKeys(data, requiredKeys);
  if (missing.length) {
    console.error(`FAIL: ${relativePath} missing required field(s): ${missing.join(', ')}`);
    return false;
  }
  console.log(`OK: ${relativePath}`);
  return true;
}

/**
 * Validate each plugin entry inside a marketplace catalog.
 *
 * @param {string} relativePath
 * @param {object[]} plugins
 * @returns {boolean} Whether every plugin entry has the required fields.
 */
function validateMarketplacePlugins(relativePath, plugins) {
  let allPluginsValid = true;
  for (const [index, plugin] of plugins.entries()) {
    const missing = getMissingKeys(plugin, PLUGIN_REQUIRED_FIELDS);
    if (missing.length) {
      console.error(
        `FAIL: ${relativePath} plugin[${index}] missing required field(s): ${missing.join(', ')}`
      );
      allPluginsValid = false;
    }
  }
  return allPluginsValid;
}

/**
 * Run the manifest validation suite.
 */
function runValidation() {
  let allValid = true;

  for (const { file, required } of MANIFEST_DEFINITIONS) {
    const absolutePath = path.join(REPO_ROOT, file);
    const data = parseManifest(file, absolutePath);
    if (!data) {
      allValid = false;
      continue;
    }

    if (!validateTopLevelManifest(file, data, required)) {
      allValid = false;
    }

    if (file === 'marketplace.json' && Array.isArray(data.plugins)) {
      if (!validateMarketplacePlugins(file, data.plugins)) {
        allValid = false;
      }
    }
  }

  if (allValid) {
    console.log('All JSON manifests are valid.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runValidation();
