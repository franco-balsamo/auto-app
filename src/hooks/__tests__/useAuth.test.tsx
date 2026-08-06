import { render, waitFor, screen } from '@testing-library/react-native';
import { Text, Linking } from 'react-native';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

function Probe() {
  const { session, loading } = useAuth();
  return <Text>{loading ? 'loading' : session ? 'session' : 'no-session'}</Text>;
}

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
  });

  it('empieza en loading y expone la sesión una vez que getSession resuelve', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('session')).toBeTruthy());
  });

  it('sin sesión inicial expone no-session luego de cargar', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('no-session')).toBeTruthy());
  });
});
