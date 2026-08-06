import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Vehicle } from '@/types/database';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setVehicles(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return { vehicles, loading, error, refetch: fetchVehicles };
}
