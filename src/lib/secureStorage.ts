import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore no existe en web; en el navegador (solo para pruebas) se usa AsyncStorage directo.
const isWeb = Platform.OS === 'web';

/**
 * Almacenamiento cifrado para la sesión de Supabase.
 *
 * SecureStore (Keystore de Android / Keychain de iOS) solo acepta valores pequeños,
 * y la sesión de Supabase puede superar ese tamaño. Por eso:
 *  - la llave AES-256 aleatoria se guarda en SecureStore;
 *  - la sesión se guarda cifrada (AES-CTR) en AsyncStorage.
 * Así, aunque alguien lea AsyncStorage, no obtiene el token.
 */
export class LargeSecureStore {
  private async encrypt(key: string, value: string) {
    const encryptionKey = Crypto.getRandomBytes(256 / 8);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(key: string) {
    if (isWeb) return AsyncStorage.getItem(key);
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(key, encrypted);
  }

  async setItem(key: string, value: string) {
    if (isWeb) return AsyncStorage.setItem(key, value);
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string) {
    if (isWeb) return AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}
