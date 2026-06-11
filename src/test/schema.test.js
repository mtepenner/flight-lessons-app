import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = resolve(process.cwd(), "supabase", "schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");

describe("supabase schema", () => {
  it("creates the bookings table with a composite unique key for weekday plus time", () => {
    expect(schemaSql).toMatch(/create table if not exists public\.bookings/i);
    expect(schemaSql).toMatch(/booking_day text not null/i);
    expect(schemaSql).toMatch(/constraint bookings_booking_day_time_slot_id_key unique \(booking_day, time_slot_id\)/i);
  });

  it("enables row level security and scopes policies to auth.uid", () => {
    expect(schemaSql).toMatch(/alter table public\.bookings enable row level security/i);
    expect(schemaSql).toMatch(/using \(auth\.uid\(\) = user_id\)/i);
    expect(schemaSql).toMatch(/with check \(auth\.uid\(\) = user_id\)/i);
    expect(schemaSql).toMatch(/for delete\s+using \(auth\.uid\(\) = user_id\)/i);
  });

  it("derives the booking user from auth.uid and restricts weekdays and slot values", () => {
    expect(schemaSql).toMatch(/user_id uuid not null default auth\.uid\(\)/i);
    expect(schemaSql).toMatch(/Monday/);
    expect(schemaSql).toMatch(/Friday/);
    expect(schemaSql).toMatch(/Morning Flight: 09:00 AM – 12:00 PM/);
    expect(schemaSql).toMatch(/Afternoon Flight: 01:00 PM – 04:00 PM/);
    expect(schemaSql).toMatch(/create or replace function public\.list_available_slots\(\)/i);
    expect(schemaSql).toMatch(/grant execute on function public\.list_available_slots\(\) to authenticated/i);
    expect(schemaSql).toMatch(/constraint bookings_time_slot_id_check check/i);
  });
});