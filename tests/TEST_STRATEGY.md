# TigerTix — Test Strategy (Sprint 2, Task 3)

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