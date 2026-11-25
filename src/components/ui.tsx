import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import type { Status } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';

export const C = {
  bg: '#F4F6F9',
  card: '#FFFFFF',
  text: '#1C2430',
  muted: '#5E6B7A',
  border: '#D9DFE7',
  primary: '#1F4E79',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  dangerBg: '#FEECEB',
  warnBg: '#FFF4E5',
  warn: '#8A4B00',
};

export function Button({ title, onPress, loading, variant = 'primary', disabled, style }: {
  title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'secondary'; disabled?: boolean; style?: ViewStyle;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        primary ? { backgroundColor: C.primary } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.primary },
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={primary ? C.primaryText : C.primary} /> : (
        <Text style={[s.btnText, { color: primary ? C.primaryText : C.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#8A96A3" style={[s.input, props.multiline && { minHeight: 110, textAlignVertical: 'top' }]} {...props} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Banner({ kind = 'error', children }: { kind?: 'error' | 'warn'; children: ReactNode }) {
  const err = kind === 'error';
  return (
    <View style={[s.banner, { backgroundColor: err ? C.dangerBg : C.warnBg }]}>
      <Text style={{ color: err ? C.danger : C.warn, fontSize: 14 }}>{children}</Text>
    </View>
  );
}

const STATUS_COLORS: Record<Status, [string, string]> = {
  abierto: ['#FDECEC', '#9F1D1D'],
  en_proceso: ['#FFF4E5', '#8A4B00'],
  resuelto: ['#E7F6EC', '#17663A'],
};

export function StatusChip({ status }: { status: Status }) {
  const [bg, fg] = STATUS_COLORS[status];
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const s = StyleSheet.create({
  btn: { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: C.text },
  hint: { fontSize: 12, color: C.muted, marginTop: 4 },
  banner: { padding: 12, borderRadius: 10, marginBottom: 14 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
