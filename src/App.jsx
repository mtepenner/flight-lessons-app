import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Toast from "./components/Toast";
import {
  DUPLICATE_SLOT_ERROR_CODE,
  DUPLICATE_SLOT_MESSAGE,
} from "./constants";
import { createAppServices } from "./services/appServices";

const phaseItems = [
  "Phase 1 is complete: Vite, Netlify, and environment scaffolding are in place.",
  "Phase 2 is complete: Supabase Auth, bookings schema, and row-level security are wired.",
  "Phase 3 is complete: fixed flight blocks book directly into the database with duplicate-slot toast handling.",
  "Phase 4 is complete: a Netlify function keeps the Claude API key server-side and returns the confirmation text only.",
];

const defaultServices = createAppServices();

function App({ services = defaultServices }) {
  const [session, setSession] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(services.isConfigured);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!services.isConfigured) {
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;

    const hydrate = async () => {
      try {
        const nextSession = await services.getSession();

        if (!isActive) {
          return;
        }

        setSession(nextSession);
        setDashboardError("");

        if (nextSession) {
          const nextBookings = await services.listBookings();

          if (!isActive) {
            return;
          }

          setBookings(nextBookings);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDashboardError(error.message || "We could not connect to Supabase.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    const unsubscribe = services.onAuthStateChange(async (nextSession) => {
      if (!isActive) {
        return;
      }

      setSession(nextSession);
      setAuthError("");
      setConfirmationMessage("");
      setDashboardError("");
      setToastMessage("");

      if (!nextSession) {
        setBookings([]);
        return;
      }

      try {
        const nextBookings = await services.listBookings();

        if (isActive) {
          setBookings(nextBookings);
        }
      } catch (error) {
        if (isActive) {
          setDashboardError(error.message || "We could not load your bookings.");
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [services]);

  const handleSignIn = async ({ email, password }) => {
    try {
      setAuthError("");
      setAuthNotice("");
      await services.signIn({ email, password });
    } catch (error) {
      setAuthError(error.message || "We could not sign you in.");
    }
  };

  const handleSignUp = async ({ name, email, password }) => {
    try {
      setAuthError("");
      await services.signUp({ name, email, password });
      setAuthNotice(
        "Account created. If your Supabase project requires email confirmation, confirm your inbox before signing in.",
      );
    } catch (error) {
      setAuthError(error.message || "We could not create your account.");
    }
  };

  const handleSignOut = async () => {
    try {
      await services.signOut();
      setBookings([]);
      setAuthNotice("");
      setConfirmationMessage("");
      setToastMessage("");
    } catch (error) {
      setDashboardError(error.message || "We could not sign you out.");
    }
  };

  const handleBookFlight = async (flightBlock) => {
    if (!session?.user) {
      return;
    }

    try {
      setBookingSlotId(flightBlock.id);
      setDashboardError("");
      setToastMessage("");

      const createdBooking = await services.createBooking({
        userId: session.user.id,
        timeSlotId: flightBlock.label,
      });

      setBookings((currentBookings) => [createdBooking, ...currentBookings]);

      try {
        const nextConfirmation = await services.getConfirmation({
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Pilot",
          time: flightBlock.time,
        });

        setConfirmationMessage(nextConfirmation);
      } catch (error) {
        setDashboardError(
          error.message ||
            "Your flight was booked, but we could not generate the confirmation.",
        );
      }
    } catch (error) {
      if (error.code === DUPLICATE_SLOT_ERROR_CODE) {
        setToastMessage(DUPLICATE_SLOT_MESSAGE);
        return;
      }

      setDashboardError(error.message || "We could not complete your booking.");
    } finally {
      setBookingSlotId("");
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">GoMobile technical assessment</p>
          <h1>Flight lesson booking, secured at the database layer.</h1>
        </div>
        <p className="intro-copy">
          This React app uses Supabase Auth plus a single RLS-protected bookings
          table so customers only ever read or write their own reservations.
        </p>
        <section className="card-grid" aria-label="Implementation phases">
          {phaseItems.map((item) => (
            <article key={item} className="phase-card">
              <p>{item}</p>
            </article>
          ))}
        </section>
      </section>

      {!services.isConfigured ? (
        <section className="content-panel">
          <h2>Configuration needed</h2>
          <p>
            Add <strong>VITE_SUPABASE_URL</strong> and
            <strong> VITE_SUPABASE_ANON_KEY</strong> to your local environment or
            Netlify site settings. Keep <strong>CLAUDE_API_KEY</strong> server-side
            only.
          </p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="content-panel">
          <p>Connecting to your booking workspace...</p>
        </section>
      ) : null}

      {!isLoading && services.isConfigured && !session ? (
        <Auth
          errorMessage={authError}
          noticeMessage={authNotice}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      ) : null}

      {!isLoading && session ? (
        <Dashboard
          bookingSlotId={bookingSlotId}
          bookings={bookings}
          confirmationMessage={confirmationMessage}
          errorMessage={dashboardError}
          onBookFlight={handleBookFlight}
          onSignOut={handleSignOut}
          user={session.user}
        />
      ) : null}

      <Toast message={toastMessage} onDismiss={() => setToastMessage("")} />
    </main>
  );
}

export default App;