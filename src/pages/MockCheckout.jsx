import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { USE_MOCK, SUBSCRIPTION_FEE } from "../config";
import { formatFee } from "../billing";
import { mockApi } from "../api/mock";
import { btnDark, btnPrimary, formError } from "../ui";

// Stand-in for PayChangu's hosted page. The real backend returns checkout.paychangu.com instead.
export default function MockCheckout() {
  const [params] = useSearchParams();
  const txRef = params.get("tx_ref") || "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish(status) {
    if (!USE_MOCK) return;
    setBusy(true);
    setError("");
    try {
      await mockApi.billing.settle(txRef, status);
      const path = status === "success" ? "/subscribe/callback" : "/subscribe/return";
      window.location.assign(`${path}?tx_ref=${encodeURIComponent(txRef)}&status=${status}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!USE_MOCK) {
    return (
      <div className="mx-auto grid max-w-[560px] gap-3 px-4 pb-14 pt-10">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Checkout lives on PayChangu</h1>
        <p className="text-xs text-slate-500">This page only stands in for their hosted checkout while demo mode is on.</p>
        <Link className={`${btnPrimary} w-fit mt-2`} to="/subscribe">Back to Subscribe</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-14 pt-10">
      <div className="mb-6">
        <span className="inline-flex rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-700">
          Demo Checkout Sandbox
        </span>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">PayChangu</h1>
        <p className="mt-1 text-xs text-slate-500">
          This stands in for the hosted PayChangu page. Real payments redirect to checkout.paychangu.com.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</p>
        <p className="mt-1 text-sm font-bold text-slate-800">lit subscription</p>
        <p className="mt-2 text-3xl font-black text-slate-900">{formatFee(SUBSCRIPTION_FEE.amount, SUBSCRIPTION_FEE.currency)}</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="break-all font-mono text-[0.72rem] text-slate-500">Reference: {txRef || "missing"}</p>
        </div>

        {error && <p className={formError} role="alert">{error}</p>}

        <div className="mt-6 grid gap-2.5">
          <button className={`${btnPrimary} w-full`} disabled={busy || !txRef} onClick={() => finish("success")}>
            {busy ? "Processing…" : "Simulate successful payment"}
          </button>
          <button className={`${btnDark} w-full`} disabled={busy || !txRef} onClick={() => finish("failed")}>
            Cancel and return
          </button>
        </div>
      </div>
    </div>
  );
}
