import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDocuments } from '@/hooks/useDocuments';

const mockOrder = jest.fn();
const mockGetUser = jest.fn();
const mockUpload = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockDeleteEq = jest.fn();

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

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [{ id: 'd1', type: 'vtv' }], error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockUpload.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  it('carga los documentos del vehículo al montar', async () => {
    const { result } = await renderHook(() => useDocuments('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.documents).toHaveLength(1);
  });

  it('uploadDocument sube el archivo y crea el registro', async () => {
    const { result } = await renderHook(() => useDocuments('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.uploadDocument('vtv', 'file:///foo/bar.jpg', '2027-01-01');
    });

    expect(response?.error).toBeNull();
    expect(mockUpload).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ vehicle_id: 'v1', type: 'vtv', expiration_date: '2027-01-01' })
    );
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });

  it('uploadDocument sin sesión activa no sube nada', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = await renderHook(() => useDocuments('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.uploadDocument('vtv', 'file:///foo/bar.jpg', null);
    });

    expect(response?.error).toBe('No hay sesión activa');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploadDocument devuelve el error de storage sin insertar', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'storage lleno' } });
    const { result } = await renderHook(() => useDocuments('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response: { error: string | null } | undefined;
    await act(async () => {
      response = await result.current.uploadDocument('vtv', 'file:///foo/bar.jpg', null);
    });

    expect(response?.error).toBe('storage lleno');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('deleteDocument borra y refresca', async () => {
    const { result } = await renderHook(() => useDocuments('v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteDocument('d1');
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'd1');
    expect(mockOrder).toHaveBeenCalledTimes(2);
  });
});
