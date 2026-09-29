import { useState } from "react";
import { Navigate } from "react-router-dom";
import { apiError } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@ylabs.local");
  const [password, setPassword] = useState("ylabs@2026");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "in") await login(email, password);
      else await register({ name, email, password });
    } catch (err) {
      setError(apiError(err, "Could not sign in"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <section className="login-copy">
        <p className="kicker">QuoteFlow</p>
        <h1>Quotes, GST invoices and payments in one ledger.</h1>
        <p className="muted" style={{ maxWidth: "36rem" }}>
          QuoteFlow by Y Labs — quotations with per-line GST, one-click conversion to invoices, payment tracking and PDF export.
        </p>
        <article className="sample-card">
          <div className="doc-head">
            <div>
              <p className="kicker">Quotation</p>
              <p className="display" style={{ fontSize: "1.6rem", margin: 0 }}>QT-2026-001</p>
            </div>
            <span className="badge accepted">accepted</span>
          </div>
          <p>Kaveri Textiles Pvt Ltd · Bengaluru</p>
          <p className="muted">Full-stack build, penetration test and an ML anomaly module.</p>
          <p><strong>₹3,30,400</strong></p>
        </article>
      </section>
      <section className="login-form">
        <form className="form" onSubmit={submit}>
          <h2 className="display" style={{ fontSize: "2.4rem", margin: 0 }}>
            {mode === "in" ? "Sign in" : "Join Y Labs"}
          </h2>
          <p className="muted">
            {mode === "in"
              ? "Use the sample desk, or register a staff login."
              : "New accounts join as staff and share the same ledger."}
          </p>
          {mode === "up" ? (
            <label>
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn full" type="submit" disabled={busy || loading}>
            {mode === "in" ? "Enter QuoteFlow" : "Create account"}
          </button>
          <button
            className="linkish"
            type="button"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setError("");
            }}
          >
            {mode === "in" ? "Need a staff login? Register" : "Already on the roll? Sign in"}
          </button>
          <p className="hint">Demo login · admin@ylabs.local · ylabs@2026</p>
        </form>
      </section>
    </main>
  );
}
