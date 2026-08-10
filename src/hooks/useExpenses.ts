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

  const createExpense = useCallback(
    async (
      input: {
        category: ExpenseCategory;
        amount: number;
        odometer_km: number | null;
        note: string | null;
        expense_date: string;
      },
      receiptPhotoUri?: string | null
    ) => {
      let receipt_photo_url: string | null = null;

      if (receiptPhotoUri) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return { error: 'No hay sesión activa' };

        const ext = receiptPhotoUri.split('.').pop()?.split('?')[0] || 'jpg';
        const path = `${userId}/${vehicleId}/receipts/${Date.now()}.${ext}`;

        const response = await fetch(receiptPhotoUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('vehicle-files')
          .upload(path, blob, { contentType: blob.type || 'image/jpeg' });
        if (uploadError) return { error: uploadError.message };

        receipt_photo_url = path;
      }

      const { error } = await supabase.from('expenses').insert({ vehicle_id: vehicleId, ...input, receipt_photo_url });
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [vehicleId, refetch]
  );

  const updateExpense = useCallback(
    async (
      expenseId: string,
      input: {
        category: ExpenseCategory;
        amount: number;
        odometer_km: number | null;
        note: string | null;
        expense_date: string;
      }
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

  return { expenses: expenses ?? [], loading, error, refetch, createExpense, updateExpense, deleteExpense };
}
