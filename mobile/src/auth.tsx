/** Contexte d'authentification : session, démarrage via /me, connexion, déconnexion. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, clearToken, getToken, saveToken, setUnauthorizedHandler } from './api';
import type { Role, User } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  direction: 'Direction',
  secretariat: 'Secrétariat',
  comptable: 'Comptabilité',
  enseignant: 'Enseignant',
  parent: 'Parent',
};

const STAFF_ROLES: Role[] = ['direction', 'secretariat', 'comptable', 'enseignant'];

export function isStaff(role?: Role | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

interface AuthContextValue {
  user: User | null;
  /** true une fois la session restaurée (ou la déconnexion constatée). */
  ready: boolean;
  signingIn: boolean;
  error: string | null;
  signIn(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  clearError(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    const token = await getToken();
    if (token) {
      // Journalisation best-effort : même si le réseau échoue, on nettoie la session locale.
      await api.post('/logout').catch(() => undefined);
    }
    await clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Jeton révoqué ou expiré : retour écran de connexion sans dupliquer les appels.
      setUser(null);
      clearToken();
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getToken();
      if (!token) {
        if (!cancelled) setReady(true);

        return;
      }
      try {
        const me = await api.get<{ user: User }>('/me');
        if (!cancelled) {
          setUser(me.user);
          setReady(true);
        }
      } catch {
        await clearToken();
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setSigningIn(true);
    setError(null);
    try {
      const result = await api.post<{ token: string; user: User }>('/login', {
        email: email.trim().toLowerCase(),
        password,
        device_name: 'kalanso-mobile',
      });
      await saveToken(result.token);
      setUser(result.user);

      return true;
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.displayMessage);
      } else {
        setError('Connexion au serveur impossible. Réessayez.');
      }

      return false;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    signingIn,
    error,
    signIn,
    signOut,
    clearError,
  }), [user, ready, signingIn, error, signIn, signOut, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  }

  return context;
}
