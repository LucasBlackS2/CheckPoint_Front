import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { cores } from "@/constants/tema";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/contexts/TourContext";
import { NOME_PERFIL } from "@/utils/formatar";

/** Bolinha que pisca ao lado do perfil da demonstração. */
function PontoPiscando() {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, [pulso]);
  return <Animated.View style={[estilos.ponto, { opacity: pulso }]} />;
}

/**
 * Cartão do tour guiado, por cima das telas. Explica a função que está
 * piscando e tem os botões Voltar / Próximo. Fora do tour, numa conta de
 * demonstração, vira uma pílula com "Ver tour" e "Sair".
 */
export function TourCartao() {
  const { usuario, sair } = useAuth();
  const tour = useTour();
  const caminho = usePathname();

  if (!usuario?.demonstracao) return null;
  // Durante a câmera (QR/selfie) o cartão atrapalharia.
  if (caminho.startsWith("/registrar")) return null;

  const perfil = tour.nomePerfil ?? NOME_PERFIL[usuario.tipo_acesso];

  if (!tour.ativo || !tour.passo) {
    return (
      <View style={estilos.pilula} pointerEvents="box-none">
        <PontoPiscando />
        <Text style={estilos.pilulaTexto}>Demonstração · {perfil}</Text>
        {tour.perfil ? (
          <Pressable onPress={tour.reabrir} hitSlop={8}>
            <Text style={estilos.pilulaLink}>Ver tour</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => void sair()} hitSlop={8}>
          <Text style={estilos.pilulaLink}>Sair</Text>
        </Pressable>
      </View>
    );
  }

  const ultimo = tour.indice + 1 >= tour.total;

  return (
    <View style={estilos.cartao}>
      <View style={estilos.topo}>
        <View style={estilos.perfil}>
          <PontoPiscando />
          <Text style={estilos.perfilTexto}>Você está vendo o app como {perfil}</Text>
        </View>
        <Text style={estilos.contador}>
          {tour.indice + 1} de {tour.total}
        </Text>
      </View>
      <Text style={estilos.titulo}>{tour.passo.titulo}</Text>
      <Text style={estilos.texto}>{tour.passo.texto}</Text>
      <View style={estilos.botoes}>
        <Pressable onPress={tour.fechar} hitSlop={8}>
          <Text style={estilos.link}>Pular</Text>
        </Pressable>
        <View style={estilos.botoesDireita}>
          {tour.indice > 0 ? (
            <Pressable onPress={tour.anterior} style={[estilos.botao, estilos.botaoSecundario]}>
              <Text style={[estilos.botaoTexto, { color: cores.primaria }]}>Voltar</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={tour.proximo} style={estilos.botao}>
            <Text style={estilos.botaoTexto}>{ultimo ? "Concluir" : "Próximo"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const LARANJA = "#F59E0B";

const estilos = StyleSheet.create({
  cartao: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 92,
    backgroundColor: "#1B1F2A",
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 2,
    borderColor: LARANJA,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  perfil: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  perfilTexto: { color: LARANJA, fontWeight: "700", fontSize: 12 },
  contador: { color: "#9CA3AF", fontSize: 12 },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: LARANJA },
  titulo: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  texto: { color: "#E5E7EB", fontSize: 14, lineHeight: 20 },
  botoes: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  botoesDireita: { flexDirection: "row", gap: 8 },
  link: { color: "#9CA3AF", fontWeight: "600" },
  botao: { backgroundColor: cores.primaria, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  botaoSecundario: { backgroundColor: cores.primariaClara },
  botaoTexto: { color: "#FFFFFF", fontWeight: "700" },
  pilula: {
    position: "absolute",
    alignSelf: "center",
    bottom: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1B1F2A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: LARANJA,
    elevation: 6,
  },
  pilulaTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  pilulaLink: { color: LARANJA, fontWeight: "700", fontSize: 13 },
});
