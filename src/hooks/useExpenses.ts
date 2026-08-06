import { supabase } from '@/lib/supabase';
import type { Expense } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useExpenses(vehicleId: string) {
  const {
    data: expenses,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Expense[]>(
    () => supabase.from('expenses').select('*').eq('vehicle_id', vehicleId).order('expense_date', { ascending: false }),
    [vehicleId]
  );

  return { expenses: expenses ?? [], loading, error, refetch };
}
