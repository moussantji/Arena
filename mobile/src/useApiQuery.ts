/** Hook de chargement de données API avec état prêt / erreur / rechargement. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from './api';

interface QueryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload(): void;
}

function errorMessage(exception: unknown): string {
  return exception instanceof ApiError
    ? exception.displayMessage
    : 'Une erreur est survenue. Réessayez.';
}

export function useApiQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const fetcherRef = useRef(fetcher);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Exécute le fetch ; ne modifie l'état que dans des callbacks asynchrones.
  const execute = useCallback(() => {
    const requestId = ++requestIdRef.current;

    fetcherRef.current()
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setData(result);
        setError(null);
        setLoading(false);
      })
      .catch((exception: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setError(errorMessage(exception));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo -- deps fournies par l'appelant
  }, deps);

  // Rechargement déclenché par l'utilisateur (pull, retry, refresh).
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    execute();
  }, [execute]);

  // Chargement initial / changement de deps : pas de setState synchrone.
  useEffect(() => {
    execute();
  }, [execute]);

  return useMemo(() => ({
    data,
    error,
    loading,
    reload,
  }), [data, error, loading, reload]);
}
