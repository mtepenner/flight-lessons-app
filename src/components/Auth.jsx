import { useState } from "react";

function Auth({ errorMessage, noticeMessage, onSignIn, onSignUp }) {
  const [mode, setMode] = useState("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("testpilot@example.com");
  const [password, setPassword] = useState("password123");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === "sign-in") {
      await onSignIn({ email, password });
      return;
    }

    await onSignUp({ name, email, password });
  };

  return (
    <section className="auth-layout">
      <div className="auth-grid">
        <article className="stack-card">
          <p className="eyebrow">Phase 2</p>
          <h2>Authenticate with Supabase</h2>
          <p className="muted-text">
            Customers sign in with Supabase Auth. The browser only receives the
            public anon key; sensitive keys stay server-side.
          </p>

          <div className="auth-mode-toggle" role="tablist" aria-label="Auth mode">
            <button
              type="button"
              className={`ghost-button ${mode === "sign-in" ? "active" : ""}`}
              onClick={() => setMode("sign-in")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`ghost-button ${mode === "sign-up" ? "active" : ""}`}
              onClick={() => setMode("sign-up")}
            >
              Create account
            </button>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <div className="field-group">
                <label htmlFor="name">Pilot name</label>
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Amelia Earhart"
                />
              </div>
            ) : null}

            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button className="primary-button" type="submit">
              {mode === "sign-in" ? "Enter the hangar" : "Create pilot account"}
            </button>
          </form>

          {errorMessage ? <p className="status-text error">{errorMessage}</p> : null}
          {noticeMessage ? <p className="status-text notice">{noticeMessage}</p> : null}
        </article>

        <article className="stack-card">
          <h3>Security checklist</h3>
          <ul className="booking-list">
            <li>Single bookings table linked directly to auth.users.</li>
            <li>UNIQUE constraint on time_slot_id prevents double-booking.</li>
            <li>RLS policy uses auth.uid() = user_id for reads and inserts.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default Auth;