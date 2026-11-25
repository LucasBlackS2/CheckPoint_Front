import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// No celular o token fica no armazenamento seguro do sistema.
// No navegador (expo web) usamos o localStorage.
const CHAVE_TOKEN = "checkpoint_token";

export async function salvarToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(CHAVE_TOKEN, token);
    return;
  }
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(CHAVE_TOKEN);
  }
  return SecureStore.getItemAsync(CHAVE_TOKEN);
}

export async function apagarToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(CHAVE_TOKEN);
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
}
