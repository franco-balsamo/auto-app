import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Vehicle } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useVehicle(vehicleId: string) {
  const {
    data: vehicle,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Vehicle>(
    () => supabase.from('vehicles').select('*').eq('id', vehicleId).single(),
    [vehicleId]
  );

  const updateVehicle = useCallback(
    async (input: { brand: string; model: string; year: number | null; plate: string; current_km: number }) => {
      const { error } = await supabase.from('vehicles').update(input).eq('id', vehicleId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [vehicleId, refetch]
  );

  const deleteVehicle = useCallback(async () => {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    return { error: error?.message ?? null };
  }, [vehicleId]);

  return { vehicle, loading, error, refetch, updateVehicle, deleteVehicle };
}
