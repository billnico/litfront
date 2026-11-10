import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import { USE_MOCK } from "../config";
import { btnBlock, btnPrimary, formError, note } from "../ui";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState(USE_MOCK ? "demo@lit.mw" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      nav(loc.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see who's around."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      {USE_MOCK && (
        <p className={note}>Demo mode: log in as <b>demo@lit.mw</b> with any password, or create an account.</p>
      )}
      <form onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className={formError} role="alert">{error}</p>}
        <button className={`${btnPrimary} ${btnBlock}`} disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
    </AuthShell>
  );
}
