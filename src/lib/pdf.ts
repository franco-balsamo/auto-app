import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatDate } from '@/lib/date';
import type { Vehicle, Expense, VehicleDocument, Reminder } from '@/types/database';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function moneyAr(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

export function buildVehicleHistoryHtml(params: {
  vehicle: Vehicle;
  expenses: Expense[];
  documents: VehicleDocument[];
  reminders: Reminder[];
  categoryLabels: Record<string, string>;
  documentLabels: Record<string, string>;
}): string {
  const { vehicle, expenses, documents, reminders, categoryLabels, documentLabels } = params;
  const totalGastado = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesRows = expenses
    .map(
      (e) =>
        `<tr><td>${formatDate(e.expense_date)}</td><td>${escapeHtml(categoryLabels[e.category] ?? e.category)}</td><td>${moneyAr(e.amount)}</td><td>${e.odometer_km?.toLocaleString('es-AR') ?? '—'}</td><td>${escapeHtml(e.note ?? '')}</td></tr>`
    )
    .join('');

  const documentsRows = documents
    .map(
      (d) =>
        `<tr><td>${escapeHtml(documentLabels[d.type] ?? d.type)}</td><td>${d.expiration_date ? formatDate(d.expiration_date) : 'Sin vencimiento'}</td></tr>`
    )
    .join('');

  const remindersRows = reminders
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.title)}</td><td>${r.due_date ? formatDate(r.due_date) : '—'}</td><td>${r.due_km?.toLocaleString('es-AR') ?? '—'}</td><td>${r.status === 'done' ? 'Hecho' : r.status === 'dismissed' ? 'Descartado' : 'Pendiente'}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Helvetica, Arial, sans-serif; color: #23262B; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 0; }
  .sub { color: #5B6B73; font-size: 12px; margin-top: 4px; }
  h2 { font-size: 14px; margin-top: 28px; border-bottom: 1px solid #DCD5C4; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #EDE7DA; }
  th { color: #5B6B73; font-weight: 600; }
  .total { text-align: right; font-weight: 700; margin-top: 8px; font-size: 13px; }
  .empty { color: #5B6B73; font-size: 12px; margin-top: 8px; }
</style></head><body>
  <h1>${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</h1>
  <div class="sub">${escapeHtml(vehicle.plate)} · ${vehicle.year ?? '—'} · ${vehicle.current_km.toLocaleString('es-AR')} km</div>

  <h2>Gastos y service</h2>
  ${
    expenses.length
      ? `<table><thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Km</th><th>Nota</th></tr></thead><tbody>${expensesRows}</tbody></table>
         <div class="total">Total: ${moneyAr(totalGastado)}</div>`
      : '<div class="empty">Sin gastos cargados.</div>'
  }

  <h2>Documentación</h2>
  ${
    documents.length
      ? `<table><thead><tr><th>Documento</th><th>Vencimiento</th></tr></thead><tbody>${documentsRows}</tbody></table>`
      : '<div class="empty">Sin documentos cargados.</div>'
  }

  <h2>Recordatorios</h2>
  ${
    reminders.length
      ? `<table><thead><tr><th>Título</th><th>Fecha</th><th>Km</th><th>Estado</th></tr></thead><tbody>${remindersRows}</tbody></table>`
      : '<div class="empty">Sin recordatorios cargados.</div>'
  }
</body></html>`;
}

export async function exportVehicleHistoryPdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
