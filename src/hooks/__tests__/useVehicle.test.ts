import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVehicle } from '@/hooks/useVehicle';

const mockSingle = jest.fn();
const mockUpdateEq = jest.fn();
const mockDeleteEq = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: (...args: unknown[]) => mockSingle(...args) }) }),
      update: () => ({ eq: (...args: unknown[]) => mockUpdateEq(...args) }),
      delete: () => ({ eq: (...args: unknown[]) => mockDeleteEq(...args) }),
    }),
  },
}));

describe('useVehicle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: 'v1', brand: 'VW' }, error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  it('carga el vehículo al montar', async () => {
    const { result } = await renderHook(() => useVehicle('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.vehicle).toEqual({ id: 'v1', brand: 'VW' });
    expect(result.current.error).toBeNull();
  });

  it('updateVehicle actualiza y refresca', async () => {
    const { result } = await renderHook(() => useVehicle('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.updateVehicle({
        brand: 'Ford',
        model: 'Fiesta',
        year: 2020,
        plate: 'AB123CD',
        current_km: 2000,
      });
    });

    expect(response?.error).toBeNull();
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'v1');
    expect(mockSingle).toHaveBeenCalledTimes(2);
  });

  it('deleteVehicle borra sin refrescar', async () => {
    const { result } = await renderHook(() => useVehicle('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.deleteVehicle();
    });

    expect(response?.error).toBeNull();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'v1');
    expect(mockSingle).toHaveBeenCalledTimes(1);
  });

  it('propaga el error si falla la carga inicial', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no encontrado' } });
    const { result } = await renderHook(() => useVehicle('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('no encontrado');
    expect(result.current.vehicle).toBeNull();
  });
});
