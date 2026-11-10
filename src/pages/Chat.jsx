import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useInbox } from "../context/InboxContext";
import { useRealtime } from "../context/RealtimeContext";
import { useUniversities } from "../hooks/useUniversities";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { timeShort, uid } from "../utils";
import Spinner from "../components/Spinner";
import { btnBlock, btnDark, btnGhost, btnPrimary, control, formError } from "../ui";

const REASONS = [
  ["harassment", "Harassment or abuse"],
  ["fake_profile", "Fake profile or scam"],
  ["inappropriate_content", "Inappropriate content"],
  ["underage", "Seems under 18"],
  ["spam", "Spam"],
  ["other", "Something else"],
];

function ReportModal({ match, onClose }) {
  const [reason, setReason] = useState("harassment");
  const [details, setDetails] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      await api.safety.report({ user_id: match.user.id, match_id: match.id, reason, details: details.trim() });
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  return (
    <Modal title="Report" onClose={onClose}>
      {state === "done" ? (
        <div className="grid gap-2 text-center py-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Thanks for telling us</h2>
          <p className="text-xs text-slate-500">We'll review your report. You can also block or unmatch from the menu.</p>
          <button className={`${btnDark} ${btnBlock}`} onClick={onClose}>Close</button>
        </div>
      ) : (
        <form className="grid gap-3" onSubmit={submit}>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Report {match.user.display_name}</h2>
          <div>
            <label htmlFor="reason" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Reason</label>
            <select id="reason" className={control} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="details" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Details (optional)</label>
            <textarea id="details" className={`${control} resize-y`} rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          {error && <p className={formError} role="alert">{error}</p>}
          <button className={`${btnPrimary} ${btnBlock}`} disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send report"}</button>
        </form>
      )}
    </Modal>
  );
}

export default function Chat() {
  const { matchId: paramMatchId } = useParams();
  const { user } = useAuth();
  const inbox = useInbox();
  const { subscribe } = useRealtime();
  const { label } = useUniversities();
  const nav = useNavigate();

  // If no matchId is provided in URL, fallback to the first active conversation or match
  const matchId = paramMatchId || inbox.matches[0]?.id;
  const match = inbox.matches.find((m) => m.id === matchId);

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [reporting, setReporting] = useState(false);

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const stick = useRef(true);
  const menuRef = useRef(null);

  // Insert or merge a message. Matching is by server id OR client_id so the optimistic
  // copy, the REST response and the realtime echo all collapse into one bubble.
  const upsert = useCallback((msg) => {
    setMessages((prev) => {
      const i = prev.findIndex((m) => (msg.id && m.id === msg.id) || (msg.client_id && m.client_id === msg.client_id));
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], ...msg, status: msg.status, error: msg.error };
        return copy;
      }
      return [...prev, msg];
    });
  }, []);

  const loadLatest = useCallback(async () => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const r = await api.matches.messages(matchId, { limit: 30 });
      setMessages((prev) => {
        const pending = prev.filter((m) => m.status && !r.items.some((x) => x.client_id && x.client_id === m.client_id));
        return [...r.items, ...pending];
      });
      setHasMore(r.has_more);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    stick.current = true;
    loadLatest();
  }, [matchId, loadLatest]);

  // Live delivery: web app sends texts to backend via REST and receives texts through
  // WebSocket from Centrifugo over the single connection.
  useEffect(
    () =>
      subscribe((ev) => {
        if (ev.type === "message.new" && ev.match_id === matchId) upsert(ev.message);
        if (ev.type === "resync") loadLatest();
      }),
    [subscribe, matchId, upsert, loadLatest]
  );

  // Tell the inbox which direct message chat is open so it doesn't count unread for it.
  useEffect(() => {
    if (!matchId) return;
    inbox.setActive(matchId);
    inbox.clearUnread(matchId);
    return () => inbox.setActive(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const lastIncomingId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id !== user.id && messages[i].id) return messages[i].id;
    }
    return null;
  }, [messages, user.id]);

  useEffect(() => {
    if (!lastIncomingId || !matchId) return;
    inbox.clearUnread(matchId);
    api.matches.markRead(matchId, lastIncomingId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastIncomingId, matchId]);

  useLayoutEffect(() => {
    if (stick.current) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, loading]);

  function onScroll() {
    const el = listRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function loadOlder() {
    const first = messages.find((m) => m.id);
    if (!first || loadingOlder || !matchId) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el.scrollHeight;
    try {
      const r = await api.matches.messages(matchId, { before: first.id, limit: 30 });
      stick.current = false;
      setMessages((prev) => [...r.items, ...prev]);
      setHasMore(r.has_more);
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  // Sending text: passes text and all data to backend via REST; incoming echoes and recipient delivery
  // arrive via WebSocket through the single Centrifugo connection.
  async function send(retry) {
    const body = (retry?.text ?? text).trim();
    if (!body || !matchId) return;
    const client_id = retry?.client_id ?? uid();
    if (!retry) setText("");
    stick.current = true;
    upsert({ id: null, client_id, match_id: matchId, sender_id: user.id, text: body, created_at: new Date().toISOString(), status: "sending" });
    try {
      const saved = await api.matches.send(matchId, { client_id, text: body });
      upsert(saved);
      inbox.applyMessage(matchId, saved);
    } catch (e) {
      upsert({ client_id, status: "failed", error: e.message });
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function unmatch() {
    menuRef.current?.removeAttribute("open");
    if (!window.confirm(`Unmatch ${match.user.display_name}? This deletes the conversation.`)) return;
    try {
      await api.matches.unmatch(matchId);
      inbox.remove(matchId);
      nav("/messages", { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }

  async function block() {
    menuRef.current?.removeAttribute("open");
    if (!window.confirm(`Block ${match.user.display_name}? You won't see each other again.`)) return;
    try {
      await api.safety.block(match.user.id);
      inbox.remove(matchId);
      nav("/messages", { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }

  if (!match) {
    return (
      <div className="mx-auto max-w-[560px] px-4 pb-14 pt-8">
        <div className="grid justify-items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-card">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-rose-500 shadow-inner">
            <Icon name="chat" size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {inbox.loaded ? "No direct message selected" : "Loading direct message…"}
          </h2>
          <p className="max-w-xs text-xs text-slate-500">
            {inbox.loaded
              ? "Select a conversation from the Messages tab or start chatting with one of your matches."
              : "Connecting to secure chat…"}
          </p>
          {inbox.loaded && (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link className={btnPrimary} to="/messages">Open Messages</Link>
              <Link className={btnGhost} to="/matches">View Matches</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[760px] flex-col border-x border-slate-200/80 bg-white max-[720px]:h-[calc(100dvh-4rem-64px)] max-[720px]:border-0 shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <Link to="/messages" className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors" aria-label="Back to messages">
          <Icon name="back" size={18} />
        </Link>
        <Avatar user={match.user} size={42} />
        <div className="grid min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <strong className="truncate text-sm font-bold text-slate-900">{match.user.display_name}</strong>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[0.65rem] font-bold text-[#ff4458]">
              Direct Message
            </span>
          </div>
          <span className="truncate text-xs font-semibold text-[#ff4458]">{label(match.user.university, true)}</span>
        </div>
        <details className="relative" ref={menuRef}>
          <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors [&::-webkit-details-marker]:hidden" aria-label="More options">
            <Icon name="dots" size={18} />
          </summary>
          <div className="absolute right-0 top-11 z-[15] min-w-[160px] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl">
            <button className="block w-full border-0 bg-white px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => { menuRef.current?.removeAttribute("open"); setReporting(true); }}>Report</button>
            <button className="block w-full border-0 bg-white px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={unmatch}>Unmatch</button>
            <button className="block w-full border-0 bg-white px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors" onClick={block}>Block</button>
          </div>
        </details>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5" ref={listRef} onScroll={onScroll}>
        {loading ? (
          <div className="grid place-items-center py-16"><Spinner /></div>
        ) : (
          <>
            {hasMore && (
              <button className={`${btnGhost} mx-auto mb-4 flex px-4 py-2 text-xs`} onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? "Loading…" : "Load earlier messages"}
              </button>
            )}
            {messages.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-xs font-semibold text-slate-400">Direct Message with {match.user.display_name.split(" ")[0]}.</p>
                <p className="mt-1 text-[0.7rem] text-slate-400">Say hi to break the ice!</p>
              </div>
            )}
            <ul className="grid gap-2.5">
              {messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <li key={m.id ?? m.client_id} className={`flex max-w-[85%] flex-col min-[721px]:max-w-[75%] ${mine ? "ml-auto items-end self-end" : "items-start"}`}>
                    <div
                      className={`whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed ${
                        mine
                          ? "rounded-2xl rounded-br-xs bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] text-white shadow-sm"
                          : "rounded-2xl rounded-bl-xs border border-slate-200/80 bg-white text-slate-800 shadow-sm"
                      } ${m.status === "sending" ? "opacity-60" : ""} ${m.status === "failed" ? "!bg-red-600 text-white" : ""}`}
                    >
                      {m.text}
                    </div>
                    <div className="mt-1 px-1 text-[0.68rem] text-slate-400 font-medium">
                      {m.status === "failed" ? (
                        <button className="border-0 bg-transparent p-0 text-red-500 underline" onClick={() => send(m)}>Not sent. Tap to retry</button>
                      ) : m.status === "sending" ? (
                        "Sending…"
                      ) : (
                        timeShort(m.created_at)
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {error && <p className={formError} role="alert">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form className="flex items-end gap-2.5 border-t border-slate-200/80 bg-white px-4 py-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <label htmlFor="msg" className="sr-only">Direct Message</label>
        <textarea
          id="msg"
          rows={1}
          value={text}
          maxLength={2000}
          placeholder="Send a direct message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          className={`${control} max-h-[120px] resize-none !rounded-2xl px-4 py-2.5 text-sm [field-sizing:content]`}
        />
        <button
          className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] text-white shadow-md shadow-rose-500/25 transition-all hover:enabled:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:opacity-40 disabled:shadow-none"
          disabled={!text.trim()}
          aria-label="Send direct message"
        >
          <Icon name="send" size={17} />
        </button>
      </form>

      {reporting && <ReportModal match={match} onClose={() => setReporting(false)} />}
    </div>
  );
}
