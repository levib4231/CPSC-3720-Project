/**
 * App.js
 * 
 * Purpose:
 *   Displays a list of campus events fetched from the backend and allows
 *   users to purchase tickets. Handles fetching, state updates, accessibility
 *   announcements, and basic error handling.
 * 
 * Main Components:
 *   - App: Root component that manages event data and UI.
 * 
 * Inputs:
 *   - None (fetches events from API endpoint http://localhost:6001/api/events)
 * 
 * Outputs:
 *   - Rendered React component showing events and purchase buttons.
 * 
 * Side Effects:
 *   - Fetches event data from server.
 *   - Sends POST request to purchase tickets.
 *   - Updates UI state and accessibility message.
 */

import React, { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  /** -------------------- State & Refs -------------------- */
  const [events, setEvents] = useState([]); // List of available events
  const [statusMessage, setStatusMessage] = useState(''); // Accessible status text
  const confirmationRef = useRef(null); // For screen-reader focus on update

  /** -------------------- Data Fetching -------------------- */

  /**
   * fetchEvents
   * Purpose: Retrieve list of events from backend API.
   * Inputs: None
   * Outputs: Updates local `events` state with data from API.
   * Error Handling: Logs errors to console if the fetch fails.
   */
  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:6001/api/events');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setStatusMessage('Failed to load events. Please try again later.');
    }
  };

  // Load events on initial mount
  useEffect(() => {
    fetchEvents();
  }, []);

  /** -------------------- Ticket Purchase -------------------- */

  /**
   * buyTicket
   * Purpose: Purchase a ticket for a specific event.
   * Inputs:
   *   - event (object): The event to purchase a ticket for.
   * Outputs:
   *   - Updates events list to reflect ticket count and sets confirmation message.
   * Error Handling:
   *   - Displays user-friendly message if request fails.
   */
  const buyTicket = async (event) => {
    try {
      const res = await fetch(
        `http://localhost:6001/api/events/${event.id}/purchase`,
        { method: 'POST' }
      );

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      // Attempt to parse the updated event from response
      const updatedEvent = await res.json();

      // Update local event list optimistically
      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.id === event.id
            ? updatedEvent || { ...ev, tickets: ev.tickets - 1 }
            : ev
        )
      );

      setStatusMessage(`Ticket purchased for: ${event.name}`);
    } catch (err) {
      console.error('Purchase failed:', err);
      setStatusMessage(`Failed to purchase ticket for: ${event.name}`);
    } finally {
      // Announce status to assistive tech (accessibility)
      setTimeout(() => {
        confirmationRef.current?.focus();
      }, 100);

      // Refresh events to ensure UI matches server data
      fetchEvents();
    }
  };

  /** -------------------- Render -------------------- */
  return (
    <>
      {/* Accessibility: Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="App">
        <header>
          <h1>Clemson Campus Events</h1>
        </header>

        <main id="main-content" aria-live="polite">
          <h2>Upcoming Events</h2>

          {events.length === 0 ? (
            <p>Loading events…</p>
          ) : (
            <ul>
              {events.map((event) => (
                <li key={event.id}>
                  <span>{event.name}</span> – <span>{event.date}</span> –{' '}
                  <strong>{event.tickets} tickets left</strong>{' '}
                  <button
                    onClick={() => buyTicket(event)}
                    aria-label={`Buy ticket for ${event.name}`}
                  >
                    Buy Ticket
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Accessible confirmation message */}
          <div
            aria-live="polite"
            role="status"
            className="confirmation-message"
            tabIndex={-1}
            ref={confirmationRef}
          >
            {statusMessage}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;