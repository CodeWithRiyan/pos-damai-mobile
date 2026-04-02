import { useCallback, useEffect, useState } from 'react';

export interface UseDataResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refresh: () => void;
}

export function useData<T>(
  fetchFn: () => Promise<T[]>,
  defaultData: T[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T[]>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    refetch();
  }, []);

  return { data, loading, error, refetch, refresh };
}

export function useDataById<T>(
  fetchFn: (id: string) => Promise<T | null>,
  id: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchFn(id)
      .then(setData)
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = useCallback(() => {
    if (id) {
      setLoading(true);
      fetchFn(id)
        .then(setData)
        .catch((err) => setError(err as Error))
        .finally(() => setLoading(false));
    }
  }, [id, fetchFn]);

  return { data, loading, error, refresh };
}