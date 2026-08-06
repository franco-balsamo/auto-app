import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import type { Workshop, WorkshopCategory } from '@/types/database';

// Fórmula haversine simple para filtrar por radio en el cliente.
// Para MVP alcanza; a futuro conviene mover esto a una función RPC
// en Postgres con PostGIS (ver comentario en schema.sql).
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      let query = supabase.from('workshops').select('*');
      if (category) query = query.eq('category', category);

      const { data, error } = await query;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const withDistance = (data ?? [])
        .map((w) => ({
          ...w,
          distance_km: distanceKm(latitude, longitude, w.lat, w.lng),
        }))
        .filter((w) => w.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);

      setWorkshops(withDistance);
      setError(null);
      setLoading(false);
    })();
  }, [category, radiusKm]);

  return { workshops, loading, error };
}
