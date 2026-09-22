#!/usr/bin/env bash
# =============================================================================
# run-all-tests.sh — run all unit and/or e2e tests in the Nx workspace and
# produce a summary report you can use to investigate failures.
#
# Usage:
#   bash run-all-tests.sh            # run BOTH unit + e2e (default)
#   bash run-all-tests.sh unit       # run unit tests only
#   bash run-all-tests.sh e2e        # run e2e tests only
#
# Output (under ./test-results/):
#   <target>-<project>-<timestamp>.log     full per-project logs
#   REPORT-<timestamp>.md                  summary table + failure excerpts
#
# Env:
#   SKIP_CACHE=0   allow Nx cache (default 1 → force fresh runs)
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

MODE="${1:-all}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="$SCRIPT_DIR/test-results"
mkdir -p "$OUT"

# Projects that expose each target. Add/remove here to extend coverage.
UNIT_PROJECTS=("admin" "inventory" "platform")
E2E_PROJECTS=("inventory-e2e" "platform-e2e")

CACHE_FLAG=()
if [[ "${SKIP_CACHE:-1}" == "1" ]]; then
  CACHE_FLAG=("--skip-nx-cache")
fi

PASS=0
FAIL=0
ROWS=()      # "status|target|project|log"
FAIL_LOGS=() # log paths of failed runs

run_one() {
  local target="$1" project="$2"
  local log="$OUT/${target}-${project}-${TS}.log"

  printf '→ nx %s %s\n' "$target" "$project"
  if npx nx "$target" "$project" "${CACHE_FLAG[@]}" > "$log" 2>&1; then
    PASS=$((PASS + 1))
    ROWS+=("PASS|$target|$project|$log")
    printf '  ✓ PASS\n'
  else
    FAIL=$((FAIL + 1))
    ROWS+=("FAIL|$target|$project|$log")
    FAIL_LOGS+=("$log")
    printf '  ✗ FAIL → %s\n' "$log"
  fi
}

case "$MODE" in
  unit) RUN_UNIT=1; RUN_E2E=0 ;;
  e2e)  RUN_UNIT=0; RUN_E2E=1 ;;
  all)  RUN_UNIT=1; RUN_E2E=1 ;;
  *)    echo "Unknown mode: $MODE (use unit | e2e | all)" >&2; exit 2 ;;
esac

if [[ $RUN_UNIT -eq 1 ]]; then
  echo "── Unit tests ─────────────────────────────"
  for p in "${UNIT_PROJECTS[@]}"; do run_one test "$p"; done
  echo ""
fi

if [[ $RUN_E2E -eq 1 ]]; then
  echo "── E2E tests ──────────────────────────────"
  for p in "${E2E_PROJECTS[@]}"; do run_one e2e "$p"; done
  echo ""
fi

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
REPORT="$OUT/REPORT-${TS}.md"
{
  echo "# Test Report — $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "**Mode:** \`$MODE\` &nbsp;|&nbsp; **Passed:** $PASS &nbsp;|&nbsp; **Failed:** $FAIL"
  echo ""
  echo "| Status | Target | Project | Log |"
  echo "|:---:|:---:|:---:|:---|"

  for row in "${ROWS[@]}"; do
    IFS='|' read -r status target project log <<< "$row"
    status_cell="PASS"
    [[ "$status" == "FAIL" ]] && status_cell="FAIL"
    log_name=""
    [[ -n "$log" ]] && log_name="[$(basename "$log")]($(basename "$log"))"
    echo "| $status_cell | $target | $project | $log_name |"
  done
  echo ""

  if [[ $FAIL -gt 0 ]]; then
    echo "## Failure details (last 40 lines per failed project)"
    echo ""
    for log in "${FAIL_LOGS[@]}"; do
      echo "### \`$(basename "$log")\`"
      echo ""
      echo '```'
      tail -n 40 "$log" | sed 's/\x1b\[[0-9;]*m//g'
      echo '```'
      echo ""
    done
  fi
} > "$REPORT"

echo "────────────────────────────────────────────"
echo "Passed: $PASS   Failed: $FAIL"
echo "Report: $REPORT"

[[ $FAIL -eq 0 ]]
