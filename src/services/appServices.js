import { isSupabaseConfigured, supabase } from "../supabaseClient";

export function createAppServices({
  fetchImpl = globalThis.fetch,
  supabaseClient = supabase,
} = {}) {
  if (!isSupabaseConfigured || !supabaseClient) {
    return {
      isConfigured: false,
      getSession: async () => null,
      listBookings: async () => [],
      listAvailability: async () => [],
      onAuthStateChange: () => () => {},
      signIn: async () => {},
      signOut: async () => {},
      signUp: async () => {},
      createBooking: async () => {
        throw new Error("Supabase is not configured.");
      },
      cancelBooking: async () => {
        throw new Error("Supabase is not configured.");
      },
      fetchImpl,
    };
  }

  return {
    isConfigured: true,
    async getSession() {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        throw error;
      }

      return data.session;
    },
    async listBookings() {
      const { data, error } = await supabaseClient
        .from("bookings")
        .select("id, booking_day, time_slot_id, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    async listAvailability() {
      const { data, error } = await supabaseClient.rpc("list_available_slots");

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    async createBooking({ bookingDay, timeSlotId, userId }) {
      void userId;

      const { data, error } = await supabaseClient
        .from("bookings")
        .insert({
          booking_day: bookingDay,
          time_slot_id: timeSlotId,
        })
        .select("id, booking_day, time_slot_id, created_at")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    async cancelBooking({ bookingId }) {
      const { error } = await supabaseClient
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) {
        throw error;
      }
    },
    async getConfirmation({ name, day, time }) {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        throw error;
      }

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error("You must be signed in to generate a confirmation message.");
      }

      const response = await fetchImpl("/.netlify/functions/get-confirmation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, day, time }),
      });

      if (!response.ok) {
        throw new Error("We could not generate your confirmation message.");
      }

      const payload = await response.json();
      return payload.message;
    },
    onAuthStateChange(callback) {
      const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        callback(session);
      });

      return () => {
        data.subscription.unsubscribe();
      };
    },
    async signIn({ email, password }) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    async signOut() {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }
    },
    async signUp({ name, email, password }) {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
  };
}