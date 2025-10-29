/**
 * App.js
 *
 * Purpose:
 *   Displays campus events and a side-by-side LLM-driven chat assistant.
 *   The chat window now appears on the right side of the main content.
 */

import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import ChatWindow from "./ChatWindow"; // Import chat component

function App() {
  const [events, setEvents] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusVisible, setStatusVisible] = useState(false);
  const confirmationRef = useRef(null);

  /** -------------------- Fetch Events -------------------- */
  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:6001/api/events");
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load events:", err);
      showStatus("Failed to load events. Please try again later.");
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
        { method: "POST" }
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
      console.error("Purchase failed:", err);
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
      setTimeout(() => setStatusMessage(""), 500);
    }, 4000);
  };

  /** -------------------- Render -------------------- */
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Outer layout: events on the left, chat on the right */}
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-white">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-orange-600">
              Clemson Campus Events
            </h1>
          </header>

          <main id="main-content" aria-live="polite">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>

            {events.length === 0 ? (
              <p>Loading events…</p>
            ) : (
              <ul className="event-list space-y-3">
                {events.filter(Boolean).map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between border rounded-lg p-3 shadow-sm"
                  >
                    <div>
                      <span className="font-medium">{event.name}</span> –{" "}
                      <span>{event.date}</span> –{" "}
                      <strong>{event.tickets} tickets left</strong>
                    </div>
                    <button
                      onClick={() => buyTicket(event)}
                      className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                    >
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
                className={`confirmation-banner ${
                  statusVisible ? "" : "fade-out"
                }`}
                tabIndex={-1}
                ref={confirmationRef}
              >
                {statusMessage}
              </div>
            )}
          </main>
        </div>

        {/* Side Chat Window */}
        <div className="w-[400px] border-l bg-gray-50 shadow-lg flex flex-col">
          <div className="p-4 border-b bg-orange-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Assistant Chat
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;