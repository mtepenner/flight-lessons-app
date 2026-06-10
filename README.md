# Flight Lessons Booking App 🛩️

## About
This project is a full-stack scheduling and booking application built for the GoMobile Technical Assessment. The application is themed around booking a "3-hour flight lesson" block. It allows aspiring pilots to securely authenticate, view available pre-packaged flight blocks (e.g., Morning Flight, Afternoon Flight), and book a slot. 

The application is built with a focus on robust data security, database-level concurrency (to prevent double-booking), and secure AI integration. 

## Technology Stack
* **Frontend:** React (Bootstrapped with Vite)
* **Backend / Database:** Supabase (Postgres, Auth, Row Level Security)
* **Hosting / CI/CD:** Netlify
* **AI Integration:** Claude API via Netlify Serverless Functions

---

## 🎯 Major Milestones (Implementation Plan)

*Note: The project is currently in the planning step. The following phases outline the implementation strategy.*

### Phase 1: Plumbing & Configuration
- [ ] Initialize a React app using Vite.
- [ ] Configure `netlify.toml` to ensure the application is correctly built and deployed to Netlify from the GitHub repository.
- [ ] Generate a `.env.example` template for straightforward local setup.
- [ ] Configure Netlify environment variables securely, ensuring sensitive keys (like the Claude API key) never ship to the client bundle.

### Phase 2: Auth & Data Modeling (The Core Trap)
- [ ] Implement customer authentication using Supabase Auth.
- [ ] Set up a `bookings` table to link users to predefined 3-hour flight slots.
- [ ] **Concurrency Control:** Add a `UNIQUE` constraint on the `time_slot_id` column to prevent double-booking directly at the database level.
- [ ] Enable clean, verified **Row Level Security (RLS)** on all tables holding customer data.
- [ ] Write a policy (e.g., `(auth.uid() = user_id)`) to ensure a customer can only read and write their own flight bookings.

### Phase 3: Core Booking Flow
- [ ] Build a frontend view displaying available flight blocks.
- [ ] Implement the booking action. If two users attempt to book the exact same slot simultaneously, the Supabase Postgres database will reject the second transaction with a constraint violation.
- [ ] Catch the constraint violation error gracefully in the React frontend and display a polite toast notification (e.g., *"Oops! Someone just snatched this slot. Please pick another."*).

### Phase 4: Serverless AI Integration (Claude API)
- [ ] Create a Netlify Serverless Function (`/.netlify/functions/get-confirmation`) to act as a secure middleman.
- [ ] Store the `CLAUDE_API_KEY` exclusively on the server-side environment.
- [ ] Trigger the function upon a successful booking to dynamically generate a personalized, friendly 2-sentence confirmation text message using a pilot persona and an emoji.
- [ ] Display the AI-generated confirmation message on the user's dashboard.

---

## 🏗️ Architecture & Tradeoffs

To deliver a high-quality application within the tight 3-4 hour sprint window, ruthless scoping was necessary. 

* **Fixed Flight Blocks vs. Flexible Calendar:** I chose to offer strictly pre-defined "Flight Blocks" (e.g., Morning: 9 AM - 12 PM) rather than allowing users to pick a custom start time. This tradeoff eliminated complex variable duration and time-zone overlap logic, allowing me to rely entirely on robust database-level constraints.
* **Time Zones:** I skipped complex time zone logic and assumed all slots are in UTC to save time, focusing instead on core database concurrency.

## 🔒 How Double-Booking is Prevented

If we relied on the frontend to check if a slot was open before booking, a race condition would occur. Instead, I let Postgres handle the heavy lifting. By treating an entire 3-hour flight block as a single, indivisible ID, I placed a **`UNIQUE` constraint** on the `time_slot_id` column in the `bookings` table. If two users click "Book" at the exact same millisecond, the database inherently accepts the first transaction and rejects the second, making double-booking impossible.

## 🚀 Next Steps (What I Knowingly Skipped)
Given more time, I would build out the following "stretch" features:
1.  **Email Reminders:** Implement a scheduled function to trigger a 24-hour reminder email via Resend or SendGrid.
2.  **Live Slot Updates:** Implement Supabase Realtime to instantly gray out a taken flight slot on everyone else's screen without requiring a page refresh.
3.  **Admin View:** Create a secure, protected route using the Supabase `service_role` key to bypass RLS and allow an administrator to view and manage all bookings.
4.  **Rescheduling & Pagination:** Add robust UI support for editing existing bookings and paginating through past flight history.

---

## 🛠️ Getting Started

*(Placeholder for instructions on how to run the app locally, install dependencies, and setup the `.env` variables)*

**Test Credentials:**
* **Email:** `testpilot@example.com`
* **Password:** `password123`

## *LLM Models Utilized for AI Development*
* Gemini 3.1 Pro --> Used extensively for Brainstorming and Planning prior to beginning the 3-4 hour code development process.  Prompts for GitHub Copilot were drafted using this AI model to reduce the risk of AI hallucinations
