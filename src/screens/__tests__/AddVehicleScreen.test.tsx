import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddVehicleScreen from '@/screens/AddVehicleScreen';
import { useVehicles } from '@/hooks/useVehicles';

jest.mock('@/hooks/useVehicles', () => ({ useVehicles: jest.fn() }));
jest.mock('@/lib/sentry', () => ({ trackEvent: jest.fn() }));

const mockedUseVehicles = useVehicles as jest.Mock;

describe('AddVehicleScreen — flujo de alta de vehículo', () => {
  const goBack = jest.fn();
  const createVehicle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseVehicles.mockReturnValue({ createVehicle });
  });

  function renderScreen() {
    return render(
      // @ts-expect-error — solo necesitamos goBack para este test
      <AddVehicleScreen navigation={{ goBack }} route={{ params: undefined }} />
    );
  }

  it('muestra error de validación y no llama a createVehicle si faltan campos obligatorios', async () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Guardar vehículo'));

    await waitFor(() =>
      expect(getByText('Marca, modelo y patente son obligatorios')).toBeTruthy()
    );
    expect(createVehicle).not.toHaveBeenCalled();
  });

  it('crea el vehículo y vuelve atrás cuando el formulario es válido', async () => {
    createVehicle.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Volkswagen'), 'Ford');
    fireEvent.changeText(getByPlaceholderText('Gol Trend'), 'Fiesta');
    fireEvent.changeText(getByPlaceholderText('AB123CD'), 'ab123cd');
    fireEvent.press(getByText('Guardar vehículo'));

    await waitFor(() => expect(goBack).toHaveBeenCalled());
    expect(createVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Ford', model: 'Fiesta', plate: 'AB123CD' })
    );
  });

  it('muestra el error del hook si createVehicle falla y no vuelve atrás', async () => {
    createVehicle.mockResolvedValue({ error: 'La patente ya está cargada' });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Volkswagen'), 'Ford');
    fireEvent.changeText(getByPlaceholderText('Gol Trend'), 'Fiesta');
    fireEvent.changeText(getByPlaceholderText('AB123CD'), 'AB123CD');
    fireEvent.press(getByText('Guardar vehículo'));

    await waitFor(() => expect(getByText('La patente ya está cargada')).toBeTruthy());
    expect(goBack).not.toHaveBeenCalled();
  });
});
