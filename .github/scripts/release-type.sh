#!/usr/bin/env bash
# Prints major/minor/patch from conventional commits since the last tag, or nothing if no release is needed.
set -euo pipefail

last_tag=$(git describe --tags --abbrev=0 2>/dev/null || true)
log=$(git log --format=%B "${last_tag:+$last_tag..}HEAD")

if grep -qE '^[a-z]+(\([^)]*\))?!:|^BREAKING[ -]CHANGE:' <<<"$log"; then
  echo major
elif grep -qE '^feat(\([^)]*\))?:' <<<"$log"; then
  echo minor
elif grep -qE '^(fix|perf)(\([^)]*\))?:' <<<"$log"; then
  echo patch
fi
