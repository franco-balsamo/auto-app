import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import type { Workshop, WorkshopCategory } from '@/types/database';

export function useNearbyWorkshops(category?: WorkshopCategory, radiusKm = 5) {
  const [workshops, setWorkshops] = useState<(Workshop & { distance_km: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      let latitude: number;
      let longitude: number;
      try {
        const position = await Location.getCurrentPositionAsync({});
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        setError('No se pudo obtener la ubicación. Verificá que el GPS esté encendido.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('nearby_workshops', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm,
        filter_category: category ?? null,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setWorkshops((data ?? []) as (Workshop & { distance_km: number })[]);
      setError(null);
      setLoading(false);
    })();
  }, [category, radiusKm]);

  return { workshops, loading, error };
}
