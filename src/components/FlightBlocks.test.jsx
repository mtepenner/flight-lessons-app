import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FlightBlocks from "./FlightBlocks";

describe("FlightBlocks", () => {
  it("renders the two hardcoded booking blocks and forwards the chosen slot", async () => {
    const onBook = vi.fn();
    const user = userEvent.setup();

    render(
      <FlightBlocks bookedSlots={new Set()} bookingSlotId="" onBook={onBook} />,
    );

    const morningCard = screen
      .getByText("Morning Flight: 09:00 AM – 12:00 PM")
      .closest("article");

    expect(screen.getByText("Afternoon Flight: 01:00 PM – 04:00 PM")).toBeInTheDocument();
    expect(morningCard).not.toBeNull();

    await user.click(within(morningCard).getByRole("button", { name: "Book" }));

    expect(onBook).toHaveBeenCalledWith({
      id: "morning-flight",
      label: "Morning Flight: 09:00 AM – 12:00 PM",
      time: "09:00 AM – 12:00 PM",
    });
  });
});