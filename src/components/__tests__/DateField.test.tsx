import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DateField from '@/components/DateField';

describe('DateField', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el placeholder cuando no hay valor', async () => {
    const { getByText } = await render(
      <DateField value="" onChange={onChange} placeholder="Elegir fecha" />
    );
    expect(getByText('Elegir fecha')).toBeTruthy();
  });

  it('muestra la fecha formateada cuando hay valor', async () => {
    const { getByText } = await render(<DateField value="2026-08-15" onChange={onChange} />);
    expect(getByText(/ago\.?/i)).toBeTruthy();
  });

  it('abre el calendario y selecciona un día', async () => {
    const { getByText } = await render(<DateField value="2026-08-15" onChange={onChange} />);

    fireEvent.press(getByText(/ago\.?/i));
    await waitFor(() => expect(getByText('Agosto 2026')).toBeTruthy());

    fireEvent.press(getByText('31'));

    expect(onChange).toHaveBeenCalledWith('2026-08-31');
  });

  it('no muestra "Quitar fecha" cuando el campo es requerido', async () => {
    const { queryByText } = await render(
      <DateField value="2026-08-15" onChange={onChange} required />
    );
    expect(queryByText('Quitar fecha')).toBeNull();
  });

  it('limpia la fecha al presionar "Quitar fecha"', async () => {
    const { getByText } = await render(<DateField value="2026-08-15" onChange={onChange} />);

    fireEvent.press(getByText('Quitar fecha'));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
