import { Link, useSearchParams } from "react-router-dom";
import { btnPrimary } from "../ui";

export default function SubscribeReturn() {
  const [params] = useSearchParams();
  const status = params.get("status") || "failed";

  return (
    <div className="mx-auto grid max-w-[560px] gap-4 px-4 pb-14 pt-10">
      <div className="grid justify-items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Payment cancelled</h1>
        <p className="text-xs text-slate-500">
          PayChangu sent you back
          {status ? ` (${status})` : ""}. Nothing was charged, and your subscription is unchanged.
        </p>
        <Link className={`${btnPrimary} w-fit mt-3`} to="/subscribe">Try again</Link>
      </div>
    </div>
  );
}
