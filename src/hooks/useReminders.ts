import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reminder } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useReminders(vehicleId: string) {
  const {
    data: reminders,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Reminder[]>(
    () =>
      supabase
        .from('reminders')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('due_date', { ascending: true, nullsFirst: false }),
    [vehicleId]
  );

  const createReminder = useCallback(
    async (input: { title: string; due_date: string | null; due_km: number | null }) => {
      const { error } = await supabase
        .from('reminders')
        .insert({ vehicle_id: vehicleId, ...input, source: 'manual' });

      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [vehicleId, refetch]
  );

  const markDone = useCallback(
    async (reminderId: string) => {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'done' })
        .eq('id', reminderId);

      if (!error) await refetch();
      return error;
    },
    [refetch]
  );

  const updateReminder = useCallback(
    async (reminderId: string, input: { title: string; due_date: string | null; due_km: number | null }) => {
      const { error } = await supabase.from('reminders').update(input).eq('id', reminderId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  return {
    reminders: reminders ?? [],
    loading,
    error,
    refetch,
    createReminder,
    markDone,
    updateReminder,
    deleteReminder,
  };
}
