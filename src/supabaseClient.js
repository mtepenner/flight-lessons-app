import { createClient } from "@supabase/supabase-js";

// Vite injects these at build time so Netlify can use either VITE_* or SUPABASE_* names.
const supabaseUrl = __APP_SUPABASE_URL__;
const supabaseAnonKey = __APP_SUPABASE_ANON_KEY__;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;