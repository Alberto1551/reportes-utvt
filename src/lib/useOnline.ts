import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** true si hay conexión a internet; null mientras se averigua. */
export function useOnline() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => NetInfo.addEventListener((s) => setOnline(Boolean(s.isConnected && s.isInternetReachable !== false))), []);
  return online;
}

export async function isOnlineNow() {
  const s = await NetInfo.fetch();
  return Boolean(s.isConnected && s.isInternetReachable !== false);
}
