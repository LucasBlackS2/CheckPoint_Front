import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Aviso, Botao, Campo, Cartao } from "@/components/ui";
import { cores } from "@/constants/tema";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemDeErro } from "@/services/api";

export default function Login() {
  const { entrar } = useAuth();
  const router = useRouter();
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function fazerLogin() {
    setErro(null);
    setEntrando(true);
    try {
      await entrar(matricula, senha);
      // O redirecionamento acontece no _layout quando o usuário é carregado.
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEntrando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={estilos.conteudo}>
        <View style={estilos.cabecalho}>
          <Text style={estilos.logo}>CheckPoint</Text>
          <Text style={estilos.subtitulo}>Ponto eletrônico do estágio</Text>
        </View>

        <Cartao>
          <Campo
            rotulo="Matrícula"
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Sua matrícula"
          />
          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="Sua senha"
            onSubmitEditing={fazerLogin}
          />
          <Aviso tipo="erro" texto={erro} />
          <Botao titulo="Entrar" aoPressionar={fazerLogin} carregando={entrando} desabilitado={!matricula || !senha} />
        </Cartao>

        <Pressable onPress={() => router.push("/demo")} style={estilos.demo}>
          <Text style={estilos.demoTitulo}>Conhecer o app</Text>
          <Text style={estilos.demoTexto}>Modo demonstração: escolha aluno ou professor e veja tudo funcionando.</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flex: 1, justifyContent: "center", padding: 20, gap: 24 },
  cabecalho: { alignItems: "center", gap: 4 },
  logo: { fontSize: 34, fontWeight: "800", color: cores.primaria },
  subtitulo: { color: cores.textoSuave, fontSize: 16 },
  demo: {
    alignItems: "center",
    gap: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#F59E0B",
    borderStyle: "dashed",
  },
  demoTitulo: { color: "#B45309", fontWeight: "800", fontSize: 16 },
  demoTexto: { color: cores.textoSuave, textAlign: "center" },
});
