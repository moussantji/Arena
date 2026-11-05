/** Hook de chargement de données API avec état prêt / erreur / rechargement. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from './api';

interface QueryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload(): void;
}

export function useApiQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setError(
            exception instanceof ApiError
              ? exception.displayMessage
              : 'Une erreur est survenue. Réessayez.',
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps fournies par l'appelant
  }, deps);

  useEffect(() => reload(), [reload]);

  return useMemo(() => ({
    data,
    error,
    loading,
    reload: () => {
      reload();
    },
  }), [data, error, loading, reload]);
}
