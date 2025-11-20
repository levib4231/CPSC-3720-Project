import { useState, useRef, useEffect } from "react";
import VoiceInputButton from "./components/voice/VoiceInputButton";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const messagesEndRef = useRef(null);


  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a user message to the LLM parse API
  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:6002/api/llm/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      // Add LLM reply
      setMessages((prev) => [
        ...prev,
        { text: data.reply || "No response", sender: "bot" },
      ]);

      // Store booking info if the message contained a booking intent
      if (data.bookingInfo && data.bookingInfo.event && data.bookingInfo.tickets) {
        setPendingBooking(data.bookingInfo);
      } else {
        setPendingBooking(null);
      }
    } catch (err) {
      console.error("LLM request failed:", err);
      setMessages((prev) => [
        ...prev,
        { text: "Oops! Something went wrong.", sender: "bot" },
      ]);
      setPendingBooking(null);
    } finally {
      setLoading(false);
    }
  };

  // Confirm the booking
  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;
    setLoading(true);

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch("http://localhost:6002/api/llm/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventName: pendingBooking.event,
          tickets: pendingBooking.tickets,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { text: data.message || "Booking confirmed!", sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            text: data.error || "Booking failed. Please try again.",
            sender: "bot",
          },
        ]);
      }
    } catch (err) {
      console.error("Confirm booking failed:", err);
      setMessages((prev) => [
        ...prev,
        { text: "Error confirming booking.", sender: "bot" },
      ]);
    } finally {
      setPendingBooking(null);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };
 
  // Handle voice input transcript (final result)
  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
    setInterimTranscript(""); // Clear interim text
  };

  // Handle voice input interim results (optional preview)
  const handleVoiceInterim = (transcript) => {
    setInterimTranscript(transcript);
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md border rounded-lg shadow-lg overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`my-2 p-2 rounded-lg max-w-[80%] ${
              msg.sender === "user"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {/* Show confirmation UI if a booking is pending */}
        {pendingBooking && (
          <div className="my-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-sm text-gray-800">
            <p>
              Confirm booking of{" "}
              <strong>{pendingBooking.tickets}</strong> ticket(s) for{" "}
              <strong>{pendingBooking.event}</strong>?
            </p>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                Confirm
              </button>
              <button
                onClick={() => setPendingBooking(null)}
                disabled={loading}
                className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interim voice transcript preview */}
        {interimTranscript && (
          <div className="my-2 p-2 rounded-lg max-w-[80%] bg-blue-300 text-gray-700 ml-auto italic opacity-70">
            {interimTranscript}
          </div>
        )}

      {/* Input area */}
      <div className="flex p-2 border-t bg-white">
        <input
          type="text"
          className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none"
          placeholder="Type or speak a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
        />
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          onInterim={handleVoiceInterim}
          disabled={loading}
          ariaLabel="Start voice input"
        />
        <button
          onClick={handleSend}
          className={`px-4 py-2 rounded-r-lg text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}