/// <reference types="jest" />
import { validateLogin, validateReport, validateSignup } from '@/lib/validation';

describe('Inicio de sesión (validateLogin)', () => {
  it('acepta un correo y contraseña válidos', () => {
    expect(validateLogin('alberto@utvtol.edu.mx', 'clave1234')).toBeNull();
  });
  it('rechaza un correo sin @', () => {
    expect(validateLogin('albertoutvtol.edu.mx', 'clave1234')).toBe('Escribe un correo válido.');
  });
  it('rechaza el correo vacío', () => {
    expect(validateLogin('', 'clave1234')).toBe('Escribe un correo válido.');
  });
  it('rechaza una contraseña de menos de 8 caracteres', () => {
    expect(validateLogin('alberto@utvtol.edu.mx', '1234')).toBe('La contraseña debe tener al menos 8 caracteres.');
  });
});

describe('Registro de usuario (validateSignup)', () => {
  it('pide nombre completo', () => {
    expect(validateSignup('Al', 'alberto@utvtol.edu.mx', 'clave1234')).toBe('Escribe tu nombre completo.');
  });
  it('pide letras y números en la contraseña', () => {
    expect(validateSignup('Alberto Jiménez', 'alberto@utvtol.edu.mx', 'solamenteletras')).toBe(
      'La contraseña debe tener letras y números.',
    );
  });
});

describe('Registro de reporte (validateReport)', () => {
  const ok = { category: 'iluminacion' as const, location: 'Edificio D, salón 204', description: 'La lámpara del fondo está fundida.' };
  it('acepta un reporte completo', () => {
    expect(validateReport(ok)).toBeNull();
  });
  it('no deja enviar sin tipo de problema', () => {
    expect(validateReport({ ...ok, category: null })).toBe('Elige el tipo de problema.');
  });
  it('no deja enviar con la ubicación vacía', () => {
    expect(validateReport({ ...ok, location: '   ' })).toMatch(/ubicación/);
  });
  it('no deja enviar una descripción de solo espacios', () => {
    expect(validateReport({ ...ok, description: '              ' })).toMatch(/descripción/);
  });
});
