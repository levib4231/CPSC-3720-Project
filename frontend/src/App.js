// src/App.js
import React, { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const confirmationRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:6001/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error('Failed to load events:', err));
  }, []);

  const buyTicket = async (event) => {
    try {
      const res = await fetch(
        `http://localhost:6001/api/events/${event.id}/purchase`,
        { method: 'POST' }
      );

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      // The API may return the updated event. If not, just decrement locally.
      const updatedEvent = await res.json(); // could be null or an object

      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== event.id) return ev;
          // If the server sent us a new object, use it; otherwise decrement
          return updatedEvent ? updatedEvent : { ...ev, tickets: ev.tickets - 1 };
        })
      );

      setStatusMessage(`Ticket purchased for: ${event.name}`);
    } catch (err) {
      console.error('Purchase failed:', err);
      setStatusMessage(`Failed to purchase ticket for: ${event.name}`);
    } finally {
      // Announce the status change to screen‑readers
      setTimeout(() => {
        if (confirmationRef.current) confirmationRef.current.focus();
      }, 100);
    }

    fetch('http://localhost:6001/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error('Failed to load events:', err));
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

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
                  <span>{event.name}</span> – <span>{event.date}</span>
                  {' – '}
                  <strong>{event.tickets} tickets left</strong>

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

          {/* Accessible status / confirmation message */}
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
