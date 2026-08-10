import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkshopDetailScreen from '@/screens/WorkshopDetailScreen';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { confirmDelete } from '@/lib/alerts';

jest.mock('@/hooks/useReviews', () => ({ useReviews: jest.fn() }));
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/alerts', () => ({ confirmDelete: jest.fn((_what, onConfirm) => onConfirm()) }));

const mockedUseReviews = useReviews as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const workshop = {
  id: 'w1',
  name: 'Lubricentro Sur',
  category: 'lubricentro' as const,
  address: 'Av. Siempre Viva 123',
  phone: '1122334455',
  lat: -34.6,
  lng: -58.4,
  hours: null,
  source: 'manual' as const,
  claimed_by_user_id: null,
  is_promoted: false,
  created_at: '',
  updated_at: '',
  distance_km: 1.2,
};

describe('WorkshopDetailScreen', () => {
  const createReview = jest.fn();
  const updateReview = jest.fn();
  const deleteReview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ session: { user: { id: 'user-1' } } });
    createReview.mockResolvedValue({ error: null });
    updateReview.mockResolvedValue({ error: null });
    deleteReview.mockResolvedValue({ error: null });
  });

  function renderScreen() {
    return render(
      // @ts-expect-error — solo necesitamos route.params para este test
      <WorkshopDetailScreen route={{ params: { workshop } }} navigation={{}} />
    );
  }

  it('muestra el promedio de rating y la cantidad de reseñas', async () => {
    mockedUseReviews.mockReturnValue({
      reviews: [
        { id: 'r1', workshop_id: 'w1', user_id: 'other', rating: 4, comment: 'Bien', created_at: '2026-08-01T00:00:00Z' },
        { id: 'r2', workshop_id: 'w1', user_id: 'user-2', rating: 5, comment: null, created_at: '2026-08-02T00:00:00Z' },
      ],
      loading: false,
      createReview,
      updateReview,
      deleteReview,
    });

    const { getByText } = await renderScreen();
    expect(getByText('4.5')).toBeTruthy();
    expect(getByText('2 reseñas')).toBeTruthy();
  });

  it('sin reseña propia, publica una nueva con el rating elegido', async () => {
    mockedUseReviews.mockReturnValue({ reviews: [], loading: false, createReview, updateReview, deleteReview });

    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('Contá cómo te fue (opcional)'), 'Excelente');
    await fireEvent.press(getByText('Publicar reseña'));

    await waitFor(() =>
      expect(createReview).toHaveBeenCalledWith({ rating: 5, comment: 'Excelente' })
    );
  });

  it('con reseña propia, permite borrarla', async () => {
    mockedUseReviews.mockReturnValue({
      reviews: [{ id: 'r1', workshop_id: 'w1', user_id: 'user-1', rating: 3, comment: 'Ok', created_at: '2026-08-01T00:00:00Z' }],
      loading: false,
      createReview,
      updateReview,
      deleteReview,
    });

    const { getByText } = await renderScreen();
    await fireEvent.press(getByText('Borrar'));

    expect(confirmDelete).toHaveBeenCalled();
    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith('r1'));
  });
});
