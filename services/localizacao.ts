import * as Location from "expo-location";

import type { Localizacao } from "@/types/api";

/** Pede permissão e devolve a localização atual do aparelho. */
export async function obterLocalizacaoAtual(): Promise<Localizacao> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permita o acesso à localização para registrar o ponto.");
  }
  const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
}
