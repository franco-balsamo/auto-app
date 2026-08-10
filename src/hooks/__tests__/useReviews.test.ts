import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useReviews } from '@/hooks/useReviews';

const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockDeleteEq = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: (...args: unknown[]) => mockOrder(...args) }) }),
      insert: (...args: unknown[]) => mockInsert(...args),
      update: () => ({ eq: (...args: unknown[]) => mockUpdateEq(...args) }),
      delete: () => ({ eq: (...args: unknown[]) => mockDeleteEq(...args) }),
    }),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  },
}));

describe('useReviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [{ id: 'r1', rating: 5, user_id: 'user-1' }], error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('carga las reseñas del taller al montar', async () => {
    const { result } = await renderHook(() => useReviews('w1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reviews).toHaveLength(1);
  });

  it('createReview inserta con workshop_id y user_id de la sesión', async () => {
    const { result } = await renderHook(() => useReviews('w1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createReview({ rating: 4, comment: 'Buena atención' });
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ workshop_id: 'w1', user_id: 'user-1', rating: 4, comment: 'Buena atención' })
    );
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('createReview sin sesión activa no inserta', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = await renderHook(() => useReviews('w1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.createReview({ rating: 4, comment: null });
    });

    expect(response?.error).toBe('No hay sesión activa');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('updateReview actualiza y refresca', async () => {
    const { result } = await renderHook(() => useReviews('w1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateReview('r1', { rating: 3, comment: null });
    });

    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'r1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('deleteReview borra y refresca', async () => {
    const { result } = await renderHook(() => useReviews('w1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteReview('r1');
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'r1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });
});
