import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  BOOKING_DAYS,
  DUPLICATE_SLOT_MESSAGE,
  FLIGHT_BLOCKS,
  MISSING_BOOKINGS_TABLE_MESSAGE,
} from "./constants";

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

function createServices(overrides = {}) {
  return {
    isConfigured: true,
    getSession: vi.fn().mockResolvedValue({
      user: {
        email: "pilot@example.com",
        id: "pilot-1",
        user_metadata: {
          full_name: "Pilot Test",
        },
      },
    }),
    listAvailability: vi.fn().mockResolvedValue(createAvailability()),
    listBookings: vi.fn().mockResolvedValue([]),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    cancelBooking: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    createBooking: vi.fn().mockResolvedValue({
      id: "booking-1",
      booking_day: "Monday",
      time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
      created_at: "2026-06-10T12:00:00.000Z",
    }),
    ...overrides,
  };
}

describe("App", () => {
  it("shows the duplicate-slot toast when the booking insert hits a unique constraint", async () => {
    const createBooking = vi.fn().mockRejectedValue({ code: "23505" });
    const services = createServices({
      createBooking,
      getConfirmation: vi.fn(),
    });
    const user = userEvent.setup();

    render(<App services={services} />);

    const mondayMorningCard = (await screen.findByText(
      "Monday - Morning Flight: 09:00 AM – 12:00 PM",
    )).closest("article");

    expect(mondayMorningCard).not.toBeNull();

    await user.click(within(mondayMorningCard).getByRole("button", { name: "Book" }));

    expect(createBooking).toHaveBeenCalledWith({
      bookingDay: "Monday",
      userId: "pilot-1",
      timeSlotId: "Morning Flight: 09:00 AM – 12:00 PM",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      DUPLICATE_SLOT_MESSAGE,
    );
  });

  it("shows the AI confirmation after a successful booking", async () => {
    const listBookings = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "booking-1",
          booking_day: "Monday",
          time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
          created_at: "2026-06-10T12:00:00.000Z",
        },
      ]);
    const getConfirmation = vi
      .fn()
      .mockResolvedValue(
        "Cleared for takeoff, Pilot Test. See you Monday at 09:00 AM – 12:00 PM! ✈️",
      );
    const services = createServices({
      getConfirmation,
      listBookings,
    });
    const user = userEvent.setup();

    render(<App services={services} />);

    const mondayMorningCard = (await screen.findByText(
      "Monday - Morning Flight: 09:00 AM – 12:00 PM",
    )).closest("article");

    expect(mondayMorningCard).not.toBeNull();

    await user.click(within(mondayMorningCard).getByRole("button", { name: "Book" }));

    expect(getConfirmation).toHaveBeenCalledWith({
      day: "Monday",
      name: "Pilot Test",
      time: "09:00 AM – 12:00 PM",
    });
    expect(
      await screen.findByText(
        "Cleared for takeoff, Pilot Test. See you Monday at 09:00 AM – 12:00 PM! ✈️",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the booking visible when confirmation generation fails", async () => {
    const getConfirmation = vi
      .fn()
      .mockRejectedValue(new Error("We could not generate your confirmation message."));
    const services = createServices({ getConfirmation });
    const user = userEvent.setup();

    render(<App services={services} />);

    const mondayMorningCard = (await screen.findByText(
      "Monday - Morning Flight: 09:00 AM – 12:00 PM",
    )).closest("article");

    expect(mondayMorningCard).not.toBeNull();

    await user.click(within(mondayMorningCard).getByRole("button", { name: "Book" }));

    expect(
      await screen.findByText("We could not generate your confirmation message."),
    ).toBeInTheDocument();
    const bookingsCard = screen.getByRole("heading", { name: "Your bookings" }).closest("article");

    expect(bookingsCard).not.toBeNull();
    expect(
      within(bookingsCard).getByText("Monday - Morning Flight: 09:00 AM – 12:00 PM"),
    ).toBeInTheDocument();
  });

  it("allows the user to cancel an existing booking", async () => {
    const cancelBooking = vi.fn().mockResolvedValue(undefined);
    const services = createServices({
      cancelBooking,
      listAvailability: vi.fn().mockResolvedValue(
        createAvailability([
          {
            booking_day: "Monday",
            time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
            is_available: false,
          },
        ]),
      ),
      listBookings: vi.fn().mockResolvedValue([
        {
          id: "booking-1",
          booking_day: "Monday",
          time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
          created_at: "2026-06-10T12:00:00.000Z",
        },
      ]),
    });
    const user = userEvent.setup();

    render(<App services={services} />);

    const bookingsCard = (await screen.findByRole("heading", {
      name: "Your bookings",
    })).closest("article");

    expect(bookingsCard).not.toBeNull();

    await user.click(within(bookingsCard).getByRole("button", { name: "Cancel" }));

    expect(cancelBooking).toHaveBeenCalledWith({ bookingId: "booking-1" });
    expect(
      await within(bookingsCard).findByText(
        "No bookings yet. Book any open weekday block to reserve your intro lesson.",
      ),
    ).toBeInTheDocument();
  });

  it("shows setup guidance when the bookings table is missing in Supabase", async () => {
    const services = createServices({
      listBookings: vi.fn().mockRejectedValue({
        code: "PGRST205",
        message: "Could not find the table 'public.bookings' in the schema cache",
      }),
    });

    render(<App services={services} />);

    expect(
      await screen.findByText(MISSING_BOOKINGS_TABLE_MESSAGE),
    ).toBeInTheDocument();
  });
});