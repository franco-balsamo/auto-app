import { useCallback, useEffect, useState } from 'react';

type QueryResult<T> = { data: T | null; error: { message: string } | null };

// Boilerplate compartido por los hooks de lectura (useVehicle, useVehicles,
// useExpenses, useDocuments, useReminders): loading/error/refetch alrededor
// de una query de Supabase.
export function useSupabaseQuery<T>(queryFn: () => PromiseLike<QueryResult<T>>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await queryFn();
    if (error) {
      setError(error.message);
    } else {
      setData(data);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/use-memo -- deps las controla el caller
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
