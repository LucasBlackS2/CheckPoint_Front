import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageStyle, Platform, StyleProp, View } from "react-native";

import { cores } from "@/constants/tema";
import { api, API_URL, obterToken } from "@/services/api";

/**
 * Mostra uma imagem protegida da API (selfie, QR Code), enviando o token.
 * No celular o <Image> aceita cabeçalhos; no navegador baixamos a imagem antes.
 */
export function ImagemAutenticada({ caminho, estilo }: { caminho: string; estilo: StyleProp<ImageStyle> }) {
  const [urlWeb, setUrlWeb] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let url: string | null = null;
    let cancelado = false;
    api
      .get<Blob>(caminho, { responseType: "blob" })
      .then(({ data }) => {
        if (cancelado) return;
        url = URL.createObjectURL(data);
        setUrlWeb(url);
      })
      .catch(() => setUrlWeb(null));
    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [caminho]);

  if (Platform.OS === "web") {
    if (!urlWeb) {
      return (
        <View style={[estilo, { alignItems: "center", justifyContent: "center", backgroundColor: cores.fundo }]}>
          <ActivityIndicator color={cores.primaria} />
        </View>
      );
    }
    return <Image source={{ uri: urlWeb }} style={estilo} />;
  }

  return (
    <Image
      source={{ uri: `${API_URL}${caminho}`, headers: { Authorization: `Bearer ${obterToken() ?? ""}` } }}
      style={estilo}
    />
  );
}
