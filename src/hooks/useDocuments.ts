import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { VehicleDocument, DocumentType } from '@/types/database';
import { useSupabaseQuery } from './useSupabaseQuery';

export function useDocuments(vehicleId: string) {
  const {
    data: documents,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<VehicleDocument[]>(
    () =>
      supabase
        .from('documents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expiration_date', { ascending: true, nullsFirst: false }),
    [vehicleId]
  );

  const uploadDocument = useCallback(
    async (type: DocumentType, fileUri: string, expirationDate: string | null) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { error: 'No hay sesión activa' };

      const ext = fileUri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${userId}/${vehicleId}/${Date.now()}.${ext}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('vehicle-files')
        .upload(path, blob, { contentType: blob.type || 'image/jpeg' });
      if (uploadError) return { error: uploadError.message };

      const { error: insertError } = await supabase
        .from('documents')
        .insert({ vehicle_id: vehicleId, type, file_url: path, expiration_date: expirationDate });
      if (insertError) return { error: insertError.message };

      await refetch();
      return { error: null };
    },
    [vehicleId, refetch]
  );

  const updateDocument = useCallback(
    async (documentId: string, input: { type: DocumentType; expiration_date: string | null }) => {
      const { error } = await supabase.from('documents').update(input).eq('id', documentId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  return { documents: documents ?? [], loading, error, refetch, uploadDocument, updateDocument, deleteDocument };
}
