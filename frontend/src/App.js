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
import ChatWindow from './ChatWindow'; // Import chat component

function App() {
  const [events, setEvents] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusVisible, setStatusVisible] = useState(false);
  const confirmationRef = useRef(null);

  /** -------------------- Fetch Events -------------------- */
  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:6001/api/events');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load events:', err);
      showStatus('Failed to load events. Please try again later.');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /** -------------------- Purchase Tickets -------------------- */
  const buyTicket = async (event) => {
    try {
      const res = await fetch(
        `http://localhost:6001/api/events/${event.id}/purchase`,
        { method: 'POST' }
      );

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const updatedEvent = await res.json();

      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.id === event.id
            ? updatedEvent || { ...ev, tickets: Math.max(ev.tickets - 1, 0) }
            : ev
        )
      );

      showStatus(`Ticket purchased for: ${event.name}`);
    } catch (err) {
      console.error('Purchase failed:', err);
      showStatus(`Failed to purchase ticket for: ${event.name}`);
    } finally {
      setTimeout(() => confirmationRef.current?.focus(), 100);
      fetchEvents();
    }
  };

  /** -------------------- Show Status with Fade-Out -------------------- */
  const showStatus = (message) => {
    setStatusMessage(message);
    setStatusVisible(true);

    setTimeout(() => {
      setStatusVisible(false);
      setTimeout(() => setStatusMessage(''), 500);
    }, 4000);
  };

  /** -------------------- Render -------------------- */
  return (
    <>
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
            <ul className="event-list">
              {events
                .filter(Boolean)
                .map((event) => (
                  <li key={event.id} className="event-item">
                    <span>{event.name}</span> – <span>{event.date}</span> –{' '}
                    <strong>{event.tickets} tickets left</strong>{' '}
                    <button onClick={() => buyTicket(event)}>
                      Buy Ticket
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {statusMessage && (
            <div
              aria-live="polite"
              role="status"
              className={`confirmation-banner ${statusVisible ? '' : 'fade-out'}`}
              tabIndex={-1}
              ref={confirmationRef}
            >
              {statusMessage}
            </div>
          )}

          {/* -------------------- Chat Window -------------------- */}
          <div className="mt-8">
            <h2>Chat with our Assistant</h2>
            <ChatWindow />
          </div>
        </main>
      </div>
    </>
  );
}

export default App;