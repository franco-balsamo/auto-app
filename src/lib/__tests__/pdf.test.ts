import { buildVehicleHistoryHtml } from '@/lib/pdf';
import type { Vehicle, Expense, VehicleDocument, Reminder } from '@/types/database';

const vehicle: Vehicle = {
  id: 'v1', user_id: 'u1', brand: 'Ford', model: 'Fiesta', year: 2015, plate: 'AB123CD',
  current_km: 80000, photo_url: null, created_at: '', updated_at: '',
};

const expenses: Expense[] = [
  { id: 'e1', vehicle_id: 'v1', category: 'service', amount: 15000, odometer_km: 80000,
    expense_date: '2026-01-10', note: 'Cambio de aceite', receipt_photo_url: null, created_at: '', updated_at: '' },
];

const documents: VehicleDocument[] = [
  { id: 'd1', vehicle_id: 'v1', type: 'vtv', file_url: 'x', expiration_date: '2026-12-01', created_at: '', updated_at: '' },
];

const reminders: Reminder[] = [
  { id: 'r1', vehicle_id: 'v1', title: 'Cambiar cubiertas', due_date: null, due_km: 90000,
    status: 'pending', source: 'manual', created_at: '', updated_at: '' },
];

describe('buildVehicleHistoryHtml', () => {
  it('incluye datos del vehículo, gastos, documentos y recordatorios', () => {
    const html = buildVehicleHistoryHtml({
      vehicle, expenses, documents, reminders,
      categoryLabels: { service: 'Service' },
      documentLabels: { vtv: 'VTV' },
    });

    expect(html).toContain('Ford Fiesta');
    expect(html).toContain('AB123CD');
    expect(html).toContain('Service');
    expect(html).toContain('$15.000');
    expect(html).toContain('Cambio de aceite');
    expect(html).toContain('VTV');
    expect(html).toContain('Cambiar cubiertas');
    expect(html).toContain('Total: $15.000');
  });

  it('muestra placeholders sin datos cargados', () => {
    const html = buildVehicleHistoryHtml({
      vehicle, expenses: [], documents: [], reminders: [],
      categoryLabels: {}, documentLabels: {},
    });

    expect(html).toContain('Sin gastos cargados.');
    expect(html).toContain('Sin documentos cargados.');
    expect(html).toContain('Sin recordatorios cargados.');
  });

  it('escapa HTML en campos de texto libre', () => {
    const html = buildVehicleHistoryHtml({
      vehicle,
      expenses: [{ ...expenses[0], note: '<script>alert(1)</script>' }],
      documents: [], reminders: [],
      categoryLabels: { service: 'Service' }, documentLabels: {},
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
