import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
    const [events, setEvents] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/events')
            .then((res) => res.json())
            .then((data) => setEvents(data))
            .catch((err) => console.error(err));
    }, []);

    const buyTicket = (eventName) => {
        setStatusMessage(`Ticket purchased for: ${eventName}`);
        setTimeout(() => setStatusMessage(''), 4000);
    };

    return (
        <>
            {/* Skip link for keyboard users */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            <div className="App">
                <header>
                    <h1>Clemson Campus Events</h1>
                </header>

                <main id="main-content" aria-live="polite" role="main">
                    <h2 id="upcoming-events">Upcoming Events</h2>
                    <section aria-labelledby="upcoming-events">
                        <ul role="list">
                            {events.map((event) => (
                                <li key={event.id}>
                                    <span>{event.name}</span> – <span>{event.date}</span>{' '}
                                    <button
                                        onClick={() => buyTicket(event.name)}
                                        aria-label={`Buy ticket for ${event.name}`}
                                    >
                                        Buy Ticket
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Hidden live region for screen readers */}
                    <div aria-live="polite" role="status" className="visually-hidden">
                        {statusMessage}
                    </div>

                    {statusMessage && (
                        <p
                            ref={confirmationRef}
                            tabIndex="-1"
                            role="alert"
                            className="confirmation-message"
                        >
                            {statusMessage}
                        </p>
                    )}
                </main>

                <footer>
                    <p>© 2025 Clemson Events</p>
                </footer>
            </div>
        </>
    );
}
export default App;