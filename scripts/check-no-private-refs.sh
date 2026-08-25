#!/usr/bin/env bash
# check-no-private-refs.sh — shell entry point for the private-refs leak check.
#
# The canonical scanning logic is intentionally maintained in a single place:
# `scripts/check-no-private-refs.js`. This wrapper lets `npm run check` use bash
# when it is available, while the package fallback path runs the same Node
# implementation directly. Keeping the checker in one place avoids drift
# between the two entry points.
set -euo pipefail

# Resolve the repo root from the script path so the wrapper works whether it is
# invoked from the repo root or through an absolute path.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${script_dir}/.."

exec node scripts/check-no-private-refs.js
