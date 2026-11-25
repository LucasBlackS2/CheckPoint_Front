import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Destaque } from "@/components/Destaque";
import { Aviso, BarraProgresso, Botao, Carregando, Cartao, Linha, Tela, TextoSuave, Titulo } from "@/components/ui";
import { cores } from "@/constants/tema";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/services/api";
import { obterLocalizacaoAtual } from "@/services/localizacao";
import type { Ponto, ResumoHoras } from "@/types/api";
import { formatarDistancia, formatarHora, formatarMinutos, minutosDesde } from "@/utils/formatar";

type Mensagem = { tipo: "erro" | "sucesso" | "info"; texto: string } | null;

export default function TelaPonto() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [resumo, setResumo] = useState<ResumoHoras | null>(null);
  const [aberto, setAberto] = useState<Ponto | null>(null);
  const [semContrato, setSemContrato] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [agora, setAgora] = useState(Date.now());

  const carregar = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([api.buscarMeuResumo(), api.buscarPontoAberto()]);
      setResumo(r);
      setAberto(p);
      setSemContrato(null);
    } catch (erro) {
      // 400 = aluno sem contrato ativo
      if (api.statusDoErro(erro) === 400) {
        setSemContrato(api.mensagemDeErro(erro));
      } else {
        setMensagem({ tipo: "erro", texto: api.mensagemDeErro(erro) });
      }
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

  // Atualiza o cronômetro do ponto aberto a cada 30 segundos.
  useEffect(() => {
    if (!aberto) return;
    const intervalo = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(intervalo);
  }, [aberto]);

  /** Abre o passo a passo: QR Code do local → selfie → envio com GPS e Wi-Fi. */
  function baterPonto() {
    setMensagem(null);
    router.push({ pathname: "/registrar", params: { modo: aberto ? "saida" : "entrada" } });
  }

  async function verificar() {
    setVerificando(true);
    setMensagem(null);
    try {
      const v = await api.verificarLocalizacao(await obterLocalizacaoAtual());
      setMensagem(
        v.dentro_do_raio
          ? { tipo: "sucesso", texto: `Você está a ${formatarDistancia(v.distancia_metros)} do estágio. Pode bater o ponto.` }
          : {
              tipo: "info",
              texto: `Você está a ${formatarDistancia(v.distancia_metros)} do estágio. Aproxime-se (limite: ${formatarDistancia(v.raio_metros)}).`,
            }
      );
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(erro) });
    } finally {
      setVerificando(false);
    }
  }

  if (carregando) return <Carregando />;

  const minutosAbertos = aberto ? minutosDesde(aberto.hora_entrada, agora) : 0;

  return (
    <Tela
      atualizando={atualizando}
      aoAtualizar={() => {
        setAtualizando(true);
        void carregar();
      }}
    >
      <Text style={estilos.saudacao}>Olá, {usuario?.nome.split(" ")[0]}!</Text>

      {semContrato ? (
        <Aviso tipo="info" texto={`${semContrato} Fale com seu professor orientador.`} />
      ) : (
        <>
          <Cartao>
            <Titulo>{aberto ? "Você está no estágio" : "Registrar ponto"}</Titulo>
            {aberto ? (
              <View style={estilos.cronometro}>
                <Text style={estilos.cronometroValor}>{formatarMinutos(minutosAbertos)}</Text>
                <TextoSuave>desde as {formatarHora(aberto.hora_entrada)}</TextoSuave>
              </View>
            ) : (
              <TextoSuave>
                Quando chegar ao local do estágio, toque no botão abaixo: você vai escanear o QR Code do local e tirar
                uma selfie.
              </TextoSuave>
            )}
            <Destaque id="aluno-registrar">
              <Botao
                titulo={aberto ? "Registrar saída" : "Registrar entrada"}
                variante={aberto ? "perigo" : "sucesso"}
                aoPressionar={baterPonto}
              />
            </Destaque>
            <Destaque id="aluno-verificar">
              <Botao
                titulo="Verificar minha localização"
                variante="secundario"
                aoPressionar={verificar}
                carregando={verificando}
              />
            </Destaque>
          </Cartao>

          <Aviso tipo={mensagem?.tipo ?? "info"} texto={mensagem?.texto ?? null} />

          {resumo ? (
            <Destaque id="aluno-progresso">
            <Cartao>
              <Titulo>Meu progresso</Titulo>
              {resumo.percentual != null ? (
                <>
                  <Text style={estilos.percentual}>{resumo.percentual.toFixed(1)}%</Text>
                  <BarraProgresso percentual={resumo.percentual} />
                </>
              ) : null}
              <Linha rotulo="Horas cumpridas" valor={formatarMinutos(resumo.minutos_cumpridos)} />
              {resumo.carga_horaria_total != null ? (
                <>
                  <Linha rotulo="Carga horária total" valor={`${resumo.carga_horaria_total}h`} />
                  <Linha rotulo="Faltam" valor={formatarMinutos((resumo.horas_restantes ?? 0) * 60)} />
                </>
              ) : (
                <TextoSuave>A carga horária total ainda não foi definida no seu contrato.</TextoSuave>
              )}
            </Cartao>
            </Destaque>
          ) : null}
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  saudacao: { fontSize: 22, fontWeight: "800", color: cores.texto },
  cronometro: { alignItems: "center", paddingVertical: 8 },
  cronometroValor: { fontSize: 36, fontWeight: "800", color: cores.primaria },
  percentual: { fontSize: 28, fontWeight: "800", color: cores.primaria },
});
