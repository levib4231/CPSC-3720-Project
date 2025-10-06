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
        alert(`Ticket purchased for: ${eventName}`);
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

                <main id="main-content" aria-live="polite">
                    <h2>Upcoming Events</h2>
                    <ul>
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

                    {/* Live region for feedback */}
                    <div
                        aria-live="polite"
                        role="status"
                        className="visually-hidden"
                    >
                        {statusMessage}
                    </div>
                </main>

                <footer>
                    <p>© 2025 Clemson Events</p>
                </footer>
            </div>
        </>
    );
}

export default App;