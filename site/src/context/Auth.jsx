import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { staffAccounts } from '../data/content.js';

const AuthContext = createContext(null);
const KEY = 'ipfsbk.session.v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage indisponible */
    }
  }, [user]);

  const login = useCallback(({ email, password, profile }) => {
    const clean = email.trim().toLowerCase();
    if (profile === 'personnel') {
      const found = staffAccounts.find(
        (a) => a.email === clean && a.password === password
      );
      if (!found) {
        return { ok: false, error: 'Identifiants personnel invalides. Vérifiez l’e-mail et le mot de passe.' };
      }
      setUser({
        nom: found.nom,
        role: found.role,
        initiales: found.initiales,
        email: found.email,
        profile: 'personnel',
        connectedAt: new Date().toISOString(),
      });
      return { ok: true, profile: 'personnel' };
    }

    if (!clean || password.length < 4) {
      return { ok: false, error: 'Renseignez un e-mail valide et un mot de passe de 4 caractères minimum.' };
    }
    setUser({
      nom: clean
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      role: profile === 'parent' ? 'Parent d’élève' : 'Étudiant IPFS-BK',
      initiales: clean.slice(0, 2).toUpperCase(),
      email: clean,
      profile,
      connectedAt: new Date().toISOString(),
    });
    return { ok: true, profile };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
