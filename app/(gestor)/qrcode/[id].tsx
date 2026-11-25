import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Switch, Text, View } from "react-native";

import { Destaque } from "@/components/Destaque";
import { ImagemAutenticada } from "@/components/ImagemAutenticada";
import { Aviso, Botao, Campo, Cartao, Linha, Selo, Tela, TextoSuave, Titulo } from "@/components/ui";
import { cores } from "@/constants/tema";
import {
  buscarEndereco,
  caminhoQrCode,
  definirLocalValido,
  gerarNovoQrCode,
  gerarQrAoVivo,
  mensagemDeErro,
} from "@/services/api";
import { obterLocalizacaoAtual } from "@/services/localizacao";
import type { Endereco, QrAoVivo } from "@/types/api";
import { formatarDistancia } from "@/utils/formatar";

const TAG_TELA_LIGADA = "checkpoint-qr-ao-vivo";

type Mensagem = { tipo: "erro" | "sucesso"; texto: string } | null;

/**
 * QR Codes de um local de estágio:
 * - Ao vivo: aparece no celular do professor, muda a cada 30 s e só é gerado
 *   com o professor dentro do local que ele definiu como válido.
 * - Impresso: fixo, para colar na empresa (pode ser desligado).
 */
export default function QrCodeLocal() {
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const idEndereco = Number(id);

  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [raio, setRaio] = useState("");
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [ocupado, setOcupado] = useState<null | "posicao" | "raio" | "impresso" | "novo">(null);

  const [aoVivo, setAoVivo] = useState(false);
  const [qr, setQr] = useState<QrAoVivo | null>(null);
  const [erroAoVivo, setErroAoVivo] = useState<string | null>(null);
  const [agora, setAgora] = useState(Date.now());

  const [versaoImpresso, setVersaoImpresso] = useState(0);
  const [confirmandoNovo, setConfirmandoNovo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const e = await buscarEndereco(idEndereco);
      setEndereco(e);
      setRaio(e.raio_metros != null ? String(e.raio_metros) : "");
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro) });
    }
  }, [idEndereco]);

  // Ao abrir a tela carrega o local; ao sair, desliga o QR ao vivo.
  useFocusEffect(
    useCallback(() => {
      void carregar();
      return () => setAoVivo(false);
    }, [carregar])
  );

  // QR ao vivo: a cada troca de janela, confere o GPS do professor e pede um código novo.
  useEffect(() => {
    if (!aoVivo) return;
    let cancelado = false;
    let proxima: ReturnType<typeof setTimeout> | undefined;

    async function atualizar() {
      try {
        const posicao = await obterLocalizacaoAtual();
        const novo = await gerarQrAoVivo(idEndereco, posicao);
        if (cancelado) return;
        setQr(novo);
        setErroAoVivo(null);
        const espera = Math.max(1000, new Date(novo.expira_em).getTime() - Date.now() + 300);
        proxima = setTimeout(() => void atualizar(), espera);
      } catch (erro) {
        if (cancelado) return;
        // Saiu do local (ou outro erro): o QR some da tela na hora.
        setErroAoVivo(mensagemDeErro(erro));
        setQr(null);
        setAoVivo(false);
      }
    }

    void atualizar();
    void activateKeepAwakeAsync(TAG_TELA_LIGADA).catch(() => undefined);
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => {
      cancelado = true;
      if (proxima) clearTimeout(proxima);
      clearInterval(relogio);
      void deactivateKeepAwake(TAG_TELA_LIGADA);
    };
  }, [aoVivo, idEndereco]);

  function raioDigitado(): number | undefined | "invalido" {
    if (!raio.trim()) return undefined;
    const valor = Number(raio);
    return Number.isInteger(valor) && valor >= 20 && valor <= 5000 ? valor : "invalido";
  }

  async function definirAquiComoLocalValido() {
    const r = raioDigitado();
    if (r === "invalido") {
      setMensagem({ tipo: "erro", texto: "O raio deve ser um número inteiro entre 20 e 5000 metros." });
      return;
    }
    setOcupado("posicao");
    setMensagem(null);
    try {
      const posicao = await obterLocalizacaoAtual();
      setEndereco(await definirLocalValido(idEndereco, { ...posicao, raio_metros: r }));
      setMensagem({ tipo: "sucesso", texto: "Pronto! Este ponto passou a ser o local válido do QR Code." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  async function salvarRaio() {
    const r = raioDigitado();
    if (r === undefined || r === "invalido") {
      setMensagem({ tipo: "erro", texto: "O raio deve ser um número inteiro entre 20 e 5000 metros." });
      return;
    }
    setOcupado("raio");
    setMensagem(null);
    try {
      setEndereco(await definirLocalValido(idEndereco, { raio_metros: r }));
      setMensagem({ tipo: "sucesso", texto: `Raio salvo: ${r} m.` });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  async function alternarImpresso(aceita: boolean) {
    setOcupado("impresso");
    setMensagem(null);
    try {
      setEndereco(await definirLocalValido(idEndereco, { aceita_qr_impresso: aceita }));
    } catch (e) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  async function gerarNovoImpresso() {
    setOcupado("novo");
    setMensagem(null);
    try {
      await gerarNovoQrCode(idEndereco);
      setVersaoImpresso((v) => v + 1);
      setConfirmandoNovo(false);
      setMensagem({ tipo: "sucesso", texto: "Novo QR Code gerado. Imprima de novo: o antigo não funciona mais." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  const segundosRestantes = qr ? Math.max(0, Math.ceil((new Date(qr.expira_em).getTime() - agora) / 1000)) : 0;
  const temLocal = endereco?.latitude != null;

  return (
    <Tela>
      <Titulo>{nome ?? (endereco ? endereco.logradouro : "Local do estágio")}</Titulo>
      <Aviso tipo={mensagem?.tipo ?? "erro"} texto={mensagem?.texto ?? null} />

      {/* -------------------------------------------------- QR ao vivo */}
      <Destaque id="prof-qr-ao-vivo">
        <Cartao>
          <Titulo>QR Code ao vivo</Titulo>
          <TextoSuave>
            Mostre este QR Code na sua tela para os alunos escanearem. Ele muda a cada{" "}
            {qr?.valido_por_segundos ?? 30} segundos (foto ou print não funcionam) e só aparece enquanto você estiver
            no local válido.
          </TextoSuave>

          {aoVivo && !qr ? (
            <View style={estilos.qrCaixa}>
              <ActivityIndicator size="large" color={cores.primaria} />
              <TextoSuave>Conferindo sua localização...</TextoSuave>
            </View>
          ) : null}

          {qr ? (
            <View style={estilos.qrCaixa}>
              <Image source={{ uri: `data:image/png;base64,${qr.png_base64}` }} style={estilos.qrAoVivo} />
              <View style={estilos.contagem}>
                <Selo texto={`Novo código em ${segundosRestantes}s`} cor="azul" />
                <Selo
                  texto={`Você está a ${formatarDistancia(qr.distancia_metros)} (até ${formatarDistancia(qr.raio_metros)})`}
                  cor="verde"
                />
              </View>
            </View>
          ) : null}

          <Aviso tipo="erro" texto={erroAoVivo} />

          {aoVivo ? (
            <Botao titulo="Parar QR ao vivo" variante="perigo" aoPressionar={() => setAoVivo(false)} />
          ) : (
            <Botao
              titulo="Mostrar QR ao vivo"
              variante="sucesso"
              aoPressionar={() => {
                setErroAoVivo(null);
                setAoVivo(true);
              }}
              desabilitado={!endereco || (!temLocal && !endereco.demonstracao)}
            />
          )}
          {endereco && !temLocal && !endereco.demonstracao ? (
            <TextoSuave>Defina o local válido abaixo antes de mostrar o QR ao vivo.</TextoSuave>
          ) : null}
        </Cartao>
      </Destaque>

      {/* ------------------------------------------------- local válido */}
      <Cartao>
        <Titulo>Local válido</Titulo>
        <TextoSuave>
          É aqui que o QR Code vale: o professor só consegue mostrar o QR ao vivo, e o aluno só consegue bater o ponto,
          dentro deste raio. Esteja no local e toque em &quot;Definir aqui como local válido&quot;.
        </TextoSuave>
        {endereco ? (
          <>
            <Linha
              rotulo="Posição"
              valor={
                temLocal
                  ? `${endereco.latitude?.toFixed(5)}, ${endereco.longitude?.toFixed(5)}`
                  : "não definida"
              }
            />
            <Linha rotulo="Raio" valor={endereco.raio_metros ? `${endereco.raio_metros} m` : "padrão do servidor"} />
          </>
        ) : null}
        <Campo
          rotulo="Raio permitido (metros)"
          value={raio}
          onChangeText={setRaio}
          keyboardType="number-pad"
          placeholder="Ex.: 100"
        />
        <Botao
          titulo="Definir aqui como local válido"
          aoPressionar={definirAquiComoLocalValido}
          carregando={ocupado === "posicao"}
        />
        <Botao titulo="Salvar só o raio" variante="secundario" aoPressionar={salvarRaio} carregando={ocupado === "raio"} />

        <View style={estilos.chave}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={estilos.chaveTitulo}>Aceitar também o QR impresso</Text>
            <TextoSuave>Desligado: só vale o QR ao vivo, com você presente.</TextoSuave>
          </View>
          <Switch
            value={endereco?.aceita_qr_impresso ?? true}
            onValueChange={(v) => void alternarImpresso(v)}
            disabled={!endereco || ocupado === "impresso"}
            trackColor={{ true: cores.primaria, false: cores.borda }}
          />
        </View>
      </Cartao>

      {/* ------------------------------------------------- QR impresso */}
      <Cartao>
        <Titulo>QR Code impresso</Titulo>
        {endereco && !endereco.aceita_qr_impresso ? (
          <Aviso tipo="info" texto="O QR impresso está desligado para este local: os alunos não conseguem usá-lo." />
        ) : null}
        <View style={estilos.qrCaixa}>
          <ImagemAutenticada caminho={caminhoQrCode(idEndereco, versaoImpresso)} estilo={estilos.qrImpresso} />
        </View>
        <TextoSuave>
          Imprima e fixe na entrada do local. Para imprimir, tire um print desta tela ou abra o app no computador. Se
          uma foto dele circular por aí, gere um novo: o antigo deixa de funcionar na hora.
        </TextoSuave>
        {confirmandoNovo ? (
          <>
            <Botao
              titulo="Sim, gerar novo QR impresso"
              variante="perigo"
              aoPressionar={gerarNovoImpresso}
              carregando={ocupado === "novo"}
            />
            <Botao titulo="Cancelar" variante="secundario" aoPressionar={() => setConfirmandoNovo(false)} />
          </>
        ) : (
          <Botao titulo="Gerar novo QR impresso" variante="secundario" aoPressionar={() => setConfirmandoNovo(true)} />
        )}
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  qrCaixa: { alignItems: "center", gap: 10, paddingVertical: 8 },
  qrAoVivo: { width: 280, height: 280, backgroundColor: "#FFFFFF" },
  qrImpresso: { width: 220, height: 220, backgroundColor: "#FFFFFF" },
  contagem: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chave: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  chaveTitulo: { fontWeight: "700", color: cores.texto },
});
