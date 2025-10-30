#!/bin/zsh
# start-all.sh: Start all backend services and frontend from project root
# Usage: ./start-all.sh

# Helper to run a command in a new Terminal tab (macOS only)
function run_in_new_tab() {
  local dir="$1"
  local cmd="$2"
  osascript \
    -e "tell application \"Terminal\" to do script \"cd $dir; $cmd; exec zsh\""
}

# Start backend admin-service
run_in_new_tab "$(pwd)/backend/admin-service" "npm install && node server.js"

# Start backend client-service
run_in_new_tab "$(pwd)/backend/client-service" "npm install && node server.js"

# Start backend llm-driven-booking
run_in_new_tab "$(pwd)/backend/llm-driven-booking" "npm install && node server.js"

# Start frontend
run_in_new_tab "$(pwd)/frontend" "npm install && npm start; echo ''; echo 'Frontend should be running at http://localhost:3000'; read -n 1 -s -r -p 'Press any key to close this tab...'"

# Print summary
sleep 2
echo "All services are starting in new Terminal tabs."
echo "If a tab closes instantly, check for errors in that service."
echo "You can stop all services by closing their respective Terminal tabs."
