/**
 * Client API Kalanso pour le mobile.
 *
 * - Base : https://kalanso.mandenbaoubab.com/api (peut être surchargée
 *   au build via EXPO_PUBLIC_KALANSO_API_URL pour les environnements de test).
 * - Authentification : jeton Sanctum stocké dans le trousseau sécurisé
 *   du téléphone (expo-secure-store).
 * - Aucune adresse de serveur n'est affichée à l'utilisateur final.
 */
import * as SecureStore from 'expo-secure-store';

const BASE_URL = (process.env.EXPO_PUBLIC_KALANSO_API_URL
  ?? 'https://kalanso.mandenbaoubab.com/api').replace(/\/+$/, '');

export const TOKEN_KEY = 'kalanso.mobile.token';

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status = 0, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Message principal exploitable par l'interface. */
  get displayMessage(): string {
    const first = Object.values(this.fieldErrors)[0]?.[0];

    return first || this.message;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Le contexte d'authentification enregistre ici sa routine de déconnexion. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Le jeton conserve sa valeur nulle : la session sera invalidée au prochain démarrage.
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function request<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      aborted
        ? 'Le serveur met trop de temps à répondre. Vérifiez votre connexion.'
        : 'Connexion au serveur impossible. Vérifiez votre réseau puis réessayez.',
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const data = (payload ?? {}) as { message?: string; errors?: Record<string, string[]> };
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(
      data.message || messageForStatus(response.status),
      response.status,
      data.errors ?? {},
    );
  }

  return payload as T;
}

function messageForStatus(status: number): string {
  switch (status) {
    case 403:
      return 'Action non autorisée pour votre compte.';
    case 404:
      return 'Élément introuvable.';
    case 422:
      return 'Les informations saisies sont invalides.';
    case 429:
      return 'Trop de tentatives. Patientez une minute puis réessayez.';
    default:
      return status >= 500
        ? 'Une erreur est survenue côté serveur. Réessayez dans un instant.'
        : `Requête refusée (${status}).`;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
