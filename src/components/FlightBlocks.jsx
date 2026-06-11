import { BOOKING_DAYS, createBookingSlotKey, FLIGHT_BLOCKS } from "../constants";

function FlightBlocks({ availability, bookedSlots, bookingSlotId, onBook }) {
  const availabilityLookup = new Map(
    availability.map((slot) => [
      createBookingSlotKey(slot.booking_day, slot.time_slot_id),
      slot.is_available,
    ]),
  );
  const openSlotCount = availability.filter((slot) => slot.is_available).length;
  const totalSlotCount = BOOKING_DAYS.length * FLIGHT_BLOCKS.length;

  return (
    <>
      <p className="status-text notice availability-summary">
        {openSlotCount} of {totalSlotCount} weekday slots are currently open.
      </p>
      <div className="flight-grid">
        {BOOKING_DAYS.flatMap((bookingDay) =>
          FLIGHT_BLOCKS.map((flightBlock) => {
            const slotKey = createBookingSlotKey(bookingDay, flightBlock.label);
            const isBookedByCurrentUser = bookedSlots.has(slotKey);
            const isAvailable = availabilityLookup.get(slotKey) ?? !isBookedByCurrentUser;
            const isSubmitting = bookingSlotId === slotKey;
            const isUnavailable = !isAvailable && !isBookedByCurrentUser;

            let description = "Currently available to book.";
            let buttonLabel = "Book";

            if (isSubmitting) {
              description = "Saving this booking now.";
              buttonLabel = "Booking...";
            } else if (isBookedByCurrentUser) {
              description =
                "Already on your schedule. Cancel it from the bookings list if your plans change.";
              buttonLabel = "Booked";
            } else if (isUnavailable) {
              description = "Already taken. Pick another weekday block.";
              buttonLabel = "Unavailable";
            }

            return (
              <article
                key={slotKey}
                className={`flight-card${isUnavailable ? " unavailable" : ""}`}
              >
                <p className="eyebrow">3-hour block</p>
                <h4>{`${bookingDay} - ${flightBlock.label}`}</h4>
                <p className="muted-text">{description}</p>
                <button
                  className="primary-button"
                  disabled={isSubmitting || !isAvailable}
                  onClick={() =>
                    onBook({
                      id: slotKey,
                      bookingDay,
                      label: flightBlock.label,
                      time: flightBlock.time,
                    })
                  }
                  type="button"
                >
                  {buttonLabel}
                </button>
                {isAvailable ? (
                  <p className="status-text notice">Available now</p>
                ) : isBookedByCurrentUser ? (
                  <p className="status-text notice">Booked by you</p>
                ) : (
                  <p className="muted-text">Unavailable</p>
                )}
              </article>
            );
          }),
        )}
      </div>
    </>
  );
}

export default FlightBlocks;