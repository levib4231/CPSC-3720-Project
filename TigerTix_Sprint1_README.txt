TIGERTIX - SPRINT 1 QUICK START GUIDE

Overview
TigerTix is a microservice-based ticketing app built with:
- React.js frontend
- Node.js + Express backend
- SQLite shared database

In Sprint 1, we split the backend into Admin and Client services, connected them to a shared database, integrated the React frontend, and added accessibility + concurrency handling.

------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------
- Node.js (v18 or higher)
- npm or yarn
- SQLite3 installed

------------------------------------------------------------
RUN INSTRUCTIONS
------------------------------------------------------------

1) Setup the database
cd backend/shared-db
sqlite3 database.sqlite < init.sql

2) Start the Admin Service (port 5001)
cd ../admin-service
npm install
npm start

API test:
curl -X POST http://localhost:5001/api/events -H "Content-Type: application/json" -d '{"name":"Spring Concert","date":"2025-11-15","tickets":100}'

3) Start the Client Service (port 6001)
cd ../client-service
npm install
npm start

API tests:
curl http://localhost:6001/api/events
curl -X POST http://localhost:6001/api/events/1/purchase -H "Content-Type: application/json" -d '{"quantity":1}'

4) Run the React Frontend (port 3000)
cd ../../frontend
npm install
npm start

Then open http://localhost:3000 in your browser.

------------------------------------------------------------
FEATURES
------------------------------------------------------------
Admin Service:
- Create events (POST /api/events)
- Stores data in shared SQLite DB

Client Service:
- Fetch events (GET /api/events)
- Purchase tickets (POST /api/events/:id/purchase)
- Handles concurrency safely

Frontend (React):
- Displays live event data
- "Buy Ticket" button updates UI dynamically
- Accessible with keyboard & screen readers

------------------------------------------------------------
ACCESSIBILITY HIGHLIGHTS
------------------------------------------------------------
- Proper semantic HTML (ul, li, button)
- aria-label for buttons
- aria-live="polite" for purchase confirmations
- Fully keyboard-navigable (Tab / Shift+Tab / Enter)
- Visible focus indicators

------------------------------------------------------------
CONCURRENCY TEST
------------------------------------------------------------
curl -s -X POST http://localhost:6001/api/events/1/purchase  &
curl -s -X POST http://localhost:6001/api/events/1/purchase  &
wait

Only one purchase succeeds, proving atomic DB updates.

------------------------------------------------------------
COMMON ISSUES
------------------------------------------------------------
Issue: "Database locked"
Fix: Wait or retry; SQLite handles one write at a time

Issue: "Port in use"
Fix: Change PORT in .env

Issue: "No events showing"
Fix: Start the Client Service before the frontend

Issue: "CORS errors"
Fix: Add CORS middleware to both services
------------------------------------------------------------
TEAM 3720 - SPRINT 1 SUBMISSION
------------------------------------------------------------
Includes:
Admin Service, Client Service, Shared DB, React Frontend, Accessibility, Concurrency Handling
