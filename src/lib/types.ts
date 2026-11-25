export type Role = 'reportante' | 'mantenimiento' | 'admin';
export type Category = 'computo' | 'iluminacion' | 'mobiliario' | 'internet' | 'electrica' | 'otro';
export type Status = 'abierto' | 'en_proceso' | 'resuelto';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
}

export interface Report {
  id: string;
  user_id: string;
  category: Category;
  location: string;
  description: string;
  status: Status;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'computo', label: 'Equipo de cómputo' },
  { value: 'iluminacion', label: 'Iluminación' },
  { value: 'mobiliario', label: 'Mobiliario' },
  { value: 'internet', label: 'Internet' },
  { value: 'electrica', label: 'Instalación eléctrica' },
  { value: 'otro', label: 'Otro' },
];

export const STATUS_LABEL: Record<Status, string> = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
};

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.value === c)?.label ?? c;
