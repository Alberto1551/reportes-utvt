/// <reference types="jest" />
const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload: mockUpload, remove: mockRemove }) },
    from: () => ({ insert: () => ({ select: () => ({ single: mockSingle }) }) }),
  },
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({
      resize: jest.fn(),
      renderAsync: async () => ({ saveAsync: async () => ({ base64: 'aGVsbG8=' }) }),
    }),
  },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'foto-123' }));

import { submitReport } from '@/lib/reports';

const datos = { userId: 'u1', category: 'iluminacion' as const, location: 'Edificio D, salón 204', description: 'La lámpara del fondo está fundida.' };

beforeEach(() => {
  jest.clearAllMocks();
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
});

describe('Envío de reporte con foto (submitReport)', () => {
  it('sube la foto y registra el reporte', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'r1', status: 'abierto' }, error: null });
    const r = await submitReport({ ...datos, localPhoto: 'file:///foto.jpg' });
    expect(r.id).toBe('r1');
    expect(mockUpload).toHaveBeenCalledWith('u1/foto-123.jpg', expect.anything(), expect.objectContaining({ contentType: 'image/jpeg' }));
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('borra la foto si el servidor rechaza el reporte (límite de 10 por hora)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Límite de 10 reportes por hora alcanzado' } });
    await expect(submitReport({ ...datos, localPhoto: 'file:///foto.jpg' })).rejects.toEqual({
      message: 'Límite de 10 reportes por hora alcanzado',
    });
    expect(mockRemove).toHaveBeenCalledWith(['u1/foto-123.jpg']);
  });

  it('sin foto no intenta subir ni borrar archivos', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'r2' }, error: null });
    await submitReport({ ...datos, localPhoto: null });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
