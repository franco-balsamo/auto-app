import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWorkshop(workshopId: string) {
  const claimWorkshop = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { error: 'No hay sesión activa' };

    const { error } = await supabase.from('workshops').update({ claimed_by_user_id: userId }).eq('id', workshopId);
    return { error: error?.message ?? null, userId };
  }, [workshopId]);

  const updateWorkshop = useCallback(
    async (input: { name: string; address: string | null; phone: string | null }) => {
      const { error } = await supabase.from('workshops').update(input).eq('id', workshopId);
      return { error: error?.message ?? null };
    },
    [workshopId]
  );

  return { claimWorkshop, updateWorkshop };
}
