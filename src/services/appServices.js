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
      onAuthStateChange: () => () => {},
      signIn: async () => {},
      signOut: async () => {},
      signUp: async () => {},
      createBooking: async () => {
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
        .select("id, time_slot_id, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    async createBooking({ timeSlotId, userId }) {
      void userId;

      const { data, error } = await supabaseClient
        .from("bookings")
        .insert({
          time_slot_id: timeSlotId,
        })
        .select("id, time_slot_id, created_at")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    async getConfirmation({ name, time }) {
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
        body: JSON.stringify({ name, time }),
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