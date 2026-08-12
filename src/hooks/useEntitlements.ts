import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Subscription, PdfExportUsage } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useEntitlements() {
  const {
    data: subscription,
    loading: loadingSubscription,
  } = useSupabaseQuery<Subscription>(() => supabase.from('subscriptions').select('*').maybeSingle(), []);

  const {
    data: pdfExportUsage,
    loading: loadingPdfExportUsage,
    refetch: refetchPdfExportUsage,
  } = useSupabaseQuery<PdfExportUsage>(() => supabase.from('pdf_export_usage').select('*').maybeSingle(), []);

  const isPro = subscription?.status === 'active';
  const canExportPdf = isPro || !pdfExportUsage;

  const markPdfExportUsed = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    await supabase.from('pdf_export_usage').insert({ user_id: userId });
    await refetchPdfExportUsage();
  }, [refetchPdfExportUsage]);

  return {
    isPro,
    canExportPdf,
    loading: loadingSubscription || loadingPdfExportUsage,
    markPdfExportUsed,
  };
}
