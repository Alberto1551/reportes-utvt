/// <reference types="jest" />
import { friendlyError, withTimeout } from '@/lib/errors';

describe('Mensajes de error (friendlyError)', () => {
  it('traduce la falta de red', () => {
    expect(friendlyError(new Error('Network request failed'))).toMatch(/No hay conexión/);
  });
  it('traduce credenciales incorrectas', () => {
    expect(friendlyError({ message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
  });
  it('traduce un rechazo de permisos (RLS)', () => {
    expect(friendlyError({ message: 'new row violates row-level security policy' })).toMatch(/permiso/);
  });
  it('no muestra detalles técnicos de errores desconocidos', () => {
    const msg = friendlyError(new Error('duplicate key value violates unique constraint "reports_pkey"'));
    expect(msg).toBe('Ocurrió un error. Inténtalo de nuevo en unos momentos.');
    expect(msg).not.toMatch(/reports_pkey/);
  });
});

describe('Tiempo de espera (withTimeout)', () => {
  afterEach(() => jest.useRealTimers());

  it('rechaza si el servidor no responde a tiempo', async () => {
    jest.useFakeTimers();
    const lenta = new Promise(() => {});
    const p = withTimeout(lenta, 1000);
    jest.advanceTimersByTime(1000);
    await expect(p).rejects.toThrow('Tiempo de espera agotado');
  });

  it('no deja temporizadores pendientes cuando la respuesta llega a tiempo', async () => {
    jest.useFakeTimers();
    await withTimeout(Promise.resolve('ok'), 15000);
    expect(jest.getTimerCount()).toBe(0);
  });
});
