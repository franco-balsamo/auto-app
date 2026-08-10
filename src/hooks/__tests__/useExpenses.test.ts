import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useExpenses } from '@/hooks/useExpenses';

const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockDeleteEq = jest.fn();
const mockGetUser = jest.fn();
const mockUpload = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: (...args: unknown[]) => mockOrder(...args) }) }),
      insert: (...args: unknown[]) => mockInsert(...args),
      update: () => ({ eq: (...args: unknown[]) => mockUpdateEq(...args) }),
      delete: () => ({ eq: (...args: unknown[]) => mockDeleteEq(...args) }),
    }),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    storage: { from: () => ({ upload: (...args: unknown[]) => mockUpload(...args) }) },
  },
}));

globalThis.fetch = jest.fn(() =>
  Promise.resolve({ blob: () => Promise.resolve({ type: 'image/jpeg' }) })
) as unknown as typeof fetch;

describe('useExpenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [{ id: 'e1', amount: 1000 }], error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockUpload.mockResolvedValue({ error: null });
  });

  it('carga los gastos del vehículo al montar', async () => {
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('createExpense sin foto inserta directo con receipt_photo_url null', async () => {
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.createExpense({
        category: 'nafta',
        amount: 5000,
        odometer_km: null,
        note: null,
        expense_date: '2026-08-10',
      });
    });

    expect(response?.error).toBeNull();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ vehicle_id: 'v1', amount: 5000, receipt_photo_url: null })
    );
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('createExpense con foto sube el archivo y guarda el path', async () => {
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createExpense(
        { category: 'nafta', amount: 5000, odometer_km: null, note: null, expense_date: '2026-08-10' },
        'file:///foo/receipt.jpg'
      );
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ receipt_photo_url: expect.stringContaining('user-1/v1/receipts/') })
    );
  });

  it('createExpense devuelve el error de storage sin insertar', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'storage lleno' } });
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.createExpense(
        { category: 'nafta', amount: 5000, odometer_km: null, note: null, expense_date: '2026-08-10' },
        'file:///foo/receipt.jpg'
      );
    });

    expect(response?.error).toBe('storage lleno');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('updateExpense actualiza y refresca la lista', async () => {
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.updateExpense('e1', {
        category: 'nafta',
        amount: 5000,
        odometer_km: 1000,
        note: null,
        expense_date: '2026-08-10',
      });
    });

    expect(response?.error).toBeNull();
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'e1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('deleteExpense borra y refresca la lista', async () => {
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteExpense('e1');
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'e1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('propaga el error si update falla y no refresca', async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: 'boom' } });
    const { result } = await renderHook(() => useExpenses('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.updateExpense('e1', {
        category: 'nafta',
        amount: 5000,
        odometer_km: null,
        note: null,
        expense_date: '2026-08-10',
      });
    });

    expect(response?.error).toBe('boom');
    expect(mockOrder).toHaveBeenCalledTimes(1);
  });
});
