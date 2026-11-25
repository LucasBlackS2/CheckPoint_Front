import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { cores } from "@/constants/tema";

// ----------------------------------------------------------------- Tela

export function Tela({
  children,
  atualizando,
  aoAtualizar,
}: {
  children: ReactNode;
  atualizando?: boolean;
  aoAtualizar?: () => void;
}) {
  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.telaConteudo}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        aoAtualizar ? <RefreshControl refreshing={!!atualizando} onRefresh={aoAtualizar} /> : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Carregando() {
  return (
    <View style={estilos.centro}>
      <ActivityIndicator size="large" color={cores.primaria} />
    </View>
  );
}

// ---------------------------------------------------------------- Cartão

export function Cartao({ children, estilo }: { children: ReactNode; estilo?: ViewStyle }) {
  return <View style={[estilos.cartao, estilo]}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function TextoSuave({ children }: { children: ReactNode }) {
  return <Text style={estilos.textoSuave}>{children}</Text>;
}

export function Linha({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <View style={estilos.linha}>
      <Text style={estilos.textoSuave}>{rotulo}</Text>
      <Text style={estilos.linhaValor}>{valor}</Text>
    </View>
  );
}

// ----------------------------------------------------------------- Botão

type VarianteBotao = "primario" | "secundario" | "perigo" | "sucesso";

export function Botao({
  titulo,
  aoPressionar,
  carregando,
  desabilitado,
  variante = "primario",
}: {
  titulo: string;
  aoPressionar: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: VarianteBotao;
}) {
  const inativo = desabilitado || carregando;
  const fundo = {
    primario: cores.primaria,
    secundario: cores.primariaClara,
    perigo: cores.perigo,
    sucesso: cores.sucesso,
  }[variante];
  const corTexto = variante === "secundario" ? cores.primaria : "#FFFFFF";

  return (
    <Pressable
      onPress={aoPressionar}
      disabled={inativo}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundo, opacity: inativo ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.botaoTexto, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

// ----------------------------------------------------------------- Campo

export function Campo({ rotulo, ...props }: TextInputProps & { rotulo: string }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <TextInput placeholderTextColor={cores.textoSuave} style={estilos.campoInput} {...props} />
    </View>
  );
}

// ----------------------------------------------------------------- Aviso

export type TipoAviso = "erro" | "sucesso" | "info";

export function Aviso({ tipo, texto }: { tipo: TipoAviso; texto: string | null }) {
  if (!texto) return null;
  const paleta = {
    erro: [cores.perigoClaro, cores.perigo],
    sucesso: [cores.sucessoClaro, cores.sucesso],
    info: [cores.alertaClaro, cores.alerta],
  }[tipo];
  return (
    <View style={[estilos.aviso, { backgroundColor: paleta[0] }]}>
      <Text style={{ color: paleta[1], fontWeight: "600" }}>{texto}</Text>
    </View>
  );
}

// -------------------------------------------------------- Barra de progresso

export function BarraProgresso({ percentual }: { percentual: number }) {
  const valor = Math.max(0, Math.min(100, percentual));
  return (
    <View style={estilos.barraFundo}>
      <View style={[estilos.barraPreenchida, { width: `${valor}%` as const }]} />
    </View>
  );
}

// ------------------------------------------------------------------ Chips

export function Chips<T extends string | number>({
  opcoes,
  selecionado,
  aoSelecionar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  selecionado: T | null;
  aoSelecionar: (valor: T) => void;
}) {
  return (
    <View style={estilos.chips}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === selecionado;
        return (
          <Pressable
            key={String(opcao.valor)}
            onPress={() => aoSelecionar(opcao.valor)}
            style={[estilos.chip, ativo && estilos.chipAtivo]}
          >
            <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}>{opcao.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Selo({ texto, cor }: { texto: string; cor: "verde" | "cinza" | "azul" }) {
  const paleta = {
    verde: [cores.sucessoClaro, cores.sucesso],
    cinza: ["#EEF0F4", cores.textoSuave],
    azul: [cores.primariaClara, cores.primaria],
  }[cor];
  return (
    <View style={[estilos.selo, { backgroundColor: paleta[0] }]}>
      <Text style={{ color: paleta[1], fontSize: 12, fontWeight: "700" }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  telaConteudo: { padding: 16, gap: 12, paddingBottom: 40 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cores.fundo },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  titulo: { fontSize: 18, fontWeight: "700", color: cores.texto },
  textoSuave: { color: cores.textoSuave, fontSize: 14 },
  linha: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  linhaValor: { color: cores.texto, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  botao: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  botaoTexto: { fontSize: 16, fontWeight: "700" },
  campo: { gap: 6 },
  campoRotulo: { color: cores.texto, fontWeight: "600" },
  campoInput: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: cores.texto,
  },
  aviso: { borderRadius: 10, padding: 12 },
  barraFundo: { height: 12, borderRadius: 6, backgroundColor: cores.primariaClara, overflow: "hidden" },
  barraPreenchida: { height: "100%", backgroundColor: cores.primaria, borderRadius: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: "#FFFFFF",
  },
  chipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipTexto: { color: cores.texto },
  chipTextoAtivo: { color: "#FFFFFF", fontWeight: "700" },
  selo: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
});
