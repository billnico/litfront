import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";
import { useRealtime } from "./RealtimeContext";

const Ctx = createContext(null);
export const useInbox = () => useContext(Ctx);

const activity = (m) => new Date(m.last_message?.created_at ?? m.created_at).getTime();
const sortMatches = (list) => [...list].sort((a, b) => activity(b) - activity(a));

export function InboxProvider({ children }) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const activeRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const refresh = useCallback(async () => {
    try {
      const r = await api.matches.list();
      setMatches(sortMatches(r.items));
    } catch {
      /* keep what we have */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      setLoaded(false);
      refresh();
    } else {
      setMatches([]);
      setLoaded(false);
    }
  }, [user?.id, refresh]);

  // Idempotent: safe to call for the realtime echo and for the REST response of the same message.
  const applyMessage = useCallback((matchId, message, { incoming = false } = {}) => {
    setMatches((prev) => {
      const i = prev.findIndex((m) => m.id === matchId);
      if (i < 0) return prev;
      const m = prev[i];
      const mine = message.sender_id === userRef.current?.id;
      const dup = m.last_message?.id === message.id;
      const bump = incoming && !mine && !dup && activeRef.current !== matchId ? 1 : 0;
      const updated = { ...m, last_message: message, unread_count: (m.unread_count || 0) + bump };
      return sortMatches([updated, ...prev.filter((_, k) => k !== i)]);
    });
  }, []);

  useEffect(
    () =>
      subscribe((ev) => {
        switch (ev.type) {
          case "message.new":
            if (!matchesRef.current.some((m) => m.id === ev.match_id)) refresh();
            else applyMessage(ev.match_id, ev.message, { incoming: true });
            break;
          case "match.new":
          case "match.removed":
          case "resync":
            refresh();
            break;
          default:
        }
      }),
    [subscribe, applyMessage, refresh]
  );

  const setActive = useCallback((id) => {
    activeRef.current = id;
  }, []);
  const clearUnread = useCallback((id) => {
    setMatches((prev) => prev.map((m) => (m.id === id && m.unread_count ? { ...m, unread_count: 0 } : m)));
  }, []);
  const remove = useCallback((id) => setMatches((prev) => prev.filter((m) => m.id !== id)), []);

  const unreadTotal = useMemo(() => matches.reduce((n, m) => n + (m.unread_count || 0), 0), [matches]);

  const value = useMemo(
    () => ({ matches, loaded, unreadTotal, refresh, applyMessage, setActive, clearUnread, remove }),
    [matches, loaded, unreadTotal, refresh, applyMessage, setActive, clearUnread, remove]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
