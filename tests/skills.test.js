/**
 * skills.test.js
 *
 * Offline contract tests for the skills layout: every skill directory must
 * ship a SKILL.md whose YAML frontmatter carries a name (matching the
 * directory) and a non-empty description.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');

function listSkillDirs() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function parseFrontmatter(text, label) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${label}/SKILL.md must start with YAML frontmatter`);
  const frontmatter = {};
  let blockKey = null;
  let blockStyle = null;
  let blockLines = [];
  function flushBlock() {
    if (blockKey) {
      if (blockStyle === '>') {
        // Folded scalar: join lines with spaces, blank lines mark paragraph breaks.
        const paragraphs = [];
        let current = [];
        for (const entry of blockLines) {
          if (entry === '') {
            if (current.length > 0) {
              paragraphs.push(current.join(' '));
              current = [];
            }
          } else {
            current.push(entry);
          }
        }
        if (current.length > 0) paragraphs.push(current.join(' '));
        frontmatter[blockKey] = paragraphs.join('\n').replace(/\s+/g, ' ').trim();
        // Preserve paragraph breaks collapsed above; empty block yields ''.
        if (blockLines.length === 0 || frontmatter[blockKey] === undefined) {
          frontmatter[blockKey] = '';
        }
      } else {
        // Literal scalar: preserve newlines.
        frontmatter[blockKey] = blockLines.join('\n').trim();
      }
    }
    blockKey = null;
    blockStyle = null;
    blockLines = [];
  }
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) {
      if (blockKey) flushBlock();
      const key = field[1];
      const raw = field[2].trim();
      if (/^[>|][+-]?$/.test(raw)) {
        blockKey = key;
        blockStyle = raw[0];
        blockLines = [];
      } else {
        frontmatter[key] = raw;
      }
      continue;
    }
    if (blockKey) {
      if (/^[ \t]+/.test(line) || line.trim() === '') {
        const stripped = line.trim();
        blockLines.push(stripped);
        continue;
      }
      flushBlock();
    }
  }
  if (blockKey) flushBlock();
  return frontmatter;
}

function readFrontmatter(skillName) {
  return parseFrontmatter(
    fs.readFileSync(path.join(SKILLS_DIR, skillName, 'SKILL.md'), 'utf8'),
    skillName,
  );
}

describe('skills layout', () => {
  it('ships at least one skill directory', () => {
    assert.ok(listSkillDirs().length > 0, 'skills/ must contain at least one skill');
  });

  it('every skill has SKILL.md with matching name and non-empty description', () => {
    for (const skillName of listSkillDirs()) {
      const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `${skillName}/SKILL.md must exist`);
      const frontmatter = readFrontmatter(skillName);
      assert.equal(frontmatter.name, skillName, `${skillName}/SKILL.md frontmatter name mismatch`);
      assert.ok(
        frontmatter.description && frontmatter.description.length > 0,
        `${skillName}/SKILL.md frontmatter description must be non-empty`,
      );
    }
  });
});

describe('skills index parity', () => {
  const indexPath = path.join(SKILLS_DIR, 'skills-index.json');

  function readIndex() {
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }

  it('indexes every skill directory exactly once and no stale entries', () => {
    const index = readIndex();
    assert.equal(index._meta.root, 'skills', 'index _meta.root must be "skills"');
    const indexed = index.skills.map((skill) => skill.name);
    assert.deepEqual(
      [...indexed].sort(),
      [...listSkillDirs()].sort(),
      'skills-index.json must list exactly the skill directories on disk',
    );
  });

  it('every index entry points at an existing active SKILL.md', () => {
    for (const skill of readIndex().skills) {
      assert.equal(
        skill.path,
        `skills/${skill.name}`,
        `${skill.name} path must be relative to root`,
      );
      assert.equal(
        skill.entry,
        `skills/${skill.name}/SKILL.md`,
        `${skill.name} entry must point at its SKILL.md`,
      );
      assert.equal(skill.status, 'active', `${skill.name} must be active`);
      assert.ok(
        fs.existsSync(path.join(SKILLS_DIR, skill.name, 'SKILL.md')),
        `${skill.name} entry file must exist`,
      );
      assert.ok(skill.description && skill.description.length > 0, `${skill.name} needs a summary`);
    }
  });
});

describe('frontmatter block scalars', () => {
  it('folds > scalars into a non-empty description', () => {
    const frontmatter = parseFrontmatter(
      '---\nname: demo\ndescription: >\n  first line\n  second line\n---\n\n# Demo\n',
      'demo',
    );
    assert.equal(frontmatter.description, 'first line second line');
  });

  it('parses an empty folded description, which fails the non-empty contract', () => {
    const frontmatter = parseFrontmatter('---\nname: demo\ndescription: >\n---\n', 'demo');
    assert.equal(frontmatter.description, '');
    assert.ok(
      !(frontmatter.description && frontmatter.description.length > 0),
      'an empty folded description must not satisfy the non-empty contract',
    );
  });

  it('preserves newlines for literal | scalars', () => {
    const frontmatter = parseFrontmatter(
      '---\ndescription: |\n  line one\n  line two\n---\n',
      'demo',
    );
    assert.equal(frontmatter.description, 'line one\nline two');
  });
});
