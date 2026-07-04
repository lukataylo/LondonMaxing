// Email-only magic-link login. No name, no password, no modal — a clean inline
// two-step screen (enter email -> link sent -> open). For the demo there is no
// mail server, so "Open the link" stands in for clicking the emailed link.
import { useState } from "react";
import type { User } from "../auth";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function Login({
  onAuthed,
  onBack,
}: {
  onAuthed: (user: User) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const valid = isEmail(email);

  function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (valid) setSent(true);
  }

  if (sent) {
    return (
      <main className="screen login">
        <div className="screen-card login-card glass-panel">
          <span className="login-crest" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6.5h18v11H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="m3.5 7 8.5 6.2L20.5 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </span>
          <h1>Check your inbox</h1>
          <p>
            We sent a magic link to <strong>{email.trim()}</strong>. Tap it to start exploring.
          </p>
          <button className="primary-button login-cta" type="button" onClick={() => onAuthed({ email: email.trim() })}>
            Open the link →
          </button>
          <button
            className="login-fineprint"
            type="button"
            onClick={() => setSent(false)}
            style={{ background: "none", border: 0, cursor: "pointer" }}
          >
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen login">
      <form className="screen-card login-card glass-panel" onSubmit={sendLink}>
        <button className="icon-button screen-back" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="login-crest" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="currentColor" />
            <circle cx="12" cy="10" r="2.6" fill="#ece8dc" />
          </svg>
        </span>
        <h1>Sign in to Old Haunts</h1>
        <p>Enter your email and we'll send a magic link — no password, no profile.</p>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button className="primary-button login-cta" type="submit" disabled={!valid}>
          Send magic link
        </button>
        <p className="login-fineprint">Just your email — that's it.</p>
      </form>
    </main>
  );
}
