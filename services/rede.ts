import NetInfo from "@react-native-community/netinfo";

// Pede ao sistema o nome da rede Wi-Fi (no iOS isso exige permissão de localização).
NetInfo.configure({ shouldFetchWiFiSSID: true });

export interface WifiAtual {
  ssid: string | null;
  bssid: string | null;
}

/**
 * Wi-Fi em que o celular está conectado agora, ou null se não estiver em Wi-Fi.
 * Observações:
 * - Android: precisa da permissão de localização concedida (pedimos antes, no GPS).
 * - iPhone (Expo Go): o sistema não libera o nome da rede; use o "IP público" no local.
 */
export async function lerWifiAtual(): Promise<WifiAtual | null> {
  try {
    const estado = await NetInfo.fetch();
    if (estado.type !== "wifi") return null;
    const ssid = estado.details.ssid && estado.details.ssid !== "<unknown ssid>" ? estado.details.ssid : null;
    return { ssid, bssid: estado.details.bssid ?? null };
  } catch {
    return null;
  }
}
