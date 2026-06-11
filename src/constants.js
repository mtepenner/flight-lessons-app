export const DUPLICATE_SLOT_ERROR_CODE = "23505";

export const DUPLICATE_SLOT_MESSAGE =
  "Oops! Someone just snatched this slot. Please pick another.";

export const MISSING_BOOKINGS_TABLE_ERROR_CODE = "PGRST205";

export const MISSING_BOOKINGS_TABLE_MESSAGE =
  "Supabase setup is incomplete. Run the SQL in supabase/schema.sql for this project, then reload the app.";

export const BOOKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export function createBookingSlotKey(bookingDay, timeSlotId) {
  return `${bookingDay}::${timeSlotId}`;
}

export const FLIGHT_BLOCKS = [
  {
    id: "morning-flight",
    label: "Morning Flight: 09:00 AM – 12:00 PM",
    time: "09:00 AM – 12:00 PM",
  },
  {
    id: "afternoon-flight",
    label: "Afternoon Flight: 01:00 PM – 04:00 PM",
    time: "01:00 PM – 04:00 PM",
  },
];