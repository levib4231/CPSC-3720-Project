/**
 * App.js
 *
 * Purpose:
 *   Displays campus events and a side-by-side LLM-driven chat assistant.
 *   The chat window now appears on the right side of the main content.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";
import ChatWindow from "./ChatWindow"; // Import chat component
const EVENTS_API = (process.env.REACT_APP_CLIENT_API || "http://localhost:6001/api").replace(/\/$/, "");
const AUTH_API = (process.env.REACT_APP_AUTH_API || "http://localhost:6003/api/auth").replace(/\/$/, "");

function App() {
  const [events, setEvents] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusVisible, setStatusVisible] = useState(false);
  const confirmationRef = useRef(null);

  // ---- Auth state (memory-mode JWT for cross-service calls) ----
  const [auth, setAuth] = useState({ token: null, email: null, delivery: "memory" });
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerMsg, setRegisterMsg] = useState("");

  /** -------------------- Show Status with Fade-Out -------------------- */
  const showStatus = useCallback((message) => {
    setStatusMessage(message);
    setStatusVisible(true);

    setTimeout(() => {
      setStatusVisible(false);
      setTimeout(() => setStatusMessage(""), 500);
    }, 4000);
  }, []);

  /** -------------------- Fetch Events -------------------- */
  const fetchEvents = useCallback(async () => {
  try {
    const res = await fetch(`${EVENTS_API}/events`, {
      headers: {
        Accept: "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {})
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);

    const raw = await res.json();
    const normalized = (Array.isArray(raw) ? raw : []).map(e => ({
      ...e,
      id: e.id ?? e._id,                         // support either id or _id
      tickets: Number.isFinite(e.tickets) ? e.tickets : Number(e.tickets) || 0
    }));

    setEvents(normalized);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load events:", err);
    }
    showStatus("Failed to load events. Please try again later.");
    setEvents([]); // keep UI stable
  }
}, [showStatus, auth?.token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Restore auth from previous session (memory-mode persisted in sessionStorage)
  useEffect(() => {
    const t = sessionStorage.getItem("auth_token");
    const e = sessionStorage.getItem("auth_email");
    if (t && e) {
      setAuth({ token: t, email: e, delivery: "memory" });
    }
  }, []);

  /** -------------------- Purchase Tickets -------------------- */
  const buyTicket = async (event) => {
    try {
      // Require login for purchases
      if (!auth.token) {
        showStatus("Please log in to buy tickets.");
        setShowLogin(true);
        return;
      }

      const res = await fetch(
        `${EVENTS_API}/events/${event.id}/purchase`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        }
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

  /** -------------------- Authentication -------------------- */
  const login = async (e) => {
    e?.preventDefault?.();
    setLoginError("");
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          delivery: "memory" // return token in body so we can call other services
        })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Login failed (${res.status})`);
      }
      const data = await res.json(); // { token, email, expiresIn }
      setAuth({ token: data.token, email: data.email, delivery: "memory" });
      sessionStorage.setItem("auth_token", data.token);
      sessionStorage.setItem("auth_email", data.email);
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      showStatus(`Logged in as ${data.email}`);
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Invalid email or password");
    }
  };

  const registerUser = async (e) => {
    e?.preventDefault?.();
    setRegisterError("");
    setRegisterMsg("");

    try {
      const res = await fetch(`${AUTH_API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Register failed (${res.status})`);
      }

      setRegisterMsg("Registered! You can now log in.");
      showStatus("Registration successful. Please log in.");
      setRegisterPassword("");
    } catch (err) {
      console.error("Register error:", err);
      setRegisterError(err.message || "Registration failed");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${AUTH_API}/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch {}
    setAuth({ token: null, email: null, delivery: "memory" });
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_email");
    showStatus("Logged out");
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
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-orange-600">
              Clemson Campus Events
            </h1>
            <div className="flex items-center gap-3">
              {auth.token ? (
                <>
                  <span className="text-sm text-gray-700">
                    Logged in as <strong>{auth.email}</strong>
                  </span>
                  <button
                    onClick={logout}
                    className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLogin((v) => !v);
                      setShowRegister(false);
                    }}
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                  >
                    {showLogin ? "Close Login" : "Login"}
                  </button>

                  <button
                    onClick={() => {
                      setShowRegister((v) => !v);
                      setShowLogin(false);
                    }}
                    className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  >
                    {showRegister ? "Close Register" : "Register"}
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Login Panel */}
          {!auth.token && showLogin && (
            <section className="mb-6 p-4 border rounded-lg bg-orange-50">
              <h2 className="text-lg font-semibold mb-3">Sign in</h2>
              <form onSubmit={login} className="grid gap-3 max-w-sm">
                <label className="grid gap-1">
                  <span className="text-sm">Email</span>
                  <input
                    className="border rounded px-2 py-1"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="username"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm">Password</span>
                  <input
                    type="password"
                    className="border rounded px-2 py-1"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
                {loginError && (
                  <div className="text-sm text-red-600">{loginError}</div>
                )}
                <div className="flex gap-2">
                  <button
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                    type="submit"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="px-3 py-1 rounded border"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Session lasts 30 minutes. You can still browse events without signing in.
                </p>
              </form>
            </section>
          )}

          {/* Register Panel */}
          {!auth.token && showRegister && (
            <section className="mb-6 p-4 border rounded-lg bg-orange-50">
              <h2 className="text-lg font-semibold mb-3">Create an account</h2>
              <form onSubmit={registerUser} className="grid gap-3 max-w-sm">
                <label className="grid gap-1">
                  <span className="text-sm">Email</span>
                  <input
                    className="border rounded px-2 py-1"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    autoComplete="username"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm">Password</span>
                  <input
                    type="password"
                    className="border rounded px-2 py-1"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                {registerError && (
                  <div className="text-sm text-red-600">{registerError}</div>
                )}
                {registerMsg && (
                  <div className="text-sm text-green-700">{registerMsg}</div>
                )}
                <div className="flex gap-2">
                  <button
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                    type="submit"
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="px-3 py-1 rounded border"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  After registering, use the Login form to sign in.
                </p>
              </form>
            </section>
          )}

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