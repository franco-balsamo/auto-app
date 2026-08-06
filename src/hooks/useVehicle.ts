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

  return { vehicle, loading, error, refetch };
}
