import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Destaque } from "@/components/Destaque";
import { Aviso, BarraProgresso, Carregando, Cartao, Selo, Tela, TextoSuave } from "@/components/ui";
import { cores } from "@/constants/tema";
import * as api from "@/services/api";
import type { Contrato, ResumoHoras } from "@/types/api";
import { formatarMinutos } from "@/utils/formatar";

interface ItemContrato {
  contrato: Contrato;
  resumo: ResumoHoras | null;
}

export default function Contratos() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemContrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarEncerrados, setMostrarEncerrados] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const contratos = await api.listarContratos();
      const resumos = await Promise.all(
        contratos.map((c) => api.buscarResumoContrato(c.id).catch(() => null))
      );
      setItens(contratos.map((contrato, i) => ({ contrato, resumo: resumos[i] })));
      setErro(null);
    } catch (e) {
      setErro(api.mensagemDeErro(e));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  if (carregando) return <Carregando />;

  const visiveis = itens.filter((i) => mostrarEncerrados || i.contrato.status);
  const emAndamento = itens.filter((i) => i.resumo?.ponto_aberto).length;

  return (
    <Tela
      atualizando={atualizando}
      aoAtualizar={() => {
        setAtualizando(true);
        void carregar();
      }}
    >
      <Aviso tipo="erro" texto={erro} />
      <Destaque id="prof-resumo">
        <Cartao>
          <TextoSuave>
            {itens.filter((i) => i.contrato.status).length} contrato(s) ativo(s) · {emAndamento} aluno(s) no estágio
            agora
          </TextoSuave>
        </Cartao>
      </Destaque>

      {visiveis.length === 0 ? (
        <Cartao>
          <TextoSuave>Nenhum contrato ainda. Crie um na aba Cadastros.</TextoSuave>
        </Cartao>
      ) : (
        visiveis.map(({ contrato, resumo }, posicao) => (
          <Destaque key={contrato.id} id={posicao === 0 ? "prof-estagiario" : `estagiario-${contrato.id}`}>
          <Pressable
            onPress={() => router.push({ pathname: "/contrato/[id]", params: { id: String(contrato.id) } })}
          >
            <Cartao>
              <View style={estilos.topo}>
                <Text style={estilos.nome}>{contrato.aluno.nome}</Text>
                {!contrato.status ? (
                  <Selo texto="Encerrado" cor="cinza" />
                ) : resumo?.ponto_aberto ? (
                  <Selo texto="No estágio agora" cor="verde" />
                ) : null}
              </View>
              <TextoSuave>
                {contrato.endereco.logradouro}, {contrato.endereco.cidade} · Orientador: {contrato.professor.nome}
              </TextoSuave>
              {resumo ? (
                <>
                  {resumo.percentual != null ? <BarraProgresso percentual={resumo.percentual} /> : null}
                  <Text style={estilos.horas}>
                    {formatarMinutos(resumo.minutos_cumpridos)}
                    {resumo.carga_horaria_total != null
                      ? ` de ${resumo.carga_horaria_total}h (${resumo.percentual?.toFixed(1)}%)`
                      : " cumpridas"}
                  </Text>
                </>
              ) : null}
            </Cartao>
          </Pressable>
          </Destaque>
        ))
      )}

      {itens.some((i) => !i.contrato.status) ? (
        <Pressable onPress={() => setMostrarEncerrados((v) => !v)}>
          <Text style={estilos.link}>{mostrarEncerrados ? "Ocultar encerrados" : "Mostrar contratos encerrados"}</Text>
        </Pressable>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nome: { fontSize: 17, fontWeight: "700", color: cores.texto, flexShrink: 1 },
  horas: { color: cores.texto, fontWeight: "600" },
  link: { color: cores.primaria, fontWeight: "700", textAlign: "center", padding: 8 },
});
