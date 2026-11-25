import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Button, C, fmtDate, StatusChip } from '@/components/ui';
import { isStaff, useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { listReports, profileNames } from '@/lib/reports';
import { supabase } from '@/lib/supabase';
import { categoryLabel, type Report } from '@/lib/types';
import { useOnline } from '@/lib/useOnline';

export default function Reportes() {
  const { profile } = useAuth();
  const staff = isStaff(profile);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Report[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReports();
      setItems(data);
      if (staff) setNames(await profileNames([...new Set(data.map((r) => r.user_id))]));
    } catch (e) {
      setError(friendlyError(e)); // se conserva la última lista cargada
    } finally {
      setLoading(false);
    }
  }, [staff]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: staff ? 'Todos los reportes' : 'Mis reportes',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Pressable onPress={() => router.push('/acerca')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Acerca de">
                <Text style={{ color: '#fff', fontSize: 15 }}>Acerca de</Text>
              </Pressable>
              <Pressable onPress={logout} hitSlop={10} accessibilityRole="button">
                <Text style={{ color: '#fff', fontSize: 15 }}>Salir</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <Text style={{ color: C.muted, marginBottom: 12 }}>
              {profile ? `${profile.full_name} · ${profile.role === 'reportante' ? 'Reportante' : profile.role === 'admin' ? 'Administrador' : 'Mantenimiento'}` : ''}
            </Text>
            {online === false && <Banner kind="warn">Sin conexión. Se muestra la última información cargada; desliza hacia abajo para reintentar.</Banner>}
            {error && <Banner>{error}</Banner>}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={{ textAlign: 'center', color: C.muted, marginTop: 40 }}>
              {staff ? 'No hay reportes registrados.' : 'Aún no tienes reportes. Crea el primero con el botón de abajo.'}
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: item.id } })}
            style={({ pressed }) => ({
              backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10,
              borderWidth: 1, borderColor: C.border, opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, flex: 1 }}>{categoryLabel(item.category)}</Text>
              <StatusChip status={item.status} />
            </View>
            <Text style={{ color: C.text, marginTop: 6 }} numberOfLines={1}>{item.location}</Text>
            <Text style={{ color: C.muted, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
              {fmtDate(item.created_at)}
              {staff && names[item.user_id] ? ` · ${names[item.user_id]}` : ''}
              {item.photo_path ? ' · con foto' : ''}
            </Text>
          </Pressable>
        )}
      />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 + insets.bottom }}>
        <Button title="Nuevo reporte" onPress={() => router.push('/nuevo')} />
      </View>
    </View>
  );
}
