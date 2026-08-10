import type { WorkshopCategory } from '@/types/database';

export const WORKSHOP_CATEGORIES: WorkshopCategory[] = [
  'lubricentro', 'mecanico', 'lavadero', 'gomeria', 'casa_de_escape',
];

export const WORKSHOP_CATEGORY_LABELS: Record<WorkshopCategory, string> = {
  lubricentro: 'Lubricentro',
  mecanico: 'Mecánico',
  lavadero: 'Lavadero',
  gomeria: 'Gomería',
  casa_de_escape: 'Escape',
};
