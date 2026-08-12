// Tipos generados a mano a partir de schema.sql
// (Cuando el schema esté en Supabase, podés reemplazar esto por:
//  npx supabase gen types typescript --project-id <id> > database.ts)

export type ExpenseCategory =
  | 'service' | 'nafta' | 'seguro' | 'patente' | 'lavado' | 'gomas' | 'otro';

export type DocumentType =
  | 'cedula' | 'seguro' | 'vtv' | 'licencia' | 'otro';

export type WorkshopCategory =
  | 'lubricentro' | 'mecanico' | 'lavadero' | 'gomeria' | 'casa_de_escape';

export type QuoteRequestStatus = 'open' | 'closed';

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number | null;
  plate: string;
  current_km: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  vehicle_id: string;
  category: ExpenseCategory;
  amount: number;
  odometer_km: number | null;
  expense_date: string; // ISO date
  note: string | null;
  receipt_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  type: DocumentType;
  file_url: string;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  vehicle_id: string;
  title: string;
  due_date: string | null;
  due_km: number | null;
  status: 'pending' | 'done' | 'dismissed';
  source: 'manual' | 'document' | 'preset';
  created_at: string;
  updated_at: string;
}

export interface Workshop {
  id: string;
  name: string;
  category: WorkshopCategory;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  hours: Record<string, string> | null;
  source: 'osm' | 'manual';
  claimed_by_user_id: string | null;
  is_promoted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  workshop_id: string;
  user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteRequest {
  id: string;
  user_id: string;
  vehicle_id: string;
  description: string;
  category: WorkshopCategory | null;
  status: QuoteRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface QuoteResponse {
  id: string;
  quote_request_id: string;
  workshop_id: string;
  price_estimate: number | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}
