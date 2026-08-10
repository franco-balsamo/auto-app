import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useReminders } from '@/hooks/useReminders';

const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockDeleteEq = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: (...args: unknown[]) => mockOrder(...args) }) }),
      insert: (...args: unknown[]) => mockInsert(...args),
      update: (...args: unknown[]) => ({ eq: (...eqArgs: unknown[]) => mockUpdateEq(...args, ...eqArgs) }),
      delete: () => ({ eq: (...args: unknown[]) => mockDeleteEq(...args) }),
    }),
  },
}));

describe('useReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [{ id: 'r1', title: 'VTV', status: 'pending' }], error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  it('carga los recordatorios del vehículo al montar', async () => {
    const { result } = await renderHook(() => useReminders('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toHaveLength(1);
  });

  it('createReminder inserta con vehicle_id y source manual, y refresca', async () => {
    const { result } = await renderHook(() => useReminders('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createReminder({ title: 'Cambio de aceite', due_date: '2026-09-01', due_km: null });
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ vehicle_id: 'v1', title: 'Cambio de aceite', source: 'manual' })
    );
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('markDone marca status done y refresca', async () => {
    const { result } = await renderHook(() => useReminders('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markDone('r1');
    });

    expect(mockUpdateEq).toHaveBeenCalledWith({ status: 'done' }, 'id', 'r1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('deleteReminder borra y refresca', async () => {
    const { result } = await renderHook(() => useReminders('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteReminder('r1');
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'r1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });
});
