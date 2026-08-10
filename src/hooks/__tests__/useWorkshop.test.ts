import { renderHook, act } from '@testing-library/react-native';
import { useWorkshop } from '@/hooks/useWorkshop';

const mockUpdateEq = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ update: (...args: unknown[]) => ({ eq: (...eqArgs: unknown[]) => mockUpdateEq(...args, ...eqArgs) }) }),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  },
}));

describe('useWorkshop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it('claimWorkshop asigna claimed_by_user_id al usuario de la sesión', async () => {
    const { result } = await renderHook(() => useWorkshop('w1'));

    let response: { error: string | null; userId?: string } | undefined;
    await act(async () => {
      response = await result.current.claimWorkshop();
    });

    expect(response?.error).toBeNull();
    expect(response?.userId).toBe('user-1');
    expect(mockUpdateEq).toHaveBeenCalledWith({ claimed_by_user_id: 'user-1' }, 'id', 'w1');
  });

  it('claimWorkshop sin sesión activa no actualiza', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = await renderHook(() => useWorkshop('w1'));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.claimWorkshop();
    });

    expect(response?.error).toBe('No hay sesión activa');
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it('claimWorkshop propaga el error si la policy rechaza el update (ya reclamado)', async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: 'RLS violation' } });
    const { result } = await renderHook(() => useWorkshop('w1'));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.claimWorkshop();
    });

    expect(response?.error).toBe('RLS violation');
  });

  it('updateWorkshop actualiza nombre/dirección/teléfono', async () => {
    const { result } = await renderHook(() => useWorkshop('w1'));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.updateWorkshop({ name: 'Nuevo nombre', address: null, phone: '1122334455' });
    });

    expect(response?.error).toBeNull();
    expect(mockUpdateEq).toHaveBeenCalledWith(
      { name: 'Nuevo nombre', address: null, phone: '1122334455' },
      'id',
      'w1'
    );
  });
});
