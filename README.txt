TIGERTIX - QUICK START GUIDE

License
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation 
files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, 
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom 
the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the 
Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

Team Members
Levi Bates, Isabella John and Price Medlin
Instructor - Dr. Julian Brinkley

Overview
TigerTix is a microservice-based ticketing app built with:
- React.js frontend
- Node.js + Express backend
- SQLite shared database

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
Environment Variables Setup
------------------------------------------------------------

Backend Environment Variables

The project uses a shared .env template at the root:

Variables
PORT
  Service(s): user-authentication (local)
  Description: Local port fallback (Railway sets PORT in production)
  Example: 6003

MONGO_URI
  Service(s): user-authentication
  Description: MongoDB connection string (local or Atlas)
  Example: mongodb://127.0.0.1:27017/user_auth_demo or your Atlas URI

JWT_SECRET
  Service(s): user-authentication + llm-driven-booking
  Description: Secret key for signing and verifying JWTs
  Example: super-secret-key

JWT_EXPIRES
  Service(s): user-authentication
  Description: JWT expiration duration
  Example: 30m

COOKIE_SECURE
  Service(s): user-authentication
  Description: Whether auth cookies are marked Secure
  Example: false (local), true (production)

CLIENT_ORIGIN
  Service(s): user-authentication
  Description: Allowed frontend origin for CORS / cookies
  Example: http://localhost:3000 or your Vercel URL

GOOGLE_API_KEY*
  Service(s): llm-driven-booking
  Description: API key for Google AI Studio (Gemini) used to parse natural-language booking requests
  Example: your-google-api-key-here

CLIENT_SERVICE_API
  Service(s): llm-driven-booking
  Description: Base URL for the client-service API used when confirming bookings
  Example: http://localhost:6001/api or your Railway client-service URL

Frontend Environment Variables

Defined in frontend/.env (local) and in Vercel (production):

Variables
REACT_APP_CLIENT_API
  Service(s): React frontend (events + ticket purchase)
  Description: Base URL for the client-service API
  Example: http://localhost:6001/api or your Railway client-service URL

REACT_APP_AUTH_API
  Service(s): React frontend (login + register)
  Description: Base URL for the user-authentication API
  Example: http://localhost:6003/api/auth or your Railway user-auth URL

REACT_APP_LLM_API
  Service(s): React frontend (LLM chat / booking)
  Description: Base URL for the LLM-driven booking API
  Example: http://localhost:6002/api/llm or your Railway llm-service URL

REACT_APP_ADMIN_API
  Service(s): React frontend (admin dashboard)
  Description: Base URL for the admin-service API
  Example: http://localhost:6000/api or your Railway admin-service URL

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

Issue: "uriOpen got unexpected input: expected string, got undefined"
Fix: rename env.example to .env

How to Run tests:

Goals
- Provide repeatable automated tests (unit + integration) for backend microservices and key frontend components.
- Provide manual test cases for features that require human validation (voice, screen reader).
- Verify database transaction safety with concurrency tests.

Automated testing types
- Unit tests
  - Pure functions + parser logic (llm-driven-booking/services/llmParser.js)
  - Model helpers (client-service/models/clientModel.js)
- Integration tests (Supertest + Jest)
  - Admin service: POST /api/admin/events, GET /api/admin/events
  - Client service: GET /api/events, POST /api/events/:id/purchase, concurrency integration (uses temp sqlite)
  - LLM service: POST /api/llm/parse, POST /api/llm/confirm (mock external calls)
- Frontend tests (React Testing Library + Jest)
  - ChatWindow: sending message calls /api/llm/parse and displays result
  - VoiceInputButton: mock Web Speech API, ensure transcript and send behavior
  - Accessibility: basic jest-axe checks for chat and mic components

Manual testing
- Natural language booking via text and voice (confirm booking only after explicit user confirmation)
- Accessibility: keyboard navigation, screen reader flow, focus indicators
- Concurrency: run concurrent purchases against a test DB and observe no oversell

How to run
- Backend (each service):
  - cd backend/<service>
  - npm install
  - npm test -- --detectOpenHandles
- Frontend:
  - cd frontend
  - npm install
  - npm test
- Concurrency (already wired into tests):
  - npm test __tests__/concurrency.test.js --runInBand --detectOpenHandles

Reporting
- Fill tests/TEST_REPORT.md with automated and manual results, include screenshots/logs for manual tests.

Demo Video
https://drive.google.com/file/d/1lRV5HUgjbO1hOVlghVHLVc1cuMIrAWjk/view?usp=sharing