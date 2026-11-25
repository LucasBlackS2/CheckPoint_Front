import { StyleSheet, Text, View } from "react-native";

import { cores } from "@/constants/tema";
import { caminhoFoto } from "@/services/api";
import type { Ponto } from "@/types/api";
import { formatarData, formatarDistancia, formatarHora, formatarMinutos } from "@/utils/formatar";

import { ImagemAutenticada } from "./ImagemAutenticada";
import { Selo } from "./ui";

export function PontoItem({ ponto }: { ponto: Ponto }) {
  const temFoto = ponto.foto_entrada || ponto.foto_saida;
  return (
    <View style={estilos.item}>
      <View style={estilos.topo}>
        <Text style={estilos.data}>{formatarData(ponto.data)}</Text>
        {ponto.ativo ? (
          <Selo texto="Em andamento" cor="azul" />
        ) : ponto.encerrado_manualmente ? (
          <Selo texto="Fechado pelo professor" cor="cinza" />
        ) : (
          <Selo texto={formatarMinutos(ponto.tempo_trabalhado_minutos)} cor="verde" />
        )}
      </View>
      <Text style={estilos.horarios}>
        Entrada {formatarHora(ponto.hora_entrada)} · Saída {formatarHora(ponto.hora_saida)}
      </Text>
      <Text style={estilos.detalhe}>
        Distância na entrada: {formatarDistancia(ponto.distancia_entrada_metros)}
        {ponto.distancia_saida_metros != null
          ? ` · na saída: ${formatarDistancia(ponto.distancia_saida_metros)}`
          : ""}
      </Text>
      {ponto.wifi_entrada ? <Text style={estilos.detalhe}>Wi-Fi: {ponto.wifi_entrada}</Text> : null}
      {temFoto ? (
        <View style={estilos.fotos}>
          {ponto.foto_entrada ? (
            <View style={estilos.foto}>
              <ImagemAutenticada caminho={caminhoFoto(ponto.id, "entrada")} estilo={estilos.miniatura} />
              <Text style={estilos.legenda}>Entrada</Text>
            </View>
          ) : null}
          {ponto.foto_saida ? (
            <View style={estilos.foto}>
              <ImagemAutenticada caminho={caminhoFoto(ponto.id, "saida")} estilo={estilos.miniatura} />
              <Text style={estilos.legenda}>Saída</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: cores.borda, gap: 4 },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  data: { fontWeight: "700", color: cores.texto, fontSize: 15 },
  horarios: { color: cores.texto },
  detalhe: { color: cores.textoSuave, fontSize: 13 },
  fotos: { flexDirection: "row", gap: 12, marginTop: 4 },
  foto: { alignItems: "center", gap: 2 },
  miniatura: { width: 64, height: 64, borderRadius: 10, backgroundColor: cores.fundo },
  legenda: { fontSize: 11, color: cores.textoSuave },
});
