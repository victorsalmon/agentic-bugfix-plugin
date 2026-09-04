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

function readFrontmatter(skillName) {
  const text = fs.readFileSync(path.join(SKILLS_DIR, skillName, 'SKILL.md'), 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${skillName}/SKILL.md must start with YAML frontmatter`);
  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) frontmatter[field[1]] = field[2].trim();
  }
  return frontmatter;
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
        `${skillName}/SKILL.md frontmatter description must be non-empty`
      );
    }
  });
});
