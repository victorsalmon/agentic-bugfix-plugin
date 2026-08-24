#!/usr/bin/env node
// validate-json.js — parse the JSON manifests and package metadata.
// Exits non-zero if any file is invalid JSON or missing required fields.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const manifests = [
  { file: 'package.json', required: ['name', 'version', 'license', 'repository'] },
  { file: '.claude-plugin/plugin.json', required: ['name', 'version', 'description', 'license'] },
  { file: '.zcode-plugin/plugin.json', required: ['name', 'version', 'description', 'license'] },
  { file: 'marketplace.json', required: ['name', 'plugins'] }
];

let ok = true;

for (const { file, required } of manifests) {
  const full = path.join(root, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    console.error(`FAIL: ${file} is not valid JSON — ${err.message}`);
    ok = false;
    continue;
  }
  const missing = required.filter((key) => !(key in data));
  if (missing.length) {
    console.error(`FAIL: ${file} missing required field(s): ${missing.join(', ')}`);
    ok = false;
  } else {
    console.log(`OK: ${file}`);
  }

  if (file === 'marketplace.json' && Array.isArray(data.plugins)) {
    for (let i = 0; i < data.plugins.length; i++) {
      const plugin = data.plugins[i];
      const pluginMissing = ['name', 'version', 'description', 'license'].filter(
        (key) => !(key in plugin)
      );
      if (pluginMissing.length) {
        console.error(
          `FAIL: ${file} plugin[${i}] missing required field(s): ${pluginMissing.join(', ')}`
        );
        ok = false;
      }
    }
  }
}

if (ok) {
  console.log('All JSON manifests are valid.');
  process.exit(0);
} else {
  process.exit(1);
}
