import { decode } from 'base64-arraybuffer';
import * as Crypto from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { withTimeout } from './errors';
import { supabase } from './supabase';
import type { Category, Report, Status } from './types';

const BUCKET = 'evidencias';

export async function listReports(): Promise<Report[]> {
  // Las políticas RLS deciden qué filas regresan: las propias, o todas si es personal.
  const { data, error } = await withTimeout(
    supabase
      .from('reports')
      .select('id, user_id, category, location, description, status, photo_path, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100),
  );
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await withTimeout(
    supabase
      .from('reports')
      .select('id, user_id, category, location, description, status, photo_path, created_at, updated_at')
      .eq('id', id)
      .maybeSingle(),
  );
  if (error) throw error;
  return (data as Report | null) ?? null;
}

/** Reduce la foto (máx. 1280 px, JPEG 70 %) y la sube a la carpeta del usuario. */
export async function uploadPhoto(userId: string, localUri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(localUri);
  ctx.resize({ width: 1280 });
  const img = await ctx.renderAsync();
  const saved = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('No se pudo procesar la foto');

  const path = `${userId}/${Crypto.randomUUID()}.jpg`;
  const { error } = await withTimeout(
    supabase.storage.from(BUCKET).upload(path, decode(saved.base64), { contentType: 'image/jpeg', upsert: false }),
    30000,
  );
  if (error) throw error;
  return path;
}

export async function createReport(input: {
  category: Category;
  location: string;
  description: string;
  photoPath: string | null;
}): Promise<Report> {
  // No se manda user_id, estado ni fecha: los pone el servidor (trigger reports_guard).
  const { data, error } = await withTimeout(
    supabase
      .from('reports')
      .insert({
        category: input.category,
        location: input.location.trim(),
        description: input.description.trim(),
        photo_path: input.photoPath,
      })
      .select()
      .single(),
  );
  if (error) throw error;
  return data as Report;
}

export async function updateStatus(id: string, status: Status) {
  const { error } = await withTimeout(supabase.from('reports').update({ status }).eq('id', id));
  if (error) throw error;
}

/** URL temporal (5 minutos) para ver la foto; el bucket es privado. */
export async function photoUrl(path: string): Promise<string | null> {
  const { data, error } = await withTimeout(supabase.storage.from(BUCKET).createSignedUrl(path, 300));
  if (error) return null;
  return data.signedUrl;
}

/** Nombres de quienes reportaron (solo el personal puede ver perfiles ajenos). */
export async function profileNames(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const { data } = await withTimeout(supabase.from('profiles').select('id, full_name').in('id', ids));
  return Object.fromEntries((data ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
}

/** Borra una foto subida que no quedó ligada a ningún reporte. */
export async function removePhoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Sube la foto (si hay) y registra el reporte. ERR-02: si el registro falla
 * (por ejemplo, por el límite de 10 reportes por hora), se borra la foto para
 * no dejar archivos huérfanos en el almacenamiento.
 */
export async function submitReport(input: {
  userId: string;
  category: Category;
  location: string;
  description: string;
  localPhoto: string | null;
}): Promise<Report> {
  const photoPath = input.localPhoto ? await uploadPhoto(input.userId, input.localPhoto) : null;
  try {
    return await createReport({ category: input.category, location: input.location, description: input.description, photoPath });
  } catch (e) {
    if (photoPath) await removePhoto(photoPath).catch(() => undefined);
    throw e;
  }
}
