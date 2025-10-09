const { getAllEvents, purchaseTicket} = require ("../models/clientModel");

/**
 *  GET /api/events - List all events 
 */

exports.listEvents = async (req, res) => {
    try {
        const events = await getAllEvents();
        res.status(200).json(events);
    } catch (err) {
        console.error("[ClientController] Error listing events:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/**
 * POST /api/events/:id/purchase - Purchase a ticket for an event
*/

exports.purchaseEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);

        if (isNaN(eventId)) {
            return res.status(400).json({error: "Invalid event ID"});
        }

        const result = await purchaseTicket(eventId);
        res.status(200).json({
            message: "Ticket purchased successfully",
            event: result.eventName,
            remainingTickets: result.remainingTickets
        });
    } catch (err) {
        console.error("[ClientController] Error purchasing ticket:", err);

        // handle specific error cases
        if (err.message == "EVENT_NOT_FOUND") {
            return res.status(404).json({error: "Event not found"});
        }

        if (err.message == "SOLD_OUT" || err.message == "SOLD_OUT_RACE") {
            return res.status(409).json({ error: "Tickets sold out" });
        }

        res.status(500).json({ error: "Server error" });
    }
}; 