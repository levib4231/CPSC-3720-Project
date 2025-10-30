# TigerTix — Test Report (Sprint 2)

Date: YYYY-MM-DD
Author: Team

## Automated Tests Summary
- Backend: Jest + Supertest
  - Admin service: [status]
  - Client service: [status]
  - LLM service: [status]
- Frontend: React Testing Library + Jest
  - Chat and Voice components: [status]
- Concurrency integration: [status]

## Manual Tests (fill results)
| ID | Scenario | Steps | Expected | Actual | Status | Notes |
| M1 | NL text booking | 1. Type "Book two tickets for Jazz Night" → Send 2. LLM proposes booking 3. Confirm | Booking created only after confirm |  |  |  |
| M2 | Voice booking | 1. Click mic, speak booking 2. Confirm | Transcript appears; LLM proposes booking; confirm proceeds |  |  |  |
| M3 | Accessibility | Keyboard tab navigation and screen reader | All interactive items reachable; ARIA labels present |  |  |  |
| M4 | Concurrency | Run concurrent purchases (> tickets) | No oversell; DB consistent |  |  |  |

## Bugs / Edge Cases
- (List any found)

## Notes
- How to reproduce manual failures, attachments, screenshots.