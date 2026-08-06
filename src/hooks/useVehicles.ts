import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Vehicle } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useVehicles() {
  const {
    data: vehicles,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Vehicle[]>(
    () => supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
    []
  );

  const createVehicle = useCallback(
    async (input: { brand: string; model: string; year: number | null; plate: string; current_km: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { error: 'No hay sesión activa' };

      const { error } = await supabase.from('vehicles').insert({ ...input, user_id: userId });
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  return { vehicles: vehicles ?? [], loading, error, refetch, createVehicle };
}
