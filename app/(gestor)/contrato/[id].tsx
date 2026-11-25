import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";

import { Destaque } from "@/components/Destaque";
import { PontoItem } from "@/components/PontoItem";
import { Aviso, BarraProgresso, Botao, Campo, Carregando, Cartao, Linha, Tela, TextoSuave, Titulo } from "@/components/ui";
import * as api from "@/services/api";
import type { Contrato, Ponto, ResumoHoras } from "@/types/api";
import { formatarData, formatarHora, formatarMinutos } from "@/utils/formatar";

export default function DetalheContrato() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idContrato = Number(id);

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [resumo, setResumo] = useState<ResumoHoras | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [minutos, setMinutos] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [c, r, p] = await Promise.all([
        api.buscarContrato(idContrato),
        api.buscarResumoContrato(idContrato),
        api.listarPontosContrato(idContrato),
      ]);
      setContrato(c);
      setResumo(r);
      setPontos(p);
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [idContrato]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const pontoAberto = pontos.find((p) => p.ativo) ?? null;

  async function encerrarPontoAberto() {
    if (!pontoAberto) return;
    const valor = Number(minutos);
    if (!Number.isInteger(valor) || valor < 0) {
      setMensagem({ tipo: "erro", texto: "Informe os minutos como um número inteiro." });
      return;
    }
    setSalvando(true);
    try {
      await api.encerrarPonto(pontoAberto.id, valor);
      setMinutos("");
      setMensagem({ tipo: "sucesso", texto: "Ponto encerrado." });
      await carregar();
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus() {
    if (!contrato) return;
    setSalvando(true);
    try {
      setContrato(await api.alterarStatusContrato(contrato.id, !contrato.status));
      setMensagem({ tipo: "sucesso", texto: contrato.status ? "Contrato encerrado." : "Contrato reativado." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  return (
    <Tela
      atualizando={atualizando}
      aoAtualizar={() => {
        setAtualizando(true);
        void carregar();
      }}
    >
      <Stack.Screen options={{ title: contrato?.aluno.nome ?? "Contrato" }} />
      <Aviso tipo={mensagem?.tipo ?? "erro"} texto={mensagem?.texto ?? null} />

      {contrato ? (
        <Cartao>
          <Titulo>{contrato.aluno.nome}</Titulo>
          <Linha rotulo="Matrícula" valor={contrato.aluno.matricula} />
          <Linha rotulo="Orientador" valor={contrato.professor.nome} />
          <Linha
            rotulo="Local"
            valor={`${contrato.endereco.logradouro}${contrato.endereco.numero ? ", " + contrato.endereco.numero : ""} - ${contrato.endereco.cidade}`}
          />
          <Linha rotulo="Período" valor={`${formatarData(contrato.data_inicio)} a ${formatarData(contrato.data_final)}`} />
          <Linha rotulo="Situação" valor={contrato.status ? "Ativo" : "Encerrado"} />
          {contrato.endereco.latitude == null ? (
            <Aviso tipo="info" texto="Este endereço não tem coordenadas: o aluno não conseguirá bater o ponto." />
          ) : null}
        </Cartao>
      ) : null}

      {resumo ? (
        <Destaque id="prof-progresso">
        <Cartao>
          <Titulo>Progresso</Titulo>
          {resumo.percentual != null ? <BarraProgresso percentual={resumo.percentual} /> : null}
          <Linha rotulo="Cumpridas" valor={formatarMinutos(resumo.minutos_cumpridos)} />
          <Linha
            rotulo="Carga horária"
            valor={resumo.carga_horaria_total != null ? `${resumo.carga_horaria_total}h` : "não definida"}
          />
          {resumo.percentual != null ? <Linha rotulo="Percentual" valor={`${resumo.percentual.toFixed(1)}%`} /> : null}
        </Cartao>
        </Destaque>
      ) : null}

      {pontoAberto ? (
        <Cartao>
          <Titulo>Ponto em aberto</Titulo>
          <TextoSuave>
            Entrada em {formatarData(pontoAberto.data)} às {formatarHora(pontoAberto.hora_entrada)}. Se o aluno
            esqueceu de registrar a saída, informe quantos minutos devem valer.
          </TextoSuave>
          <Campo rotulo="Minutos trabalhados" keyboardType="number-pad" value={minutos} onChangeText={setMinutos} placeholder="Ex.: 240" />
          <Botao titulo="Encerrar ponto" aoPressionar={encerrarPontoAberto} carregando={salvando} desabilitado={!minutos} />
        </Cartao>
      ) : null}

      <Destaque id="prof-registros">
        <Cartao>
          <Titulo>Registros de ponto</Titulo>
          {pontos.length === 0 ? (
            <TextoSuave>Nenhum registro ainda.</TextoSuave>
          ) : (
            pontos.map((p) => <PontoItem key={p.id} ponto={p} />)
          )}
        </Cartao>
      </Destaque>

      {contrato ? (
        <Botao
          titulo={contrato.status ? "Encerrar contrato" : "Reativar contrato"}
          variante={contrato.status ? "perigo" : "secundario"}
          aoPressionar={alternarStatus}
          carregando={salvando}
        />
      ) : null}
    </Tela>
  );
}
