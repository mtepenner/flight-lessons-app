import { describe, expect, it, vi } from "vitest";

vi.mock("../supabaseClient", () => ({
  isSupabaseConfigured: true,
  supabase: {},
}));

import { createAppServices } from "./appServices";

function createSupabaseDouble() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: "session-token",
            user: { id: "pilot-1" },
          },
        },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: "pilot-1" } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: "pilot-1" } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({
      data: [
        {
          booking_day: "Monday",
          time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
          is_available: true,
        },
      ],
      error: null,
    }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "booking-1",
              booking_day: "Monday",
              time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
              created_at: "2026-06-10T12:00:00.000Z",
            },
          ],
          error: null,
        }),
      })),
    })),
  };
}

describe("createAppServices", () => {
  it("wraps Supabase Auth and bookings queries", async () => {
    const supabaseClient = createSupabaseDouble();
    const services = createAppServices({ supabaseClient });

    await services.getSession();
    await services.listBookings();
    await services.listAvailability();
    await services.signIn({ email: "pilot@example.com", password: "pw" });
    await services.signUp({
      name: "Pilot",
      email: "pilot@example.com",
      password: "pw",
    });
    await services.signOut();

    expect(supabaseClient.auth.getSession).toHaveBeenCalled();
    expect(supabaseClient.from).toHaveBeenCalledWith("bookings");
    expect(supabaseClient.rpc).toHaveBeenCalledWith("list_available_slots");
    expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "pilot@example.com",
      password: "pw",
    });
    expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
      email: "pilot@example.com",
      password: "pw",
      options: {
        data: {
          full_name: "Pilot",
        },
      },
    });
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });

  it("books a slot by inserting directly into the bookings table", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "booking-2",
        booking_day: "Tuesday",
        time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
        created_at: "2026-06-10T12:00:00.000Z",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const services = createAppServices({
      supabaseClient: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                access_token: "session-token",
                user: { id: "pilot-1" },
              },
            },
            error: null,
          }),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
          signInWithPassword: vi.fn(),
          signOut: vi.fn(),
          signUp: vi.fn(),
        },
        rpc: vi.fn(),
        from,
      },
    });

    await services.createBooking({
      bookingDay: "Tuesday",
      userId: "pilot-1",
      timeSlotId: "Morning Flight: 09:00 AM – 12:00 PM",
    });

    expect(from).toHaveBeenCalledWith("bookings");
    expect(insert).toHaveBeenCalledWith({
      booking_day: "Tuesday",
      time_slot_id: "Morning Flight: 09:00 AM – 12:00 PM",
    });
    expect(select).toHaveBeenCalledWith("id, booking_day, time_slot_id, created_at");
    expect(single).toHaveBeenCalled();
  });

  it("cancels a booking by deleting the row from the bookings table", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteBooking = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteBooking });
    const services = createAppServices({
      supabaseClient: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                access_token: "session-token",
                user: { id: "pilot-1" },
              },
            },
            error: null,
          }),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
          signInWithPassword: vi.fn(),
          signOut: vi.fn(),
          signUp: vi.fn(),
        },
        rpc: vi.fn(),
        from,
      },
    });

    await services.cancelBooking({ bookingId: "booking-2" });

    expect(from).toHaveBeenCalledWith("bookings");
    expect(deleteBooking).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "booking-2");
  });

  it("calls the Netlify confirmation endpoint and returns the message only", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: "Cleared for takeoff, Pilot. Wheels up at 09:00 AM – 12:00 PM! ✈️",
      }),
    });
    const services = createAppServices({
      fetchImpl,
      supabaseClient: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                access_token: "session-token",
                user: { id: "pilot-1" },
              },
            },
            error: null,
          }),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
          signInWithPassword: vi.fn(),
          signOut: vi.fn(),
          signUp: vi.fn(),
        },
        rpc: vi.fn(),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn(),
          }),
        }),
      },
    });

    const message = await services.getConfirmation({
      day: "Wednesday",
      name: "Pilot",
      time: "09:00 AM – 12:00 PM",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("/.netlify/functions/get-confirmation");
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer session-token",
        "Content-Type": "application/json",
      },
    });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      day: "Wednesday",
      name: "Pilot",
      time: "09:00 AM – 12:00 PM",
    });
    expect(message).toBe(
      "Cleared for takeoff, Pilot. Wheels up at 09:00 AM – 12:00 PM! ✈️",
    );
  });

  it("fails confirmation generation when no signed-in session exists", async () => {
    const fakeSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      },
      rpc: vi.fn(),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn(),
        }),
      }),
    };
    const services = createAppServices({
      fetchImpl: vi.fn(),
      supabaseClient: fakeSupabase,
    });

    await expect(
      services.getConfirmation({
        day: "Wednesday",
        name: "Pilot",
        time: "09:00 AM – 12:00 PM",
      }),
    ).rejects.toThrow("You must be signed in to generate a confirmation message.");
  });
});