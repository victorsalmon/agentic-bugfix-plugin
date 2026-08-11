#!/usr/bin/env bash
# check-no-private-refs.sh — verify no private/environment-specific references
# leaked into the public plugin. Exits non-zero on any hit.
#
# Run from the repo root:  bash scripts/check-no-private-refs.sh
# Used by the SYNC.md projection procedure (see docs/SYNC.md).
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "warning: not a git repo; running anyway" >&2
fi

# Tokens that must never appear in the public plugin. Each is a private
# canonical / environment-specific reference that must be generalized away.
patterns=(
  -e 'C:\\Repos'
  -e 'salmon-orchestrator'
  -e 'currents-bookkeeping|currentsbk'
  -e 'aqe|AQE|mcp_aqe|21004'
  -e 'FLEET_API_TOKEN'
  -e 'qa-suite|iqa-mode'
  -e 'Tasks/(Code|Review|Complete|Manual)/'
  -e 'Invoke-(GitPullSafe|SafeCommit)\.ps1'
)

# Scan everything except this script and SYNC.md (which legitimately mention the
# tokens as examples).
if grep -RInE "${patterns[@]}" \
    --exclude='check-no-private-refs.sh' \
    --exclude='SYNC.md' \
    skills/ docs/ scripts/ README.md CHANGELOG.md CONTRIBUTING.md \
    .claude-plugin/ .zcode-plugin/ marketplace.json 2>/dev/null; then
  echo
  echo "FAIL: private references found above. Generalize them per docs/SYNC.md."
  exit 1
fi

echo "clean — no private references found"
