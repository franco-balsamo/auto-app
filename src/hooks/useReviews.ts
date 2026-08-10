import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useReviews(workshopId: string) {
  const {
    data: reviews,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Review[]>(
    () => supabase.from('reviews').select('*').eq('workshop_id', workshopId).order('created_at', { ascending: false }),
    [workshopId]
  );

  const createReview = useCallback(
    async (input: { rating: number; comment: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { error: 'No hay sesión activa' };

      const { error } = await supabase.from('reviews').insert({ workshop_id: workshopId, user_id: userId, ...input });
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [workshopId, refetch]
  );

  const updateReview = useCallback(
    async (reviewId: string, input: { rating: number; comment: string | null }) => {
      const { error } = await supabase.from('reviews').update(input).eq('id', reviewId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  return { reviews: reviews ?? [], loading, error, refetch, createReview, updateReview, deleteReview };
}
