import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { setAuthLostHandler, tokenStore } from "../api/http";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setAuthLostHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    let alive = true;
    if (!tokenStore.get()) {
      setBooting(false);
      return;
    }
    api.me
      .get()
      .then((u) => alive && setUser(u))
      .catch((e) => {
        if (e.status === 401) tokenStore.set(null);
      })
      .finally(() => alive && setBooting(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await api.auth.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const u = await api.auth.register(payload);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, booting, login, register, logout, setUser }),
    [user, booting, login, register, logout]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
