import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Banner, Button, C, Field } from '@/components/ui';
import { friendlyError, withTimeout } from '@/lib/errors';
import { isConfigured, supabase } from '@/lib/supabase';
import { isOnlineNow } from '@/lib/useOnline';
import { validateLogin } from '@/lib/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const invalid = validateLogin(email, password);
    if (invalid) return setError(invalid);
    if (!(await isOnlineNow())) return setError('Sin conexión a internet. Conéctate e inténtalo de nuevo.');
    setLoading(true);
    try {
      const { error: e } = await withTimeout(supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }));
      if (e) throw e;
      setPassword('');
      router.replace('/reportes');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 26, fontWeight: '700', color: C.primary }}>Reportes UTVT</Text>
        <Text style={{ fontSize: 15, color: C.muted, marginTop: 4, marginBottom: 24 }}>
          Reporta fallas de cómputo, iluminación, mobiliario, internet o electricidad y sigue su atención.
        </Text>
        {!isConfigured && <Banner kind="warn">Falta configurar Supabase en el archivo .env.</Banner>}
        {error && <Banner>{error}</Banner>}
        <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="tu_correo@utvtol.edu.mx" />
        <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Mínimo 8 caracteres" onSubmitEditing={onSubmit} />
        <Button title="Iniciar sesión" onPress={onSubmit} loading={loading} />
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Link href="/registro" style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>
            ¿No tienes cuenta? Crear una
          </Link>
          <Link href="/acerca" style={{ color: C.muted, fontSize: 14, marginTop: 16 }}>
            Acerca de, soporte y privacidad
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
