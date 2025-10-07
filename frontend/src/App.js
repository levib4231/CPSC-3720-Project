import React, { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
    const [events, setEvents] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const confirmationRef = useRef(null); 

    useEffect(() => {
        fetch('http://localhost:5001/api/events')
            .then((res) => res.json())
            .then((data) => setEvents(data))
            .catch((err) => console.error(err));
    }, []);

    const buyTicket = (eventName) => {
        setStatusMessage(`Ticket purchased for: ${eventName}`);
        alert(`Ticket purchased for: ${eventName}`);

        setTimeout(() => {
            if (confirmationRef.current) {
                confirmationRef.current.focus();
            }
        }, 100);
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

                    {/* Accessible confirmation message */}
                    <div
                        aria-live="polite"
                        role="status"
                        className="confirmation-message"
                        tabIndex="-1"
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