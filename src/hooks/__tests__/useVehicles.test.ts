import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVehicles } from '@/hooks/useVehicles';

const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: (...args: unknown[]) => mockOrder(...args) }),
      insert: (...args: unknown[]) => mockInsert(...args),
    }),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  },
}));

describe('useVehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [{ id: '1', brand: 'VW' }], error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('carga los vehículos del usuario al montar', async () => {
    const { result } = await renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.vehicles).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('createVehicle inserta con el user_id de la sesión y refresca la lista', async () => {
    const { result } = await renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.createVehicle({
        brand: 'Ford',
        model: 'Fiesta',
        year: 2020,
        plate: 'AB123CD',
        current_km: 1000,
      });
    });

    expect(response?.error).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', brand: 'Ford', plate: 'AB123CD' })
    );
    expect(mockOrder).toHaveBeenCalledTimes(2); // fetch inicial + refetch post-insert
  });

  it('createVehicle sin sesión activa no inserta y devuelve error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = await renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.createVehicle({
        brand: 'Ford',
        model: 'Fiesta',
        year: null,
        plate: 'X',
        current_km: 0,
      });
    });

    expect(response?.error).toBe('No hay sesión activa');
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
