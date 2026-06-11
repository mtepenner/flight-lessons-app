create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  booking_day text not null,
  time_slot_id text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.bookings
  add column if not exists booking_day text;

update public.bookings
set booking_day = 'Monday'
where booking_day is null;

alter table public.bookings
  alter column user_id set default auth.uid(),
  alter column booking_day set not null,
  alter column time_slot_id set not null,
  alter column created_at set default timezone('utc', now());

alter table public.bookings
  drop constraint if exists bookings_time_slot_id_key,
  drop constraint if exists bookings_booking_day_check,
  drop constraint if exists bookings_time_slot_id_check,
  drop constraint if exists bookings_booking_day_time_slot_id_key;

alter table public.bookings
  add constraint bookings_booking_day_check check (
    booking_day in (
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday'
    )
  ),
  add constraint bookings_time_slot_id_check check (
    time_slot_id in (
      'Morning Flight: 09:00 AM – 12:00 PM',
      'Afternoon Flight: 01:00 PM – 04:00 PM'
    )
  ),
  add constraint bookings_booking_day_time_slot_id_key unique (booking_day, time_slot_id);

alter table public.bookings enable row level security;
alter table public.bookings force row level security;

drop policy if exists "Users can read their own bookings" on public.bookings;
create policy "Users can read their own bookings"
on public.bookings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own bookings" on public.bookings;
create policy "Users can insert their own bookings"
on public.bookings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own bookings" on public.bookings;
create policy "Users can delete their own bookings"
on public.bookings
for delete
using (auth.uid() = user_id);

create or replace function public.list_available_slots()
returns table (
  booking_day text,
  time_slot_id text,
  is_available boolean
)
language sql
security definer
set search_path = public
as $$
  with weekdays (booking_day, weekday_order) as (
    values
      ('Monday', 1),
      ('Tuesday', 2),
      ('Wednesday', 3),
      ('Thursday', 4),
      ('Friday', 5)
  ),
  time_slots (time_slot_id, time_slot_order) as (
    values
      ('Morning Flight: 09:00 AM – 12:00 PM', 1),
      ('Afternoon Flight: 01:00 PM – 04:00 PM', 2)
  )
  select
    weekdays.booking_day,
    time_slots.time_slot_id,
    not exists (
      select 1
      from public.bookings
      where bookings.booking_day = weekdays.booking_day
        and bookings.time_slot_id = time_slots.time_slot_id
    ) as is_available
  from weekdays
  cross join time_slots
  order by weekdays.weekday_order, time_slots.time_slot_order;
$$;

revoke all on function public.list_available_slots() from public;
grant execute on function public.list_available_slots() to authenticated;