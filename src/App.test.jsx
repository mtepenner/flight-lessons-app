import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { DUPLICATE_SLOT_MESSAGE } from "./constants";

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
    listBookings: vi.fn().mockResolvedValue([]),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    createBooking: vi.fn().mockResolvedValue({
      id: "booking-1",
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

    const morningCard = (await screen.findByText(
      "Morning Flight: 09:00 AM – 12:00 PM",
    )).closest("article");

    expect(morningCard).not.toBeNull();

    await user.click(within(morningCard).getByRole("button", { name: "Book" }));

    expect(createBooking).toHaveBeenCalledWith({
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
          time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
          created_at: "2026-06-10T12:00:00.000Z",
        },
      ]);
    const getConfirmation = vi
      .fn()
      .mockResolvedValue(
        "Cleared for takeoff, Pilot Test. See you at 09:00 AM – 12:00 PM! ✈️",
      );
    const services = createServices({
      getConfirmation,
      listBookings,
    });
    const user = userEvent.setup();

    render(<App services={services} />);

    const morningCard = (await screen.findByText(
      "Morning Flight: 09:00 AM – 12:00 PM",
    )).closest("article");

    expect(morningCard).not.toBeNull();

    await user.click(within(morningCard).getByRole("button", { name: "Book" }));

    expect(getConfirmation).toHaveBeenCalledWith({
      name: "Pilot Test",
      time: "09:00 AM – 12:00 PM",
    });
    expect(
      await screen.findByText(
        "Cleared for takeoff, Pilot Test. See you at 09:00 AM – 12:00 PM! ✈️",
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

    const morningCard = (await screen.findByText(
      "Morning Flight: 09:00 AM – 12:00 PM",
    )).closest("article");

    expect(morningCard).not.toBeNull();

    await user.click(within(morningCard).getByRole("button", { name: "Book" }));

    expect(
      await screen.findByText("We could not generate your confirmation message."),
    ).toBeInTheDocument();
    const bookingsCard = screen.getByRole("heading", { name: "Your bookings" }).closest("article");

    expect(bookingsCard).not.toBeNull();
    expect(
      within(bookingsCard).getByText("Morning Flight: 09:00 AM – 12:00 PM"),
    ).toBeInTheDocument();
  });
});