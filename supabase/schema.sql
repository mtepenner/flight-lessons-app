create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  time_slot_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  constraint bookings_time_slot_id_check check (
    time_slot_id in (
      'Morning Flight: 09:00 AM – 12:00 PM',
      'Afternoon Flight: 01:00 PM – 04:00 PM'
    )
  )
);

alter table public.bookings enable row level security;
alter table public.bookings force row level security;

create policy "Users can read their own bookings"
on public.bookings
for select
using (auth.uid() = user_id);

create policy "Users can insert their own bookings"
on public.bookings
for insert
with check (auth.uid() = user_id);