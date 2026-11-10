import { useState } from "react";
import { Link } from "react-router-dom";
import { useInbox } from "../context/InboxContext";
import { useUniversities } from "../hooks/useUniversities";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import { timeShort } from "../utils";
import { btnPrimary, control } from "../ui";

export default function Messages() {
  const { matches, loaded, unreadTotal } = useInbox();
  const { label } = useUniversities();
  const [search, setSearch] = useState("");

  if (!loaded) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner />
      </div>
    );
  }

  // Filter conversations that have at least one message or are matches ready to chat
  const fresh = matches.filter((m) => !m.last_message);
  const chats = matches.filter((m) => m.last_message);

  const filteredChats = chats.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatch = m.user.display_name.toLowerCase().includes(q);
    const uniMatch = label(m.user.university).toLowerCase().includes(q);
    const textMatch = m.last_message?.text?.toLowerCase().includes(q);
    return nameMatch || uniMatch || textMatch;
  });

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-14 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Messages</h1>
            {unreadTotal > 0 && (
              <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] px-2 text-xs font-black text-white shadow-sm">
                {unreadTotal}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">Your direct messages and real-time conversations</p>
        </div>
        <Link to="/matches" className="text-xs font-bold text-[#ff4458] hover:underline">
          View all matches →
        </Link>
      </div>

      {/* Quick Match Bubbles to start a Direct Message */}
      {fresh.length > 0 && (
        <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            Start a Direct Message ({fresh.length} new)
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {fresh.map((m) => (
              <Link
                key={m.id}
                to={`/chat/${m.id}`}
                className="group grid justify-items-center gap-1.5 text-xs font-bold text-slate-700 no-underline"
                title={`Start direct message with ${m.user.display_name}`}
              >
                <div className="relative">
                  <Avatar
                    user={m.user}
                    size={64}
                    className="ring-2 ring-rose-500 ring-offset-2 transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-tr from-[#ff4458] to-[#ff7b54] text-white shadow-xs">
                    <Icon name="chat" size={12} />
                  </span>
                </div>
                <span className="max-w-[72px] truncate">{m.user.display_name.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search Filter */}
      {chats.length > 3 && (
        <div className="mb-4">
          <label htmlFor="search-messages" className="sr-only">Search messages</label>
          <input
            id="search-messages"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, campus, or message…"
            className={`${control} !rounded-2xl !py-2.5 text-xs`}
          />
        </div>
      )}

      {/* Active Direct Message Conversations */}
      {filteredChats.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            Direct Messages ({filteredChats.length})
          </h2>
          <ul className="grid gap-2.5">
            {filteredChats.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/chat/${m.id}`}
                  className={`flex items-center gap-3.5 rounded-2xl border bg-white px-4 py-3.5 text-slate-800 no-underline transition-all duration-200 hover:border-rose-300 hover:bg-rose-50/20 hover:shadow-md ${
                    m.unread_count ? "border-rose-300/90 shadow-sm" : "border-slate-200/80 shadow-sm"
                  }`}
                >
                  <Avatar user={m.user} size={54} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <strong className="truncate text-sm font-bold text-slate-900">{m.user.display_name}</strong>
                      <time className="shrink-0 text-[0.72rem] font-medium text-slate-400">
                        {timeShort(m.last_message.created_at)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.75rem] font-bold text-[#ff4458]">{label(m.user.university, true)}</span>
                      <span className="text-[0.7rem] text-slate-400 font-medium">• Direct Message</span>
                    </div>
                    <p className={`mt-1 truncate text-xs ${m.unread_count ? "font-bold text-slate-900" : "text-slate-500"}`}>
                      {m.last_message.text}
                    </p>
                  </div>
                  {m.unread_count > 0 && (
                    <span className="grid h-[20px] min-w-[20px] place-items-center rounded-full bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] px-1.5 text-[0.68rem] font-black text-white shadow-sm">
                      {m.unread_count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : chats.length > 0 && search.trim() ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-xs text-slate-500">No conversations matched "{search}"</p>
          <button className="mt-2 text-xs font-bold text-[#ff4458] underline" onClick={() => setSearch("")}>
            Clear search
          </button>
        </div>
      ) : fresh.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-rose-500 shadow-inner">
            <Icon name="message" size={32} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-800">No direct messages yet</h2>
          <p className="mx-auto mt-2 max-w-xs text-xs text-slate-500">
            When you and another student like each other, you'll be able to send direct messages here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/" className={btnPrimary}>
              Discover Profiles
            </Link>
            <Link to="/matches" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View Matches
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
