/**
 * concurrentPurchases.js
 *
 * Purpose:
 *   Simulates concurrent ticket purchases for a campus event backend.
 *   Ensures accurate remaining tickets are reported after all purchases.
 *
 * Key Features:
 *   - Runs multiple ticket purchases in parallel.
 *   - Logs each purchase outcome.
 *   - Retrieves and logs remaining tickets safely.
 *
 * Inputs:
 *   - EVENT_ID: ID of the event to purchase tickets for.
 *   - PURCHASES: Array of ticket quantities to attempt.
 *
 * Outputs:
 *   - Console logs of purchase results and remaining tickets.
 *
 * Side Effects:
 *   - Sends POST requests to the backend API to purchase tickets.
 *   - Fetches updated event data after purchases.
 */

import fetch from 'node-fetch';

/** -------------------- Configuration -------------------- */
const EVENT_ID = 3; // Event to test
const PURCHASES = [
  { quantity: 1 },
  { quantity: 1 },
];

/** -------------------- Helper Functions -------------------- */

/**
 * purchaseTickets
 *
 * Purpose:
 *   Attempt to purchase tickets for a specific event.
 *
 * Inputs:
 *   - eventId (number): ID of the event.
 *   - quantity (number): Number of tickets to purchase.
 *
 * Outputs:
 *   - Returns the backend response object if successful.
 *
 * Side Effects:
 *   - Sends POST request to backend API.
 */
async function purchaseTickets(eventId, quantity) {
  try {
    const response = await fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log(`Purchase of ${quantity} tickets succeeded:`, result);
    return result;
  } catch (error) {
    console.error(`Purchase of ${quantity} tickets failed:`, error.message);
    return null; // Continue with other purchases
  }
}

/**
 * fetchAllEvents
 *
 * Purpose:
 *   Retrieve the list of all events from the backend.
 *
 * Inputs:
 *   - None
 *
 * Outputs:
 *   - Returns an array of event objects.
 *
 * Side Effects:
 *   - Sends GET request to backend API.
 */
async function fetchAllEvents() {
  try {
    const response = await fetch('http://localhost:6001/api/events');
    if (!response.ok) throw new Error(`Failed to fetch events: status ${response.status}`);

    const events = await response.json();
    return events;
  } catch (error) {
    console.error('Error fetching events:', error.message);
    return [];
  }
}

/**
 * getEventById
 *
 * Purpose:
 *   Find a specific event by ID from a list of events.
 *
 * Inputs:
 *   - events (array): Array of event objects.
 *   - eventId (number): ID of the event to find.
 *
 * Outputs:
 *   - Returns the event object if found, otherwise null.
 */
function getEventById(events, eventId) {
  return events.find(ev => ev.id === eventId) || null;
}

/** -------------------- Main Execution -------------------- */

/**
 * main
 *
 * Purpose:
 *   Orchestrates concurrent ticket purchases and reports remaining tickets.
 *
 * Inputs:
 *   - None (uses configured EVENT_ID and PURCHASES array)
 *
 * Outputs:
 *   - Console logs showing success/failure of each purchase and final ticket count.
 *
 * Side Effects:
 *   - Sends multiple API requests to backend.
 */
async function main() {
  console.log('Starting concurrent ticket purchases...');

  // Run all purchases concurrently
  const purchaseResults = await Promise.all(
    PURCHASES.map(p => purchaseTickets(EVENT_ID, p.quantity))
  );

  console.log('All purchases completed. Fetching remaining tickets...');

  // Fetch updated event list and find our event
  const events = await fetchAllEvents();
  const event = getEventById(events, EVENT_ID);

  if (event) {
    console.log(`Remaining tickets for event "${event.name}" (ID ${EVENT_ID}):`, event.tickets);
  } else {
    console.error(`Event with ID ${EVENT_ID} not found.`);
  }
}

// Execute main
main();