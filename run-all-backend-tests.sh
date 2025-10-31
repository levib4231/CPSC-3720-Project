#!/bin/zsh
# run-all-tests.sh
# Automated test runner for TigerTix (Sprint 2, Task 3)
# -----------------------------------------------------
# Runs unit, integration, and frontend tests for all microservices.
# Generates a consolidated report under tests/test-report.log

set -e  # stop on first error
set -o pipefail

PROJECT_ROOT="$(pwd)"
REPORT_DIR="${PROJECT_ROOT}/tests"
REPORT_FILE="${REPORT_DIR}/test-report.log"

# Ensure report directory exists
mkdir -p "$REPORT_DIR"

echo "========================================" | tee "$REPORT_FILE"
echo " TigerTix Automated Test Runner" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "Date: $(date)" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

function run_section() {
  local name="$1"
  local dir="$2"
  local cmd="$3"

  echo "▶️  Running ${name} tests..." | tee -a "$REPORT_FILE"
  echo "----------------------------------------" | tee -a "$REPORT_FILE"

  cd "$dir" || { echo "Failed to cd into $dir" | tee -a "$REPORT_FILE"; exit 1; }

  # Ensure dependencies
  npm install --silent

  # Run tests with Jest (or npm test fallback)
  if [ -f "package.json" ]; then
    if npm test -- --detectOpenHandles 2>&1 | tee -a "$REPORT_FILE"; then
      echo "${name} tests passed." | tee -a "$REPORT_FILE"
    else
      echo "${name} tests failed." | tee -a "$REPORT_FILE"
    fi
  fi

  echo "" | tee -a "$REPORT_FILE"
  cd "$PROJECT_ROOT"
}

# ----------------------------
# Backend microservices
# ----------------------------
run_section "Admin Service" "${PROJECT_ROOT}/backend/admin-service" "npm test"
run_section "Client Service" "${PROJECT_ROOT}/backend/client-service" "npm test"
run_section "LLM-Driven Booking" "${PROJECT_ROOT}/backend/llm-driven-booking" "npm test"


# ----------------------------
# Optional Concurrency Test
# ----------------------------
if [ -f "${PROJECT_ROOT}/backend/client-service/__tests__/concurrency.test.js" ]; then
  echo " Running concurrency test (client-service)..." | tee -a "$REPORT_FILE"
  cd "${PROJECT_ROOT}/backend/client-service"
  npm test __tests__/concurrency.test.js --runInBand --detectOpenHandles 2>&1 | tee -a "$REPORT_FILE"
  cd "$PROJECT_ROOT"
fi

# ----------------------------
# Summary
# ----------------------------
echo "" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo " All tests complete." | tee -a "$REPORT_FILE"
echo " Full report saved to: $REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo ""

# Optional: open report automatically in macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$REPORT_FILE"
fi