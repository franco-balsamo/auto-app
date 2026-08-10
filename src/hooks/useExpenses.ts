import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseCategory } from '@/types/database';
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

  const updateExpense = useCallback(
    async (
      expenseId: string,
      input: { category: ExpenseCategory; amount: number; odometer_km: number | null; note: string | null }
    ) => {
      const { error } = await supabase.from('expenses').update(input).eq('id', expenseId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  return { expenses: expenses ?? [], loading, error, refetch, updateExpense, deleteExpense };
}
