/* ============================================================
   DIALLO — client HTTP de l'API
   Gère le token Sanctum, la sérialisation des filtres et
   l'ouverture automatique de la session de démonstration.
   ============================================================ */

function defaultApiUrl() {
  // En Electron (file://), l'API tourne toujours sur la machine locale.
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return 'http://127.0.0.1:8001/api';
  }
  if (window.location.protocol === 'file:') {
    return 'http://127.0.0.1:8001/api';
  }
  // En navigation web (y compris via le lien réseau Vite), on interroge
  // l'API sur le même hôte que l'interface.
  const hostname = window.location.hostname.includes(':')
    ? `[${window.location.hostname.replace(/^\[|\]$/g, '')}]`
    : window.location.hostname;
  return `http://${hostname}:8001/api`;
}

const DEFAULT_URL = defaultApiUrl();
const TOKEN_KEY = 'arena.token';
const USER_KEY = 'arena.user';

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_URL).replace(/\/$/, '');

const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

/**
 * L'API construit les URLs des fichiers avec APP_URL (127.0.0.1). Quand
 * l'interface est ouverte depuis le réseau, ces URLs pointeraient vers la
 * machine du navigateur. On les réécrit vers l'origine réellement utilisée
 * pour joindre l'API.
 */
function normalizeFileUrls(value) {
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      const isLocalFile = LOCAL_HOSTS.has(url.hostname)
        && (url.port === '8001' || url.pathname.startsWith('/storage/'));
      if (isLocalFile && API_ORIGIN) {
        return `${API_ORIGIN}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      /* chaîne qui n'est pas une URL absolue */
    }
    return value;
  }

  if (Array.isArray(value)) return value.map(normalizeFileUrls);

  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      value[key] = normalizeFileUrls(value[key]);
    });
  }

  return value;
}

export class ApiError extends Error {
  constructor(status, payload, message) {
    super(message || payload?.message || `Erreur ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.errors = payload?.errors || {};
  }

  get firstError() {
    const first = Object.values(this.errors)[0];
    return Array.isArray(first) ? first[0] : null;
  }
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
}

let token = readStorage(TOKEN_KEY);
let currentUser = (() => {
  try {
    const raw = readStorage(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

let loginPromise = null;

export function getToken() {
  return token;
}

export function getUser() {
  return currentUser;
}

export function clearSession() {
  token = null;
  currentUser = null;
  writeStorage(TOKEN_KEY, null);
  writeStorage(USER_KEY, null);
}

export function setSession(nextToken, user) {
  token = nextToken;
  currentUser = user || null;
  writeStorage(TOKEN_KEY, nextToken);
  writeStorage(USER_KEY, user ? JSON.stringify(user) : null);
}

function buildUrl(path, query) {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(`${key}[]`, entry));
    } else {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function parseResponse(response) {
  const type = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (type.includes('application/json')) {
    try {
      return normalizeFileUrls(await response.json());
    } catch {
      return null;
    }
  }
  return response.text();
}

async function ensureSession() {
  if (token) return token;
  if (!loginPromise) {
    loginPromise = (async () => {
      const response = await fetch(buildUrl('/login'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'direction@diallo.test',
          password: 'password',
          device_name: 'arena-desktop',
        }),
      });
      const payload = await parseResponse(response);
      if (!response.ok) {
        throw new ApiError(response.status, payload, 'Connexion de démonstration indisponible.');
      }
      setSession(payload.token, payload.user);
      return payload.token;
    })().finally(() => {
      loginPromise = null;
    });
  }
  return loginPromise;
}

async function send(path, options = {}, retried = false) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    auth = false,
    signal,
    raw = false,
  } = options;

  if (auth) {
    try {
      await ensureSession();
    } catch (error) {
      if (!retried) throw error;
    }
  }

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (!isForm && body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  if (auth && token) requestHeaders.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: body === undefined || body === null ? undefined : (isForm ? body : JSON.stringify(body)),
    signal,
  });

  if (response.status === 401 && auth && !retried) {
    clearSession();
    return send(path, options, true);
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return raw ? { payload, response } : payload;
}

export const api = {
  get(path, options = {}) {
    return send(path, { ...options, method: 'GET' });
  },
  post(path, body, options = {}) {
    return send(path, { ...options, method: 'POST', body, auth: true });
  },
  put(path, body, options = {}) {
    return send(path, { ...options, method: 'PUT', body, auth: true });
  },
  patch(path, body, options = {}) {
    return send(path, { ...options, method: 'PATCH', body, auth: true });
  },
  del(path, options = {}) {
    return send(path, { ...options, method: 'DELETE', auth: true });
  },
  upload(path, formData, options = {}) {
    return send(path, { ...options, method: 'POST', body: formData, auth: true });
  },
  login(email, password, deviceName = 'arena-desktop') {
    return send('/login', {
      method: 'POST',
      body: { email, password, device_name: deviceName },
    }).then((payload) => {
      setSession(payload.token, payload.user);
      return payload;
    });
  },
  logout() {
    return send('/logout', { method: 'POST', auth: true }).finally(clearSession);
  },
  me() {
    return send('/me', { method: 'GET', auth: true });
  },
  ensureSession,
};

export function errorMessage(error, fallback = 'Une erreur est survenue.') {
  if (error instanceof ApiError) {
    return error.firstError || error.message || fallback;
  }
  return error?.message || fallback;
}
