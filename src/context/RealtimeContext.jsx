import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { connectRealtime } from "../realtime/connect";

const Ctx = createContext(null);
export const useRealtime = () => useContext(Ctx);

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState("offline"); // offline | connecting | online
  const listeners = useRef(new Set());

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const conn = connectRealtime({
      userId: user.id,
      onEvent: (ev) => listeners.current.forEach((fn) => fn(ev)),
      onStatus: setStatus,
    });
    return () => {
      conn.close();
      setStatus("offline");
    };
  }, [user?.id]);

  const value = useMemo(() => ({ status, subscribe }), [status, subscribe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
