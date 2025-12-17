import React, { createContext, useContext, useEffect, useState } from "react";
import { apiMe, apiLogin, apiLogout, apiRegister } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiMe();
        if (me) setUser(me);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(username, password) {
    await apiLogin(username, password);
    const me = await apiMe();
    setUser(me);
  }

  async function register(username, password) {
    await apiRegister(username, password);
    await login(username, password);
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  const value = { user, loading, login, register, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
