import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FlightBlocks from "./FlightBlocks";
import { BOOKING_DAYS, createBookingSlotKey, FLIGHT_BLOCKS } from "../constants";

function createAvailability(overrides = []) {
  return BOOKING_DAYS.flatMap((bookingDay) =>
    FLIGHT_BLOCKS.map((flightBlock) => {
      const override = overrides.find(
        (entry) =>
          entry.booking_day === bookingDay && entry.time_slot_id === flightBlock.label,
      );

      return {
        booking_day: bookingDay,
        time_slot_id: flightBlock.label,
        is_available: override?.is_available ?? true,
      };
    }),
  );
}

describe("FlightBlocks", () => {
  it("renders Monday through Friday slots and forwards the chosen booking selection", async () => {
    const onBook = vi.fn();
    const user = userEvent.setup();

    render(
      <FlightBlocks
        availability={createAvailability()}
        bookedSlots={new Set()}
        bookingSlotId=""
        onBook={onBook}
      />,
    );

    const mondayMorningCard = screen
      .getByText("Monday - Morning Flight: 09:00 AM – 12:00 PM")
      .closest("article");

    expect(screen.getByText("Friday - Afternoon Flight: 01:00 PM – 04:00 PM")).toBeInTheDocument();
    expect(mondayMorningCard).not.toBeNull();

    await user.click(within(mondayMorningCard).getByRole("button", { name: "Book" }));

    expect(onBook).toHaveBeenCalledWith({
      id: createBookingSlotKey("Monday", "Morning Flight: 09:00 AM – 12:00 PM"),
      bookingDay: "Monday",
      label: "Morning Flight: 09:00 AM – 12:00 PM",
      time: "09:00 AM – 12:00 PM",
    });
  });

  it("marks taken slots as unavailable", () => {
    render(
      <FlightBlocks
        availability={createAvailability([
          {
            booking_day: "Tuesday",
            time_slot_id: "Afternoon Flight: 01:00 PM – 04:00 PM",
            is_available: false,
          },
        ])}
        bookedSlots={new Set()}
        bookingSlotId=""
        onBook={vi.fn()}
      />,
    );

    const tuesdayAfternoonCard = screen
      .getByText("Tuesday - Afternoon Flight: 01:00 PM – 04:00 PM")
      .closest("article");

    expect(tuesdayAfternoonCard).not.toBeNull();
    expect(
      within(tuesdayAfternoonCard).getByRole("button", { name: "Unavailable" }),
    ).toBeDisabled();
    expect(
      within(tuesdayAfternoonCard).getByText(
        "Already taken. Pick another weekday block.",
      ),
    ).toBeInTheDocument();
  });
});