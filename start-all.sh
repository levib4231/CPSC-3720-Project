#!/bin/zsh
# start-all.sh
# ---------------------------------------------------------
# Purpose:
#   Start all backend services and frontend in separate
#   Terminal tabs on macOS.
#
# Usage:
#   ./start-all.sh
# ---------------------------------------------------------

# Exit early if not macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo " This script only works on macOS (requires Terminal.app)."
  exit 1
fi

# Helper: run command in new Terminal tab (macOS only)
# run_in_new_tab <directory> <command>
function run_in_new_tab() {
  local dir="$1"
  local cmd="$2"
  osascript <<EOF
tell application "Terminal"
  do script "cd \"${dir}\" && ${cmd}; exec zsh"
end tell
EOF
}

# Absolute project root
PROJECT_ROOT="$(pwd)"

# ----------------------------
# MongoDB (via Homebrew)
# ----------------------------
if command -v brew >/dev/null 2>&1; then
  echo "Ensuring MongoDB is running..."
  # Try common service names; ignore errors and just warn if both fail
  if ! brew services start mongodb-community >/dev/null 2>&1; then
    brew services start mongodb-community@7.0 >/dev/null 2>&1 || {
      echo "⚠️  Could not start MongoDB via Homebrew. Please ensure MongoDB is running (e.g., on 127.0.0.1:27017)."
    }
  fi
else
  echo "⚠️  Homebrew not found. Please ensure MongoDB is running before starting services."
fi
echo ""

# ----------------------------
# Backend services
# ----------------------------
run_in_new_tab "${PROJECT_ROOT}/backend/admin-service" "npm install && node server.js"
run_in_new_tab "${PROJECT_ROOT}/backend/client-service" "npm install && node server.js"
run_in_new_tab "${PROJECT_ROOT}/backend/llm-driven-booking" "npm install && node server.js"
run_in_new_tab "${PROJECT_ROOT}/backend/user-authentication" "npm install && node server.js"

# ----------------------------
# Frontend
# ----------------------------
run_in_new_tab "${PROJECT_ROOT}/frontend" "npm install && npm start; echo ''; echo 'Frontend running at http://localhost:3000'; read -n 1 -s -r -p 'Press any key to close this tab...'"

# ----------------------------
# Summary
# ----------------------------
sleep 2
echo "All services are starting in new Terminal tabs."
echo "If a tab closes instantly, check for errors in that service."
echo "Stop all services by closing their respective Terminal tabs."