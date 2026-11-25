import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Aviso } from "@/components/ui";
import { cores } from "@/constants/tema";
import type { PerfilDemo } from "@/constants/tour";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/contexts/TourContext";
import { entrarDemo, mensagemDeErro } from "@/services/api";

const OPCOES: { perfil: PerfilDemo; titulo: string; texto: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  {
    perfil: "aluno",
    titulo: "Sou aluno",
    texto: "Veja como bater o ponto com QR Code, selfie, GPS e Wi-Fi e acompanhar suas horas.",
    icone: "school-outline",
  },
  {
    perfil: "professor",
    titulo: "Sou professor",
    texto: "Veja como acompanhar os estagiários, conferir as selfies e gerar o QR Code do local.",
    icone: "briefcase-outline",
  },
];

/** Escolha do perfil para o modo demonstração (tour guiado com dados de exemplo). */
export default function Demonstracao() {
  const router = useRouter();
  const { entrarComToken } = useAuth();
  const { iniciar } = useTour();
  const [carregando, setCarregando] = useState<PerfilDemo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(perfil: PerfilDemo) {
    setErro(null);
    setCarregando(perfil);
    try {
      const resposta = await entrarDemo(perfil);
      await entrarComToken(resposta.access_token);
      iniciar(perfil, resposta.id_contrato_demo, resposta.id_local_demo);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setCarregando(null);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.conteudo}>
        <Text style={estilos.titulo}>Conheça o CheckPoint</Text>
        <Text style={estilos.subtitulo}>
          Escolha um perfil. O app mostra, passo a passo e com destaque piscando, como cada função funciona — com
          dados de exemplo.
        </Text>

        {OPCOES.map((opcao) => (
          <Pressable
            key={opcao.perfil}
            onPress={() => void escolher(opcao.perfil)}
            disabled={carregando !== null}
            style={({ pressed }) => [estilos.opcao, pressed && { opacity: 0.85 }]}
          >
            <View style={estilos.icone}>
              <Ionicons name={opcao.icone} size={30} color={cores.primaria} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={estilos.opcaoTitulo}>{opcao.titulo}</Text>
              <Text style={estilos.opcaoTexto}>{opcao.texto}</Text>
            </View>
            {carregando === opcao.perfil ? (
              <ActivityIndicator color={cores.primaria} />
            ) : (
              <Ionicons name="chevron-forward" size={22} color={cores.textoSuave} />
            )}
          </Pressable>
        ))}

        <Aviso tipo="erro" texto={erro} />

        <Pressable onPress={() => router.replace("/login")} style={estilos.voltar}>
          <Text style={estilos.voltarTexto}>Voltar para o login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flex: 1, justifyContent: "center", padding: 20, gap: 16 },
  titulo: { fontSize: 28, fontWeight: "800", color: cores.texto, textAlign: "center" },
  subtitulo: { fontSize: 15, color: cores.textoSuave, textAlign: "center", lineHeight: 21 },
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  icone: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
  },
  opcaoTitulo: { fontSize: 17, fontWeight: "800", color: cores.texto },
  opcaoTexto: { fontSize: 14, color: cores.textoSuave, lineHeight: 19 },
  voltar: { alignItems: "center", padding: 8 },
  voltarTexto: { color: cores.primaria, fontWeight: "700" },
});
