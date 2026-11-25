import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Banner, Button, C, fmtDate, StatusChip } from '@/components/ui';
import { isStaff, useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { getReport, photoUrl, updateStatus } from '@/lib/reports';
import { categoryLabel, STATUS_LABEL, type Report, type Status } from '@/lib/types';

export default function Detalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const staff = isStaff(profile);
  const [report, setReport] = useState<Report | null>(null);
  const [img, setImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Status | null>(null);

  const load = async () => {
    setError(null);
    try {
      const r = await getReport(String(id));
      // Si RLS no devuelve la fila (reporte de otro usuario), se trata como no encontrado.
      if (!r) return setError('El reporte no existe o no tienes permiso para verlo.');
      setReport(r);
      if (r.photo_path) setImg(await photoUrl(r.photo_path));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const change = async (status: Status) => {
    if (!report) return;
    setSaving(status);
    setError(null);
    try {
      await updateStatus(report.id, status);
      await load();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.primary} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {error && <Banner>{error}</Banner>}
      {report && (
        <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, flex: 1 }}>{categoryLabel(report.category)}</Text>
            <StatusChip status={report.status} />
          </View>
          <Text style={{ color: C.muted, marginTop: 12 }}>Ubicación</Text>
          <Text style={{ color: C.text, fontSize: 16 }}>{report.location}</Text>
          <Text style={{ color: C.muted, marginTop: 12 }}>Descripción</Text>
          <Text style={{ color: C.text, fontSize: 16 }}>{report.description}</Text>
          <Text style={{ color: C.muted, marginTop: 12 }}>Registrado</Text>
          <Text style={{ color: C.text }}>{fmtDate(report.created_at)}</Text>
          {report.updated_at !== report.created_at && (
            <>
              <Text style={{ color: C.muted, marginTop: 12 }}>Última actualización</Text>
              <Text style={{ color: C.text }}>{fmtDate(report.updated_at)}</Text>
            </>
          )}
          {report.photo_path && (
            <>
              <Text style={{ color: C.muted, marginTop: 12, marginBottom: 6 }}>Evidencia</Text>
              {img ? (
                <Image source={{ uri: img }} style={{ width: '100%', height: 240, borderRadius: 10 }} resizeMode="cover" />
              ) : (
                <Text style={{ color: C.muted }}>No se pudo cargar la foto.</Text>
              )}
            </>
          )}
        </View>
      )}
      {report && staff && (
        <View style={{ marginTop: 20, gap: 10 }}>
          <Text style={{ fontWeight: '600', color: C.text }}>Cambiar estado</Text>
          {(['abierto', 'en_proceso', 'resuelto'] as Status[])
            .filter((s) => s !== report.status)
            .map((s) => (
              <Button key={s} title={`Marcar como ${STATUS_LABEL[s].toLowerCase()}`} variant="secondary" loading={saving === s} onPress={() => change(s)} />
            ))}
        </View>
      )}
    </ScrollView>
  );
}
