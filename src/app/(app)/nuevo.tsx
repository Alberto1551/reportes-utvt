import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Banner, Button, C, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { askCamera, askLocation, currentCoords } from '@/lib/permissions';
import { submitReport } from '@/lib/reports';
import { CATEGORIES, type Category } from '@/lib/types';
import { isOnlineNow } from '@/lib/useOnline';
import { validateReport } from '@/lib/validation';

export default function Nuevo() {
  const { session } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [permMsg, setPermMsg] = useState<{ text: string; settings: boolean } | null>(null);
  const [locating, setLocating] = useState(false);

  const pick = async (fromCamera: boolean) => {
    setError(null);
    setPermMsg(null);
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true };
    if (fromCamera) {
      const perm = await askCamera();
      if (!perm.granted) {
        return setPermMsg({
          text: 'No diste permiso para usar la cámara. Puedes adjuntar una foto que ya tengas con el botón Galería o enviar el reporte sin foto.',
          settings: !perm.canAskAgain,
        });
      }
    }
    // La galería usa el selector de fotos del sistema: no necesita permiso de almacenamiento.
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].uri);
  };

  const useMyLocation = async () => {
    setError(null);
    setPermMsg(null);
    const perm = await askLocation();
    if (!perm.granted) {
      return setPermMsg({
        text: 'No diste permiso de ubicación. Escribe el edificio y el salón en el campo Ubicación.',
        settings: !perm.canAskAgain,
      });
    }
    setLocating(true);
    try {
      const coords = await currentCoords();
      setLocation((prev) => (prev.trim() ? `${prev.trim()} · ${coords}` : coords).slice(0, 120));
    } catch {
      setPermMsg({ text: 'No se pudo obtener la ubicación. Escríbela en el campo Ubicación.', settings: false });
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    setError(null);
    const invalid = validateReport({ category, location, description });
    if (invalid) return setError(invalid);
    if (!session) return router.replace('/login');
    // Sin internet no se intenta enviar; el formulario conserva lo escrito para reintentar.
    if (!(await isOnlineNow())) return setError('Sin conexión a internet. Tu reporte no se ha enviado; conéctate y vuelve a tocar "Enviar reporte".');
    setSending(true);
    try {
      await submitReport({ userId: session.user.id, category: category!, location, description, localPhoto: photo });
      Alert.alert('Reporte enviado', 'Tu reporte quedó registrado como "Abierto".');
      router.back();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {error && <Banner>{error}</Banner>}
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 }}>Tipo de problema</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {CATEGORIES.map((c) => {
          const on = category === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                borderColor: on ? C.primary : C.border, backgroundColor: on ? C.primary : C.card }}
            >
              <Text style={{ color: on ? '#fff' : C.text }}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field label="Ubicación" value={location} onChangeText={setLocation} placeholder="Ej. Edificio D, salón 204" maxLength={120} />
      <Button title="Usar mi ubicación" variant="secondary" onPress={useMyLocation} loading={locating} style={{ marginTop: -6, marginBottom: 4 }} />
      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Tu ubicación solo se usa para registrar dónde está la falla.</Text>
      {permMsg && (
        <View style={{ marginBottom: 14 }}>
          <Banner kind="warn">{permMsg.text}</Banner>
          {permMsg.settings && <Button title="Abrir configuración" variant="secondary" onPress={() => Linking.openSettings()} />}
        </View>
      )}
      <Field label="Descripción" value={description} onChangeText={setDescription} multiline maxLength={1000}
        placeholder="¿Qué pasa y desde cuándo?" hint={`${description.trim().length}/1000 · mínimo 10 caracteres`} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 }}>Evidencia fotográfica (opcional)</Text>
      {photo ? (
        <View style={{ marginBottom: 12 }}>
          <Image source={{ uri: photo }} style={{ width: '100%', height: 200, borderRadius: 10 }} resizeMode="cover" />
          <Pressable onPress={() => setPhoto(null)} style={{ marginTop: 6 }}>
            <Text style={{ color: C.danger }}>Quitar foto</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Button title="Tomar foto" variant="secondary" onPress={() => pick(true)} style={{ flex: 1 }} />
        <Button title="Galería" variant="secondary" onPress={() => pick(false)} style={{ flex: 1 }} />
      </View>
      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>La fecha de registro la asigna el servidor al enviar.</Text>
      <Button title="Enviar reporte" onPress={submit} loading={sending} />
    </ScrollView>
  );
}
