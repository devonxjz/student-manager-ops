import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, UNAUTHORIZED_EVENT } from '@/lib/api';

const AuthContext = createContext(null);

/** Chấp nhận cả `{ user }` lẫn user trần, và profile lồng (`user.profile`) hoặc phẳng (`user.fullName`). */
function normalizeUser(res) {
  const u = res?.user ?? res;
  if (!u) return null;
  if (u.profile) return u;
  const { fullName, email, teacherId, studentId, classId, ...rest } = u;
  return { ...rest, profile: { fullName, email, teacherId, studentId, classId } };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(normalizeUser(await api('/auth/me', { redirectOn401: false })));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const me = normalizeUser(await api('/auth/login', { method: 'POST', body: { username, password }, redirectOn401: false }));
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST', redirectOn401: false }); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
