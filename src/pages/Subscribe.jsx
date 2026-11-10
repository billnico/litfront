import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { SUBSCRIPTION_FEE } from "../config";
import { formatFee, isSubscribed } from "../billing";
import Icon from "../components/Icon";
import { btnPrimary, formError, note } from "../ui";

export default function Subscribe() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = isSubscribed(user);
  const ends = user.subscription?.current_period_end;

  async function start() {
    setBusy(true);
    setError("");
    try {
      const session = await api.billing.checkout();
      window.location.assign(session.checkout_url);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[560px] px-4 pb-14 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Subscribe to lit</h1>
        <p className="mt-1.5 text-xs text-slate-500">Pay with PayChangu. Cards and mobile money are handled on their checkout page.</p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-rose-50/20 p-7 shadow-card">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff4458]">
            Premium Access
          </span>
          <span className="text-xs font-medium text-slate-400">
            {SUBSCRIPTION_FEE.periodDays} days access
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight text-slate-900">{formatFee()}</span>
          <span className="text-xs font-semibold text-slate-500">/ period</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Fixed rate, charged once per period in MWK.</p>

        <div className="my-6 border-t border-slate-100" />

        <ul className="grid gap-3 text-xs font-medium text-slate-700">
          <li className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-50 text-xs font-black text-[#ff4458]">✓</span>
            Discover students across all Malawi campuses
          </li>
          <li className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-50 text-xs font-black text-[#ff4458]">✓</span>
            Unlimited real-time messaging with your matches
          </li>
          <li className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-50 text-xs font-black text-[#ff4458]">✓</span>
            No hidden charges, transparent PayChangu processing
          </li>
        </ul>

        {active ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-medium text-emerald-800 leading-relaxed shadow-xs flex items-center gap-2.5" role="status">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white font-bold text-xs">✓</span>
            <span>You're subscribed until <b>{new Date(ends).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</b>.</span>
          </div>
        ) : (
          <div className="mt-6">
            {error && <p className={formError} role="alert">{error}</p>}
            <button className={`${btnPrimary} w-full`} disabled={busy} onClick={start}>
              {busy ? "Opening checkout…" : `Pay ${formatFee()} with PayChangu`}
            </button>
            <p className="mt-3 text-center text-[0.72rem] text-slate-400">
              You will be redirected to PayChangu's secure gateway.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
