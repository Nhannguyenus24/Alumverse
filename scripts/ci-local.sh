#!/usr/bin/env bash
# Run local checks aligned with .github/workflows/ci.yml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REGEX='^(feat|fix|docs|chore|refactor|test|ci|perf|style)\([a-z0-9_-]+\): .{1,50}$'

echo "== Phase 0 · Branch sync with main =="
git fetch origin main --no-tags 2>/dev/null || true
if git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
  echo "PASS: branch contains main history"
else
  echo "WARN: branch may be behind origin/main — run: git fetch origin && git merge origin/main"
fi

echo ""
echo "== Phase 1 · Validate commit messages =="
BASE="${1:-origin/main}"
FAILED=0
while IFS= read -r msg; do
  [ -z "$msg" ] && continue
  if echo "$msg" | grep -E "$REGEX" >/dev/null; then
    echo "PASS: $msg"
  else
    echo "FAIL: $msg"
    FAILED=1
  fi
done <<< "$(git log --no-merges --format='%s' "$BASE"..HEAD 2>/dev/null || git log -1 --no-merges --format='%s')"

if [ "$FAILED" -eq 1 ]; then
  echo "See docs/COMMIT_RULES.md"
  exit 1
fi

BACKEND_CHANGED=$(git diff --name-only "$BASE"..HEAD 2>/dev/null | grep -c '^backend/' || true)
FRONTEND_CHANGED=$(git diff --name-only "$BASE"..HEAD 2>/dev/null | grep -c '^frontend/' || true)

if [ "${BACKEND_CHANGED:-0}" -gt 0 ]; then
  echo ""
  echo "== Phase 2-3 · Backend build & test =="
  (cd backend && ./mvnw -B package -DskipTests && ./mvnw -B test)
else
  echo ""
  echo "SKIP: no backend changes since $BASE"
fi

if [ "${FRONTEND_CHANGED:-0}" -gt 0 ]; then
  echo ""
  echo "== Phase 4-5 · Frontend build & lint =="
  (cd frontend && npm ci --legacy-peer-deps && npm run build)
  (cd frontend && npx eslint . --max-warnings 0)
else
  echo ""
  echo "SKIP: no frontend changes since $BASE"
fi

echo ""
echo "Local CI checks completed."
