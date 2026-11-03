import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  api, ApiError, errorMessage, clearSession, getToken, getUser, setSession,
} from './api.js';
import { Icon } from './ui.jsx';
import { hasPermission, canAccessPage as userCanAccessPage } from './auth.js';

/* ============================================================
   Kalanso — état partagé de l'application
   Chargement des référentiels, version de rafraîchissement,
   notifications, toasts, élève sélectionné et hook de lecture.
   ============================================================ */

const DataCtx = createContext(null);

/* ---------- fonctions de vérification des permissions ---------- */


export const STUDENT_STATUS = {
  a_jour: { label: 'À jour', tone: 'accent' },
  en_retard: { label: 'En retard', tone: 'copper' },
  boursier: { label: 'Boursier', tone: 'copper' },
};

export const INVOICE_STATUS = {
  paid: { label: 'Payé', tone: 'accent' },
  pending: { label: 'En attente', tone: 'copper' },
  partial: { label: 'Partiel', tone: 'copper' },
  cancelled: { label: 'Annulé', tone: 'danger' },
};

export const PAYMENT_STATUS = {
  completed: { label: 'Validé', tone: 'accent' },
  pending: { label: 'En attente', tone: 'copper' },
  failed: { label: 'Échoué', tone: 'danger' },
};

export const PAYMENT_METHODS = {
  cash: 'Espèces',
  mobile_money: 'Mobile money',
  bank: 'Virement',
  card: 'Carte bancaire',
  other: 'Autre',
};

export const ADMISSION_STATUS = {
  nouveau: { label: 'Nouveau', tone: 'glass' },
  entretien: { label: 'Entretien', tone: 'copper' },
  valide: { label: 'Validé', tone: 'accent' },
  inscrit: { label: 'Inscrit', tone: 'accent' },
  refuse: { label: 'Refusé', tone: 'danger' },
};

export const EVALUATIONS = {
  devoir_1: 'Devoir 1',
  devoir_2: 'Devoir 2',
  composition: 'Composition',
};

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/* ---------- formatage ---------- */
export const money = (value, currency = 'FCFA') => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(number)} ${currency}`;
};

export const compactMoney = (value, currency = 'FCFA') => {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1_000_000) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(number / 1_000_000)} M ${currency}`;
  }
  if (Math.abs(number) >= 1_000) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(number / 1_000)} k ${currency}`;
  }
  return money(number, currency);
};

export const number = (value, digits = 0) => new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(Number(value || 0));

export const date = (value, options = {}) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  const { short = false } = options;
  return new Intl.DateTimeFormat('fr-FR', short
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
};

export const time = (value) => {
  if (!value) return '—';
  return String(value).slice(0, 5);
};

export const dateTime = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(parsed);
};

export const initials = (value = '') => value
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase() || '—';

export const fullName = (person) => person?.full_name || [person?.first_name, person?.last_name].filter(Boolean).join(' ') || '—';

export const dateInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

export const monthInput = (value = new Date()) => {
  const parsed = value instanceof Date ? value : new Date(value);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

export const useDebounced = (value, delay = 320) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

/* ---------- contexte ---------- */
export function DataProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(getToken()));
  const [checkingSetup, setCheckingSetup] = useState(() => !getToken());
  const [setupStatus, setSetupStatus] = useState(null);
  const [version, setVersion] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadThreads, setUnreadThreads] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(() => getUser());
  const [studentId, setStudentIdState] = useState(() => {
    const stored = Number(window.localStorage.getItem('kalanso.student'));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  });
  const [classId, setClassIdState] = useState(() => {
    const stored = Number(window.localStorage.getItem('kalanso.class'));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  });
  const [staffId, setStaffIdState] = useState(() => {
    const stored = Number(window.localStorage.getItem('kalanso.staff'));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  });
  const [admissionId, setAdmissionIdState] = useState(() => {
    const stored = Number(window.localStorage.getItem('kalanso.admission'));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  });
  const toastSeq = useRef(0);

  const notify = useCallback((message, options = {}) => {
    const id = ++toastSeq.current;
    const toast = {
      id,
      title: options.title || message,
      detail: options.detail || '',
      tone: options.tone || 'success',
    };
    setToasts((current) => [...current.slice(-3), toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, options.duration ?? 4200);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const payload = await api.get('/notifications', { query: { per_page: 12 } });
      setNotifications(payload?.data || []);
    } catch {
      /* les notifications ne bloquent jamais l'application */
    }
  }, []);

  const loadMeta = useCallback(async () => {
    const payload = await api.get('/meta');
    setMeta(payload);
    return payload;
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const payload = await api.get('/threads');
      const threads = payload?.threads || [];
      setUnreadThreads(threads.reduce((total, thread) => total + Number(thread.unread_count || 0), 0));
    } catch {
      setUnreadThreads(0);
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    await loadMeta();
    await Promise.all([loadNotifications(), loadThreads()]);
  }, [loadMeta, loadNotifications, loadThreads]);

  const checkSetup = useCallback(async () => {
    setCheckingSetup(true);
    try {
      const status = await api.setupStatus();
      setSetupStatus(status);
      return status;
    } catch (error) {
      setBootError(errorMessage(error, 'Impossible de préparer Kalanso.'));
      return null;
    } finally {
      setCheckingSetup(false);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    if (!getToken()) {
      setBooting(false);
      setUser(null);
      await checkSetup();
      return;
    }

    setBooting(true);
    setBootError(null);
    try {
      const me = await api.me();
      setSession(getToken(), me.user);
      setUser(me.user);
      await loadWorkspace();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        setUser(null);
        setMeta(null);
        setBootError('Votre session a expiré. Reconnectez-vous.');
        await checkSetup();
      } else {
        setBootError(errorMessage(error, 'Impossible de joindre l’API.'));
      }
    } finally {
      setBooting(false);
    }
  }, [loadWorkspace, checkSetup]);

  const signIn = useCallback(async (email, password) => {
    setBootError(null);
    try {
      const session = await api.login(email, password);
      await loadWorkspace();
      setUser(session.user);
      return session.user;
    } catch (error) {
      clearSession();
      setUser(null);
      setBootError(errorMessage(error, 'Connexion impossible.'));
      throw error;
    }
  }, [loadWorkspace]);

  const signInWithToken = useCallback(async (token, nextUser) => {
    setBootError(null);
    setSession(token, nextUser);
    setUser(nextUser);
    setSetupStatus((current) => ({ ...(current || {}), needs_setup: false }));
    await loadWorkspace();
    return nextUser;
  }, [loadWorkspace]);

  const completeSetup = useCallback(async (payload) => {
    setBootError(null);
    try {
      const result = await api.setup(payload);
      setUser(result.user);
      setSetupStatus((current) => ({
        ...(current || {}),
        needs_setup: false,
        google_enabled: current?.google_enabled ?? false,
      }));
      await loadWorkspace();
      return result;
    } catch (error) {
      setBootError(errorMessage(error, 'La configuration a échoué.'));
      throw error;
    }
  }, [loadWorkspace]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const refresh = useCallback(() => {
    setVersion((value) => value + 1);
    loadMeta().catch(() => {});
    loadNotifications();
    loadThreads();
  }, [loadMeta, loadNotifications, loadThreads]);

  const markNotification = useCallback(async (notification) => {
    if (!notification || notification.read_at) return;
    try {
      await api.post(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
      )));
    } catch (error) {
      notify(errorMessage(error), { tone: 'danger' });
    }
  }, [notify]);

  const markAllNotifications = useCallback(async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      notify('Toutes les notifications sont lues.');
    } catch (error) {
      notify(errorMessage(error), { tone: 'danger' });
    }
  }, [notify]);

  const deleteNotification = useCallback(async (notification) => {
    try {
      await api.del(`/notifications/${notification.id}`);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    } catch (error) {
      notify(errorMessage(error), { tone: 'danger' });
    }
  }, [notify]);

  const setStudentId = useCallback((id) => {
    const next = id == null ? null : Number(id);
    setStudentIdState(next);
    if (next) window.localStorage.setItem('kalanso.student', String(next));
    else window.localStorage.removeItem('kalanso.student');
  }, []);

  const setClassId = useCallback((id) => {
    const next = id == null ? null : Number(id);
    setClassIdState(next);
    if (next) window.localStorage.setItem('kalanso.class', String(next));
    else window.localStorage.removeItem('kalanso.class');
  }, []);

  const setStaffId = useCallback((id) => {
    const next = id == null ? null : Number(id);
    setStaffIdState(next);
    if (next) window.localStorage.setItem('kalanso.staff', String(next));
    else window.localStorage.removeItem('kalanso.staff');
  }, []);

  const setAdmissionId = useCallback((id) => {
    const next = id == null ? null : Number(id);
    setAdmissionIdState(next);
    if (next) window.localStorage.setItem('kalanso.admission', String(next));
    else window.localStorage.removeItem('kalanso.admission');
  }, []);

  const resetSelections = useCallback(() => {
    setStudentIdState(null);
    setClassIdState(null);
    setStaffIdState(null);
    setAdmissionIdState(null);
    ['kalanso.student', 'kalanso.class', 'kalanso.staff', 'kalanso.admission'].forEach((key) => {
      window.localStorage.removeItem(key);
    });
  }, []);

  const signOut = useCallback(async () => {
    const request = api.logout().catch(() => {});
    setUser(null);
    setMeta(null);
    setNotifications([]);
    setUnreadThreads(0);
    setBootError(null);
    setToasts([]);
    setBooting(false);
    resetSelections();
    await request;
  }, [resetSelections]);

  const updateUser = useCallback((nextUser) => {
    if (!nextUser) return;
    setSession(getToken(), nextUser);
    setUser(nextUser);
  }, []);

  const can = useCallback((permission) => hasPermission(user, permission), [user]);

  const canAccessPage = useCallback(
    (pageId) => userCanAccessPage(user, pageId),
    [user],
  );

  useEffect(() => {
    const onExpired = () => {
      clearSession();
      setUser(null);
      setMeta(null);
      setNotifications([]);
      setUnreadThreads(0);
      setBootError('Votre session a expiré. Reconnectez-vous.');
      setBooting(false);
      resetSelections();
    };
    window.addEventListener('kalanso:session-expired', onExpired);
    return () => window.removeEventListener('kalanso:session-expired', onExpired);
  }, [resetSelections]);

  const unread = notifications.filter((item) => !item.read_at).length;

  const value = useMemo(() => ({
    meta,
    booting,
    bootError,
    setBootError,
    checkingSetup,
    setupStatus,
    completeSetup,
    bootstrap,
    checkSetup,
    version,
    refresh,
    notifications,
    unread,
    unreadThreads,
    loadThreads,
    markNotification,
    markAllNotifications,
    deleteNotification,
    loadNotifications,
    toasts,
    notify,
    dismissToast,
    user,
    setUser,
    signIn,
    signInWithToken,
    signOut,
    updateUser,
    can,
    canAccessPage,
    studentId,
    setStudentId,
    classId,
    setClassId,
    staffId,
    setStaffId,
    admissionId,
    setAdmissionId,
  }), [
    meta, booting, bootError, checkingSetup, setupStatus, completeSetup, bootstrap, checkSetup,
    version, refresh, notifications, unread,
    unreadThreads, loadThreads, markNotification, markAllNotifications, deleteNotification, loadNotifications,
    toasts, notify, dismissToast, user, signIn, signInWithToken, signOut, updateUser, can, canAccessPage,
    studentId, setStudentId, classId, setClassId, staffId, setStaffId, admissionId, setAdmissionId,
  ]);

  return (
    <DataCtx.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </DataCtx.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData doit être utilisé dans <DataProvider>');
  return ctx;
}

/* ---------- lecture API avec rechargement global ---------- */
export function useApi(path, query, options = {}) {
  const { version, notify } = useData();
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const [localVersion, setLocalVersion] = useState(0);
  const enabled = options.enabled !== false && Boolean(path);
  const queryKey = useMemo(() => JSON.stringify(query || {}), [query]);
  const silent = options.silent === true;

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState((current) => ({ data: current.data, loading: true, error: null }));

    api.get(path, { query: JSON.parse(queryKey), signal: controller.signal })
      .then((payload) => {
        if (!controller.signal.aborted) setState({ data: payload, loading: false, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({ data: null, loading: false, error });
        if (!silent && error instanceof ApiError) {
          notify(error.firstError || error.message, { tone: 'danger' });
        }
      });

    return () => controller.abort();
  }, [path, queryKey, version, localVersion, enabled, silent, notify]);

  const reload = useCallback(() => setLocalVersion((value) => value + 1), []);

  return {
    ...state,
    reload,
    rows: state.data?.data || state.data?.students || state.data?.staff || state.data?.subjects || state.data?.classes || state.data?.slots || [],
  };
}

/* ---------- toasts ---------- */
function Toaster({ toasts, onDismiss }) {
  if (typeof document === 'undefined' || !toasts.length) return null;
  return createPortal(
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.tone}`} key={toast.id}>
          <span className="toast-ic">
            <Icon name={toast.tone === 'danger' ? 'close' : 'check'} size={14} />
          </span>
          <span className="toast-copy">
            <b>{toast.title}</b>
            {toast.detail && <em>{toast.detail}</em>}
          </span>
          <button type="button" className="toast-x" onClick={() => onDismiss(toast.id)} aria-label="Fermer">
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
