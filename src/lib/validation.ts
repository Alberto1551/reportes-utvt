import type { Category } from './types';
import { CATEGORIES } from './types';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLogin(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return 'Escribe un correo válido.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}

export function validateSignup(name: string, email: string, password: string): string | null {
  if (name.trim().length < 3) return 'Escribe tu nombre completo.';
  const base = validateLogin(email, password);
  if (base) return base;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'La contraseña debe tener letras y números.';
  return null;
}

export interface ReportDraft {
  category: Category | null;
  location: string;
  description: string;
}

/** Validaciones antes de enviar; el servidor vuelve a validar con CHECK y triggers. */
export function validateReport(d: ReportDraft): string | null {
  if (!d.category || !CATEGORIES.some((c) => c.value === d.category)) return 'Elige el tipo de problema.';
  const loc = d.location.trim();
  if (loc.length < 3 || loc.length > 120) return 'La ubicación debe tener entre 3 y 120 caracteres (ej. Edificio D, salón 204).';
  const desc = d.description.trim();
  if (desc.length < 10 || desc.length > 1000) return 'La descripción debe tener entre 10 y 1000 caracteres.';
  return null;
}
