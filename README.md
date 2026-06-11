# Flight Lessons Booking App

## Overview
This project is a React booking app for fixed 3-hour introductory flight lessons. It uses Supabase Auth for customer sign-in, a single RLS-protected `bookings` table for persistence, and a Netlify serverless function to generate a friendly Claude-powered confirmation after a successful reservation.

## Completed Phases
### Phase 1: Plumbing and configuration
- Vite React app scaffolded in the repo root.
- `netlify.toml` configured for static build output and Netlify functions.
- `.env.example` added for local Supabase and server-side Claude configuration.

### Phase 2: Auth and data modeling
- Supabase client wired with browser-safe anon credentials only.
- `supabase/schema.sql` creates a single `bookings` table.
- `time_slot_id` is protected with a `UNIQUE` constraint to prevent double-booking.
- Row Level Security is enabled and policies use `auth.uid() = user_id` for reads and inserts.

### Phase 3: Core booking flow
- The UI exposes exactly two fixed lesson blocks:
  - `Morning Flight: 09:00 AM – 12:00 PM`
  - `Afternoon Flight: 01:00 PM – 04:00 PM`
- Booking inserts go directly to Supabase without a client-side availability pre-check.
- Postgres unique violations are caught in the frontend and shown as:
  - `Oops! Someone just snatched this slot. Please pick another.`

### Phase 4: Serverless AI integration
- `netlify/functions/get-confirmation.js` reads `CLAUDE_API_KEY` from `process.env`.
- The frontend calls the function only after a successful booking.
- The dashboard displays the generated confirmation text and keeps the booking visible even if the AI step fails.

## Project Structure
```text
flight-lessons-app/
├── netlify/
│   └── functions/
│       ├── get-confirmation.js
│       └── get-confirmation.test.js
├── src/
│   ├── components/
│   ├── services/
│   ├── test/
│   ├── App.jsx
│   ├── constants.js
│   ├── index.css
│   ├── main.jsx
│   └── supabaseClient.js
├── supabase/
│   └── schema.sql
├── .env.example
├── netlify.toml
├── package.json
└── README.md
```

## Local Setup
1. Install dependencies:
	```bash
	npm install
	```
2. Copy the values from `.env.example` into a local `.env` file and provide:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
	- `SUPABASE_URL`
	- `SUPABASE_ANON_KEY`
	- `CLAUDE_API_KEY`
3. Apply `supabase/schema.sql` to your Supabase project.
4. Start the frontend locally:
	```bash
	npm run dev
	```
5. For end-to-end testing of the Netlify function locally, run through Netlify rather than plain Vite:
	```bash
	npx netlify-cli dev
	```

## Validation
Run the unit and integration tests:

```bash
npm test
```

Build the production bundle:

```bash
npm run build
```

## Architecture Notes
- Fixed lesson blocks were chosen instead of a free-form calendar so the booking model can stay simple and concurrency-safe.
- The browser uses only the Supabase anon key.
- The Claude API key never appears in client code and is only read by the Netlify function.
- The Netlify function now requires a valid Supabase bearer token before it will call Claude.
- The database derives `user_id` from `auth.uid()` and rejects any slot outside the two allowed flight blocks.

## How Double-Booking Is Prevented
Double-booking is blocked at the database layer. The app inserts directly into the `bookings` table, and Postgres rejects any second insert that reuses the same `time_slot_id` because of the `UNIQUE` constraint. The frontend then catches that specific constraint violation and shows the user a polite retry message.

## Security Controls
- `CLAUDE_API_KEY` stays server-side only inside the Netlify function.
- The confirmation endpoint requires a valid Supabase access token.
- Response bodies do not leak upstream Claude headers or secret values.
- Netlify response headers set a CSP, disable framing, and reduce referrer and browser capability exposure.
- RLS protects reads and inserts, and no update or delete policies are granted.

## Future Stretch Work
1. Add live slot updates with Supabase Realtime.
2. Add an admin view for staff-managed bookings.
3. Add reminder email delivery.
4. Add rescheduling and booking history pagination.
