-- =========================================================
-- TigerTix Database Schema
-- File: init.sql
--
-- Purpose:
--   Defines the database schema for the TigerTix platform.
--   This script creates all necessary tables for managing
--   campus events and tracking ticket purchases.
--
-- Standards:
--   - Clear documentation for maintainability.
--   - Consistent naming conventions (snake_case).
--   - Idempotent (safe to run multiple times).
--   - Includes constraints to preserve data integrity.
-- =========================================================

-- ------------------------
-- Table: events
-- ------------------------
-- Purpose:
--   Stores information about each campus event, including
--   name, scheduled date, and number of available tickets.
-- Columns:
--   id        - Unique event identifier (auto-incremented)
--   name      - Human-readable name of the event
--   date      - Event date in ISO 8601 format (YYYY-MM-DD)
--   tickets   - Remaining ticket count (must be ≥ 0)
-- ------------------------

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL CHECK (
    date LIKE '____-__-__'  -- rudimentary date format validation
  ),
  tickets INTEGER NOT NULL CHECK (tickets >= 0)
);

-- ------------------------
-- Table: purchases
-- ------------------------
-- Purpose:
--   Records each successful ticket purchase by clients.
--   Links to events table via event_id foreign key.
-- Columns:
--   id         - Unique purchase identifier
--   event_id   - Foreign key reference to events.id
--   buyer_name - Name of the purchaser
--   created_at - Timestamp of purchase
-- ------------------------

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  buyer_name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Optional: Preload a few demo events for testing
INSERT INTO events (name, date, tickets)
SELECT 'Clemson Homecoming Concert', '2025-10-20', 200
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Clemson Homecoming Concert');

INSERT INTO events (name, date, tickets)
SELECT 'Basketball Season Opener', '2025-11-05', 150
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Basketball Season Opener');