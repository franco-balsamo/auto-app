import { parseReceiptText, isOcrEnabled } from '@/lib/ocr';

describe('parseReceiptText', () => {
  it('extrae el monto de la línea de TOTAL en formato argentino y la fecha dd/mm/yyyy', () => {
    const text = 'YPF SA\nFactura B\nFecha: 10/08/2026\nSubtotal $ 1.000,00\nTOTAL $ 1.234,56\nGracias por su compra';
    expect(parseReceiptText(text)).toEqual({ amount: 1234.56, date: '2026-08-10' });
  });

  it('sin línea TOTAL, toma el monto más alto encontrado', () => {
    const text = 'Item 1 ... 100,00\nItem 2 ... 250,50\n15/01/26';
    const result = parseReceiptText(text);
    expect(result.amount).toBe(250.5);
    expect(result.date).toBe('2026-01-15');
  });

  it('devuelve nulls si no encuentra monto ni fecha', () => {
    expect(parseReceiptText('texto sin números útiles')).toEqual({ amount: null, date: null });
  });
});

describe('isOcrEnabled', () => {
  const original = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY = original;
  });

  it('es false sin API key configurada', () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
    expect(isOcrEnabled()).toBe(false);
  });

  it('es true con API key configurada', () => {
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY = 'test-key';
    expect(isOcrEnabled()).toBe(true);
  });
});
