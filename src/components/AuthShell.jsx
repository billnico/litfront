import Logo from "./Logo";
import Icon from "./Icon";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 min-[861px]:grid-cols-[minmax(340px,5fr)_7fr] bg-slate-50/70">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,rgba(255,68,88,0.35),transparent_65%),radial-gradient(circle_at_80%_80%,rgba(244,63,94,0.15),transparent_50%)] p-12 text-white min-[861px]:flex">
        <Logo />
        <div>
          <h2 className="max-w-[14em] text-[clamp(2rem,3.2vw,2.75rem)] font-extrabold leading-tight tracking-tight text-white">
            Meet someone from your campus, or the one next door.
          </h2>
          <p className="mt-4 max-w-[28em] text-sm leading-relaxed text-slate-300">
            lit is modern dating for Malawi's universities and colleges. Verified campuses, real students.
          </p>
          <ul className="mt-8 grid gap-3.5">
            <li className="flex items-center gap-3 text-sm font-medium text-slate-200">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-rose-500/20 text-rose-400">
                <Icon name="cap" size={16} />
              </span>
              Every profile lists an institution
            </li>
            <li className="flex items-center gap-3 text-sm font-medium text-slate-200">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-rose-500/20 text-rose-400">
                <Icon name="chat" size={16} />
              </span>
              Instant real-time messaging
            </li>
            <li className="flex items-center gap-3 text-sm font-medium text-slate-200">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-rose-500/20 text-rose-400">
                <Icon name="heart" size={16} />
              </span>
              18+ verified students &amp; young adults
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">© lit — All rights reserved.</p>
      </aside>
      <section className="grid place-items-start justify-center overflow-y-auto bg-white px-6 pb-10 pt-8 shadow-sm min-[861px]:place-items-center min-[861px]:py-10">
        <div className="w-full max-w-[480px]">
          <div className="mb-6 min-[861px]:hidden">
            <Logo onDark={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mb-6 mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          {children}
          {footer && <p className="mt-6 text-center text-xs text-slate-500 [&_a]:font-bold [&_a]:text-[#ff4458] [&_a]:hover:underline">{footer}</p>}
        </div>
      </section>
    </div>
  );
}
