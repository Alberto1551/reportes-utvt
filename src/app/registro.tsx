import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Banner, Button, Field } from '@/components/ui';
import { friendlyError, withTimeout } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { isOnlineNow } from '@/lib/useOnline';
import { validateSignup } from '@/lib/validation';

export default function Registro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    const invalid = validateSignup(name, email, password);
    if (invalid) return setError(invalid);
    if (!(await isOnlineNow())) return setError('Sin conexión a internet. Conéctate e inténtalo de nuevo.');
    setLoading(true);
    try {
      // Solo se manda el nombre; el rol siempre lo pone el servidor como "reportante".
      const { data, error: e } = await withTimeout(
        supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim() } } }),
      );
      if (e) throw e;
      if (data.session) router.replace('/reportes');
      else setInfo('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      {error && <Banner>{error}</Banner>}
      {info && <Banner kind="warn">{info}</Banner>}
      <Field label="Nombre completo" value={name} onChangeText={setName} autoComplete="name" />
      <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry hint="Mínimo 8 caracteres, con letras y números." />
      <Button title="Crear cuenta" onPress={onSubmit} loading={loading} />
    </ScrollView>
  );
}
