import Constants from 'expo-constants';
import { Linking, Platform, ScrollView, Text, View } from 'react-native';
import { C } from '@/components/ui';

const SOPORTE = (Constants.expoConfig?.extra?.supportEmail as string | undefined) ?? 'soporte.reportes@utvtol.edu.mx';

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 8 }}>{titulo}</Text>
      {children}
    </View>
  );
}
const P = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: C.text, fontSize: 14, lineHeight: 20, marginBottom: 6 }}>{children}</Text>
);

/** Versión instalada, contacto de soporte y política de privacidad (se ve con o sin sesión). */
export default function Acerca() {
  const version = Constants.expoConfig?.version ?? '—';
  const id = Platform.OS === 'android' ? Constants.expoConfig?.android?.package : Constants.expoConfig?.ios?.bundleIdentifier;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Bloque titulo="Reportes UTVT">
        <P>Versión {version}</P>
        <P>Identificador: {id ?? '—'}</P>
        <P>Plataforma: {Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : 'Web'}</P>
      </Bloque>
      <Bloque titulo="Soporte">
        <P>¿Algo no funciona? Escríbenos y menciona la versión de la app.</P>
        <Text accessibilityRole="link" onPress={() => Linking.openURL(`mailto:${SOPORTE}?subject=Reportes UTVT ${version}`)}
          style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>{SOPORTE}</Text>
      </Bloque>
      <Bloque titulo="Política de privacidad">
        <P>Responsable: Universidad Tecnológica del Valle de Toluca, a través del área de mantenimiento.</P>
        <P>Datos que se recaban: nombre, correo institucional, los reportes que registras, la foto de evidencia y, si lo autorizas, la ubicación aproximada de la falla.</P>
        <P>Para qué se usan: solo para atender y dar seguimiento a los reportes de mantenimiento. No se venden ni se comparten con terceros.</P>
        <P>Permisos: la cámara solo para la foto del reporte y la ubicación solo mientras usas la app. Ambos son opcionales y puedes quitarlos en los ajustes del teléfono.</P>
        <P>Seguridad: la información viaja cifrada (HTTPS); cada usuario solo ve sus reportes y la sesión se guarda cifrada en el teléfono.</P>
        <P>Tus derechos: puedes pedir acceso, corrección o eliminación de tus datos y de tu cuenta escribiendo a {SOPORTE}, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</P>
      </Bloque>
    </ScrollView>
  );
}
