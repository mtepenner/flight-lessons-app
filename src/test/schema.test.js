import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = resolve(process.cwd(), "supabase", "schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");

describe("supabase schema", () => {
  it("creates the bookings table with a unique time_slot_id", () => {
    expect(schemaSql).toMatch(/create table if not exists public\.bookings/i);
    expect(schemaSql).toMatch(/time_slot_id text not null unique/i);
  });

  it("enables row level security and scopes policies to auth.uid", () => {
    expect(schemaSql).toMatch(/alter table public\.bookings enable row level security/i);
    expect(schemaSql).toMatch(/using \(auth\.uid\(\) = user_id\)/i);
    expect(schemaSql).toMatch(/with check \(auth\.uid\(\) = user_id\)/i);
  });

  it("derives the booking user from auth.uid and restricts slot values", () => {
    expect(schemaSql).toMatch(/user_id uuid not null default auth\.uid\(\)/i);
    expect(schemaSql).toMatch(/Morning Flight: 09:00 AM – 12:00 PM/);
    expect(schemaSql).toMatch(/Afternoon Flight: 01:00 PM – 04:00 PM/);
    expect(schemaSql).toMatch(/constraint bookings_time_slot_id_check check/i);
  });
});