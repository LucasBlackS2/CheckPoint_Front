import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { Destaque } from "@/components/Destaque";
import { PontoItem } from "@/components/PontoItem";
import { Aviso, Carregando, Cartao, Tela, TextoSuave, Titulo } from "@/components/ui";
import * as api from "@/services/api";
import type { Ponto } from "@/types/api";
import { formatarMinutos } from "@/utils/formatar";

export default function Historico() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setPontos(await api.buscarMeuHistorico());
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

  const total = pontos.reduce((soma, p) => soma + (p.tempo_trabalhado_minutos ?? 0), 0);

  return (
    <Tela
      atualizando={atualizando}
      aoAtualizar={() => {
        setAtualizando(true);
        void carregar();
      }}
    >
      <Aviso tipo="erro" texto={erro} />
      <Destaque id="aluno-historico">
      <Cartao>
        <Titulo>Registros</Titulo>
        <TextoSuave>
          {pontos.length} registro(s) · total {formatarMinutos(total)}
        </TextoSuave>
        {pontos.length === 0 ? (
          <TextoSuave>Nenhum ponto registrado ainda.</TextoSuave>
        ) : (
          pontos.map((p) => <PontoItem key={p.id} ponto={p} />)
        )}
      </Cartao>
      </Destaque>
    </Tela>
  );
}
