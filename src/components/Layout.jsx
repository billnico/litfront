import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInbox } from "../context/InboxContext";
import { useRealtime } from "../context/RealtimeContext";
import { useUniversities } from "../hooks/useUniversities";
import { isSubscribed } from "../billing";
import Avatar from "./Avatar";
import Icon from "./Icon";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Discover", icon: "discover", end: true },
  { to: "/matches", label: "Matches", icon: "heart" },
  { to: "/messages", label: "Messages", icon: "message", badge: true },
  { to: "/profile", label: "Profile", icon: "user" },
];

const navLink =
  "flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-300 no-underline transition-all duration-200 hover:bg-slate-800/80 hover:text-white max-[720px]:flex-1 max-[720px]:flex-col max-[720px]:justify-center max-[720px]:gap-0.5 max-[720px]:rounded-xl max-[720px]:px-1 max-[720px]:py-1 max-[720px]:text-[0.68rem]";

function Nav({ className, onNavigate, items = links }) {
  const { unreadTotal } = useInbox();
  return (
    <nav className={className} aria-label="Main">
      {items.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `${navLink} ${
              isActive
                ? "bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] text-white shadow-md shadow-rose-500/25 !text-white"
                : ""
            }`
          }
        >
          <span className="relative inline-flex">
            <Icon name={l.icon} size={17} />
            {l.badge && unreadTotal > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-white px-1 text-[0.62rem] font-black text-rose-600 shadow-sm">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            )}
          </span>
          <span>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadTotal } = useInbox();
  const { status } = useRealtime();
  const { label } = useUniversities();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const subscribed = isSubscribed(user);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const realtimeLabel = { online: "Live", connecting: "Connecting…", offline: "Offline" }[status];
  const dot =
    status === "online"
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
      : status === "connecting"
        ? "animate-spin border-2 border-amber-400 border-t-transparent bg-transparent motion-reduce:animate-none"
        : "bg-slate-500";

  // Clean navigation items without comments or technical routes
  const allNavItems = [
    { to: "/", label: "Discover", icon: "discover", badge: !subscribed ? "Subscribers only" : null },
    { to: "/matches", label: "Matches", icon: "heart" },
    { to: "/messages", label: "Messages", icon: "message", unread: unreadTotal },
    { to: "/subscribe", label: "Subscribe", icon: "card", status: subscribed ? "Active" : "MWK 500" },
    { to: "/profile", label: "My Profile", icon: "user" },
  ];

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    nav("/login", { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/70">
      <header className="sticky top-0 z-20 h-16 border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md text-white shadow-sm">
        <div className="mx-auto flex h-full max-w-[1050px] items-center gap-4 px-4">
          <Logo />

          <Nav className="ml-auto hidden gap-1 min-[820px]:flex" />

          <div className="ml-auto flex items-center gap-2.5 min-[820px]:ml-0">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-300"
              title="Centrifugo Realtime WebSocket connection"
            >
              <i className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="hidden sm:inline">{realtimeLabel}</span>
            </span>

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors shadow-xs"
              aria-label="Navigation Menu"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" size={17} />
              <span>Menu</span>
              {unreadTotal > 0 && (
                <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-[#ff4458] px-1 text-[0.6rem] font-black text-white">
                  {unreadTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over / Modal Navigation Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}
        >
          <div className="relative flex h-full w-full max-w-[340px] flex-col overflow-y-auto bg-slate-900 p-6 text-white shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close navigation menu"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* User Profile summary card */}
            {user && (
              <div className="my-5 rounded-2xl border border-slate-800 bg-slate-800/60 p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={user} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{user.display_name}</p>
                    <p className="truncate text-[0.7rem] text-slate-400">{user.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[0.62rem] font-bold text-rose-300">
                        {label(user.university, true)}
                      </span>
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[0.62rem] font-bold text-slate-300">
                        {user.gender === "female" ? "Female" : "Male"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-700/60 pt-2 text-[0.72rem]">
                  <span className="text-slate-400">Subscription:</span>
                  <span
                    className={`font-bold ${
                      subscribed ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {subscribed ? "Subscribed" : "Free / Inactive"}
                  </span>
                </div>
              </div>
            )}

            {/* Clean Navigation List without comments */}
            <div className="flex-1">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                Menu
              </p>
              <ul className="grid gap-1.5">
                {allNavItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-800 text-slate-400 group-hover:bg-[#ff4458] group-hover:text-white transition-colors">
                        <Icon name={item.icon} size={16} />
                      </span>
                      <span className="flex-1 font-bold text-slate-200 group-hover:text-white">
                        {item.label}
                      </span>
                      {item.unread > 0 && (
                        <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-[#ff4458] px-1 text-[0.6rem] font-black text-white">
                          {item.unread}
                        </span>
                      )}
                      {item.badge && (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.6rem] font-medium text-slate-400">
                          {item.badge}
                        </span>
                      )}
                      {item.status && (
                        <span className={`text-[0.68rem] font-bold ${subscribed ? "text-emerald-400" : "text-[#ff4458]"}`}>
                          {item.status}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-900/60 bg-red-950/40 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/50 transition-colors"
              >
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1050px] flex-1 max-[720px]:pb-[72px]">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <Nav
        items={links}
        className="fixed bottom-0 left-0 right-0 z-20 flex h-[66px] border-t border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-2 py-1.5 min-[820px]:hidden shadow-lg"
      />
    </div>
  );
}
