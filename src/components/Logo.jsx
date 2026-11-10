import Icon from "./Icon";

export default function Logo({ onDark = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-xl font-black tracking-tight ${onDark ? "text-white" : "text-slate-900"}`}>
      <span className="grid h-[32px] w-[32px] place-items-center rounded-xl bg-gradient-to-tr from-[#ff4458] to-[#ff7b54] text-white shadow-md shadow-rose-500/30">
        <Icon name="heart" size={17} style={{ fill: "currentColor" }} />
      </span>
      <span>lit</span>
    </span>
  );
}
