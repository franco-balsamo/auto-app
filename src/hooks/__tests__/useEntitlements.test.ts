import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useEntitlements } from '@/hooks/useEntitlements';

const mockSubscriptionMaybeSingle = jest.fn();
const mockUsageMaybeSingle = jest.fn();
const mockInsert = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'subscriptions') {
        return { select: () => ({ maybeSingle: (...args: unknown[]) => mockSubscriptionMaybeSingle(...args) }) };
      }
      return {
        select: () => ({ maybeSingle: (...args: unknown[]) => mockUsageMaybeSingle(...args) }),
        insert: (...args: unknown[]) => mockInsert(...args),
      };
    },
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  },
}));

describe('useEntitlements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUsageMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('usuario free sin export usado puede exportar', async () => {
    const { result } = await renderHook(() => useEntitlements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPro).toBe(false);
    expect(result.current.canExportPdf).toBe(true);
  });

  it('usuario free que ya usó su export gratis no puede exportar de nuevo', async () => {
    mockUsageMaybeSingle.mockResolvedValue({ data: { user_id: 'user-1', used_at: '2026-01-01' }, error: null });
    const { result } = await renderHook(() => useEntitlements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.canExportPdf).toBe(false);
  });

  it('usuario con suscripción activa puede exportar aunque ya haya usado el gratis', async () => {
    mockSubscriptionMaybeSingle.mockResolvedValue({ data: { status: 'active' }, error: null });
    mockUsageMaybeSingle.mockResolvedValue({ data: { user_id: 'user-1', used_at: '2026-01-01' }, error: null });
    const { result } = await renderHook(() => useEntitlements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPro).toBe(true);
    expect(result.current.canExportPdf).toBe(true);
  });

  it('suscripción cancelada no cuenta como pro', async () => {
    mockSubscriptionMaybeSingle.mockResolvedValue({ data: { status: 'canceled' }, error: null });
    const { result } = await renderHook(() => useEntitlements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPro).toBe(false);
  });

  it('markPdfExportUsed inserta la fila de uso con el user_id de la sesión', async () => {
    const { result } = await renderHook(() => useEntitlements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markPdfExportUsed();
    });

    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-1' });
  });
});
