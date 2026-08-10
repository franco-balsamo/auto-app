export function parseDate(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

export function formatDate(value: string): string {
  return parseDate(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}
