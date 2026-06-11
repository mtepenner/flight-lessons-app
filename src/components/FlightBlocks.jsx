import { FLIGHT_BLOCKS } from "../constants";

function FlightBlocks({ bookedSlots, bookingSlotId, onBook }) {
  return (
    <div className="flight-grid">
      {FLIGHT_BLOCKS.map((flightBlock) => {
        const isBookedByCurrentUser = bookedSlots.has(flightBlock.label);
        const isSubmitting = bookingSlotId === flightBlock.id;

        return (
          <article key={flightBlock.id} className="flight-card">
            <p className="eyebrow">3-hour block</p>
            <h4>{flightBlock.label}</h4>
            <p className="muted-text">
              Fixed scheduling keeps the concurrency logic simple and lets the
              database stay authoritative.
            </p>
            <button
              className="primary-button"
              disabled={isSubmitting}
              onClick={() => onBook(flightBlock)}
              type="button"
            >
              {isSubmitting ? "Booking..." : "Book"}
            </button>
            {isBookedByCurrentUser ? (
              <p className="status-text notice">Already on your schedule. The database will reject a duplicate insert.</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export default FlightBlocks;