import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { LargeSecureStore } from './secureStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey && url.startsWith('https://'));

// Solo la URL del proyecto y la llave pública (anon). Nunca la service_role:
// esa llave salta las políticas RLS y no debe estar en una app instalada en un celular.
export const supabase = createClient(url ?? 'https://sin-configurar.supabase.co', anonKey ?? 'sin-configurar', {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresca el token solo mientras la app está en primer plano.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
