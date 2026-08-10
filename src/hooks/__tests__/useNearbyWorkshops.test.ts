import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useNearbyWorkshops } from '@/hooks/useNearbyWorkshops';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe('useNearbyWorkshops', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: -34.6, longitude: -58.4 },
    });
    mockRpc.mockResolvedValue({ data: [{ id: 'w1', name: 'Taller Sur', distance_km: 1.2 }], error: null });
  });

  it('carga talleres cercanos usando la ubicación actual', async () => {
    const { result } = await renderHook(() => useNearbyWorkshops());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRpc).toHaveBeenCalledWith('nearby_workshops', {
      user_lat: -34.6,
      user_lng: -58.4,
      radius_km: 5,
      filter_category: null,
    });
    expect(result.current.workshops).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('filtra por categoría cuando se pasa una', async () => {
    const { result } = await renderHook(() => useNearbyWorkshops('mecanico', 10));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRpc).toHaveBeenCalledWith(
      'nearby_workshops',
      expect.objectContaining({ filter_category: 'mecanico', radius_km: 10 })
    );
  });

  it('setea error si el permiso de ubicación es denegado', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    const { result } = await renderHook(() => useNearbyWorkshops());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Permiso de ubicación denegado');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('setea error si falla obtener la posición (GPS apagado)', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('gps off'));
    const { result } = await renderHook(() => useNearbyWorkshops());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('No se pudo obtener la ubicación. Verificá que el GPS esté encendido.');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('propaga el error del rpc', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc falló' } });
    const { result } = await renderHook(() => useNearbyWorkshops());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('rpc falló');
    expect(result.current.workshops).toHaveLength(0);
  });
});
