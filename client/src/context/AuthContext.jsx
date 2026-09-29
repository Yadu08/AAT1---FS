import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("qf_token"));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("qf_token")));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let live = true;
    api
      .get("/auth/me")
      .then((res) => {
        if (live) setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem("qf_token");
        if (live) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("qf_token", data.token);
        setToken(data.token);
        setUser(data.user);
      },
      async register(payload) {
        const { data } = await api.post("/auth/register", payload);
        localStorage.setItem("qf_token", data.token);
        setToken(data.token);
        setUser(data.user);
      },
      logout() {
        localStorage.removeItem("qf_token");
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
