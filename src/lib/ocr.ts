// OCR de facturas vía Google Cloud Vision API (funciona en Expo Go, a
// diferencia de ML Kit on-device que requiere dev build). Sin
// EXPO_PUBLIC_GOOGLE_VISION_API_KEY configurada, queda inerte (igual que
// Sentry sin DSN) — sacar una foto sigue funcionando, solo no autocompleta.

export type ReceiptScan = { amount: number | null; date: string | null };

export function isOcrEnabled(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY);
}

const AMOUNT_PATTERN = '\\$?\\s*(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})?|\\d+,\\d{2})';

function toAmount(raw: string): number {
  return Number(raw.replace(/\./g, '').replace(',', '.'));
}

function extractAmount(text: string): number | null {
  const totalLine = text.split('\n').find((l) => /\btotal\b/i.test(l));
  if (totalLine) {
    const m = totalLine.match(new RegExp(AMOUNT_PATTERN));
    if (m) return toAmount(m[1]);
  }

  const matches = [...text.matchAll(new RegExp(AMOUNT_PATTERN, 'g'))].map((m) => toAmount(m[1]));
  if (!matches.length) return null;
  return Math.max(...matches);
}

function extractDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return null;
  const [, d, mo, yRaw] = m;
  const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
  return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function parseReceiptText(text: string): ReceiptScan {
  return { amount: extractAmount(text), date: extractDate(text) };
}

export async function scanReceipt(base64Image: string): Promise<ReceiptScan> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) return { amount: null, date: null };

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ image: { content: base64Image }, features: [{ type: 'TEXT_DETECTION' }] }],
    }),
  });

  if (!res.ok) throw new Error('No se pudo leer la factura');

  const json = await res.json();
  const text: string = json.responses?.[0]?.fullTextAnnotation?.text ?? '';
  return parseReceiptText(text);
}
