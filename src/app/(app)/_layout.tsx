import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { C } from '@/components/ui';

/** Todas las pantallas de este grupo requieren sesión iniciada. */
export default function AppLayout() {
  const { session, loading } = useAuth();
  if (!loading && !session) return <Redirect href="/login" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="reportes" options={{ title: 'Reportes', headerBackVisible: false }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo reporte' }} />
      <Stack.Screen name="reporte/[id]" options={{ title: 'Detalle del reporte' }} />
    </Stack>
  );
}
