/* ============================================================
   Kalanso — client HTTP de l'API
   Gère le token Sanctum, la sérialisation des filtres et
   l'expiration de la session.
   ============================================================ */

function defaultApiUrl() {
  // Dans l'application desktop, l'adresse effective (API distante de
  // l'établissement ou API locale du poste) est fournie par le process
  // principal.
  if (typeof window !== 'undefined' && window.desktopAPI?.apiUrl) {
    return window.desktopAPI.apiUrl;
  }
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
const TOKEN_KEY = 'kalanso.token';
const USER_KEY = 'kalanso.user';

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

function notifySessionExpired() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kalanso:session-expired'));
}

async function send(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    auth = true,
    signal,
    raw = false,
  } = options;

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

  if (response.status === 401 && auth) {
    clearSession();
    notifySessionExpired();
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
  login(email, password, deviceName = 'kalanso-desktop') {
    return send('/login', {
      method: 'POST',
      auth: false,
      body: { email, password, device_name: deviceName },
    }).then((payload) => {
      setSession(payload.token, payload.user);
      return payload;
    });
  },
  setupStatus() {
    return send('/setup/status', { method: 'GET', auth: false });
  },
  setup(body) {
    return send('/setup', { method: 'POST', auth: false, body }).then((payload) => {
      setSession(payload.token, payload.user);
      return payload;
    });
  },
  googleStatus() {
    return send('/auth/google/status', { method: 'GET', auth: false });
  },
  googleExchange(body) {
    return send('/auth/google/exchange', { method: 'POST', auth: false, body }).then((payload) => {
      setSession(payload.token, payload.user);
      return payload;
    });
  },
  async logout() {
    try {
      if (token) await send('/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  },
  me() {
    return send('/me', { method: 'GET' });
  },
};

export function errorMessage(error, fallback = 'Une erreur est survenue.') {
  if (error instanceof ApiError) {
    return error.firstError || error.message || fallback;
  }
  return error?.message || fallback;
}
