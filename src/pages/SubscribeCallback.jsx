import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatFee, isSubscribed } from "../billing";
import Spinner from "../components/Spinner";
import { btnPrimary, formError, note } from "../ui";

export default function SubscribeCallback() {
  const [params] = useSearchParams();
  const { user, setUser } = useAuth();
  const txRef = params.get("tx_ref") || "";
  const [state, setState] = useState(txRef ? "checking" : "missing");
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!txRef) return;
    let alive = true;
    api.billing
      .verify(txRef)
      .then((res) => {
        if (!alive) return;
        setPayment(res.payment);
        if (res.subscription) setUser({ ...user, subscription: res.subscription });
        setState(res.payment?.status === "success" ? "success" : res.payment?.status || "pending");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setState("error");
      });
    return () => {
      alive = false;
    };
    // user is only needed to merge the verified subscription onto the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef]);

  return (
    <div className="mx-auto grid max-w-[560px] gap-4 px-4 pb-14 pt-10">
      {state === "checking" && (
        <div className="grid justify-items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-card">
          <Spinner label="Checking payment" />
          <p className="text-xs font-semibold text-slate-500">Confirming your PayChangu payment…</p>
        </div>
      )}

      {state === "success" && (
        <div className="grid justify-items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-black">
            ✓
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">You're subscribed!</h1>
          <p className="text-xs text-slate-600">
            {formatFee(payment?.amount, payment?.currency)} received
            {isSubscribed({ subscription: user?.subscription }) && user.subscription.current_period_end
              ? ` through ${new Date(user.subscription.current_period_end).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`
              : ""}
            .
          </p>
          <Link className={`${btnPrimary} w-fit mt-3`} to="/">Back to discover</Link>
        </div>
      )}

      {state === "missing" && (
        <div className="grid justify-items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">No payment to confirm</h1>
          <p className="text-xs text-slate-500">PayChangu didn't send a transaction reference. Start checkout again from Subscribe.</p>
          <Link className={`${btnPrimary} w-fit mt-3`} to="/subscribe">Go to Subscribe</Link>
        </div>
      )}

      {(state === "pending" || state === "failed") && (
        <div className="grid justify-items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Payment not confirmed</h1>
          <p className="text-xs text-slate-500">
            {state === "pending"
              ? "PayChangu still has this payment as pending. If you finished paying, wait a moment and try again."
              : "This payment didn't go through."}
          </p>
          <Link className={`${btnPrimary} w-fit mt-3`} to="/subscribe">Back to Subscribe</Link>
        </div>
      )}

      {state === "error" && (
        <div className="grid justify-items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Couldn't verify payment</h1>
          <p className={formError} role="alert">{error}</p>
          <button className={`${btnPrimary} w-fit mt-3`} onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}
    </div>
  );
}
