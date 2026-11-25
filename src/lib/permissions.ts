import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export type PermResult = { granted: boolean; canAskAgain: boolean };

/** Pide la cámara solo cuando el usuario toca "Tomar foto". */
export async function askCamera(): Promise<PermResult> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return { granted: true, canAskAgain: true };
  const r = await ImagePicker.requestCameraPermissionsAsync();
  return { granted: r.granted, canAskAgain: r.canAskAgain };
}

/** Pide la ubicación (solo mientras se usa la app) cuando el usuario toca "Usar mi ubicación". */
export async function askLocation(): Promise<PermResult> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return { granted: true, canAskAgain: true };
  const r = await Location.requestForegroundPermissionsAsync();
  return { granted: r.granted, canAskAgain: r.canAskAgain };
}

export async function currentCoords(): Promise<string> {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude, accuracy } = pos.coords;
  return `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracy ? ` (±${Math.round(accuracy)} m)` : ''}`;
}
