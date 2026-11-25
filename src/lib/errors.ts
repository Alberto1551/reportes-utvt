/** Convierte errores técnicos en mensajes claros sin mostrar detalles internos. */
export function friendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error);
  const msg = raw.toLowerCase();
  if (msg.includes('network request failed') || msg.includes('failed to fetch') || msg.includes('tiempo de espera'))
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (msg.includes('user already registered')) return 'Ese correo ya tiene una cuenta.';
  if (msg.includes('password should be at least')) return 'La contraseña es demasiado corta.';
  if (msg.includes('límite de 10 reportes')) return 'Alcanzaste el límite de 10 reportes por hora. Inténtalo más tarde.';
  if (msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('42501'))
    return 'No tienes permiso para realizar esta acción.';
  if (msg.includes('jwt') || msg.includes('refresh token')) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  return 'Ocurrió un error. Inténtalo de nuevo en unos momentos.';
}

/** Rechaza la promesa si el servidor no responde a tiempo. */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms);
  });
  // ERR-01: se cancela el temporizador cuando la respuesta llega a tiempo.
  return Promise.race([Promise.resolve(promise), limite]).finally(() => clearTimeout(timer));
}
