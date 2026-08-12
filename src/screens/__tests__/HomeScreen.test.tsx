import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import { useVehicles } from '@/hooks/useVehicles';
import { useEntitlements } from '@/hooks/useEntitlements';

jest.mock('@/hooks/useVehicles', () => ({ useVehicles: jest.fn() }));
jest.mock('@/hooks/useEntitlements', () => ({ useEntitlements: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

const mockedUseVehicles = useVehicles as jest.Mock;
const mockedUseEntitlements = useEntitlements as jest.Mock;

describe('HomeScreen — límite de vehículos del plan free', () => {
  const navigate = jest.fn();

  function renderScreen() {
    return render(<HomeScreen navigation={{ navigate }} />);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navega a AddVehicle si el plan free todavía no tiene vehículos', async () => {
    mockedUseVehicles.mockReturnValue({ vehicles: [], loading: false, error: null, refetch: jest.fn(), deleteVehicle: jest.fn() });
    mockedUseEntitlements.mockReturnValue({ isPro: false });
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('+ Agregar vehículo'));

    expect(navigate).toHaveBeenCalledWith('AddVehicle');
  });

  it('bloquea y avisa si el plan free ya tiene 1 vehículo', async () => {
    mockedUseVehicles.mockReturnValue({
      vehicles: [{ id: 'v1', brand: 'Ford', model: 'Fiesta', plate: 'AB123CD', current_km: 1000 }],
      loading: false, error: null, refetch: jest.fn(), deleteVehicle: jest.fn(),
    });
    mockedUseEntitlements.mockReturnValue({ isPro: false });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('+ Agregar vehículo'));

    expect(navigate).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Función paga', expect.stringContaining('1 vehículo'));
  });

  it('un usuario pro puede agregar aunque ya tenga vehículos', async () => {
    mockedUseVehicles.mockReturnValue({
      vehicles: [{ id: 'v1', brand: 'Ford', model: 'Fiesta', plate: 'AB123CD', current_km: 1000 }],
      loading: false, error: null, refetch: jest.fn(), deleteVehicle: jest.fn(),
    });
    mockedUseEntitlements.mockReturnValue({ isPro: true });
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText('+ Agregar vehículo'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('AddVehicle'));
  });
});
