import { createClient } from "@supabase/supabase-js";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-3-5-haiku-latest";
const ALLOWED_TIMES = new Set(["09:00 AM – 12:00 PM", "01:00 PM – 04:00 PM"]);

function buildHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
  };
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  };
}

function buildPrompt(name, time) {
  return `Write a short, fun, 2-sentence text message confirming an appointment for ${name} for an introductory flight lesson at ${time}. Use a friendly pilot tone and one emoji.`;
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireAuthenticatedUser(event) {
  const authorization = event.headers?.authorization ?? event.headers?.Authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return { error: jsonResponse(401, { error: "Authentication required." }) };
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return { error: jsonResponse(401, { error: "Authentication required." }) };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: jsonResponse(401, { error: "Invalid authentication token." }) };
  }

  return { user: data.user };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  if (!process.env.CLAUDE_API_KEY) {
    return jsonResponse(500, { error: "CLAUDE_API_KEY is not configured." });
  }

  let authenticated;

  try {
    authenticated = await requireAuthenticatedUser(event);
  } catch {
    return jsonResponse(500, { error: "Supabase authentication is not configured." });
  }

  if (authenticated.error) {
    return authenticated.error;
  }

  let payload;

  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const { name, time } = payload;

  if (!name || !time) {
    return jsonResponse(400, { error: "name and time are required." });
  }

  if (typeof name !== "string" || typeof time !== "string") {
    return jsonResponse(400, { error: "name and time must be strings." });
  }

  if (name.length > 120) {
    return jsonResponse(400, { error: "name is too long." });
  }

  if (!ALLOWED_TIMES.has(time)) {
    return jsonResponse(400, { error: "Invalid flight time." });
  }

  const verifiedName =
    authenticated.user.user_metadata?.full_name ||
    authenticated.user.email?.split("@")[0] ||
    name;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": process.env.CLAUDE_API_KEY,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 120,
      messages: [
        {
          role: "user",
          content: buildPrompt(verifiedName, time),
        },
      ],
    }),
  });

  if (!response.ok) {
    return jsonResponse(502, { error: "Confirmation service unavailable." });
  }

  const result = await response.json();
  const message = result.content?.find((entry) => entry.type === "text")?.text?.trim();

  if (!message) {
    return jsonResponse(502, { error: "Confirmation service returned no text." });
  }

  return jsonResponse(200, { message });
}