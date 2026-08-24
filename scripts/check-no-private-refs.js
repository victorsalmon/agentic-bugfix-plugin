#!/usr/bin/env node
// check-no-private-refs.js — Node fallback for the private-refs check.
// Reproduces the logic in check-no-private-refs.sh so the check can run
// on systems that do not have bash installed.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const patterns = [
  /C:\\Repos/,
  /salmon-orchestrator/,
  /currents-bookkeeping|currentsbk/,
  /aqe|AQE|mcp_aqe|21004/,
  /FLEET_API_TOKEN/,
  /qa-suite|iqa-mode/,
  /Tasks\/(Code|Review|Complete|Manual)\//,
  /Invoke-(GitPullSafe|SafeCommit)\.ps1/
];

const excludedBasenames = new Set([
  'check-no-private-refs.sh',
  'check-no-private-refs.js',
  'SYNC.md'
]);

const toScan = [
  'skills',
  'docs',
  'scripts',
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  '.claude-plugin',
  '.zcode-plugin',
  'marketplace.json'
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function collectFiles() {
  const files = [];
  for (const rel of toScan) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) {
      for (const f of walk(full)) {
        if (excludedBasenames.has(path.basename(f))) continue;
        files.push(f);
      }
    } else if (fs.statSync(full).isFile()) {
      if (excludedBasenames.has(path.basename(full))) continue;
      files.push(full);
    }
  }
  return files;
}

let found = false;
const files = collectFiles();

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const rel = path.relative(root, file);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        found = true;
        console.log(`${rel}:${i + 1}:${line}`);
      }
    }
  }
}

if (found) {
  console.log();
  console.log('FAIL: private references found above. Generalize them per docs/SYNC.md.');
  process.exit(1);
}

console.log('clean — no private references found');
