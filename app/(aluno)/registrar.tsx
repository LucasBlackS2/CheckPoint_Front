import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { Aviso, Botao, Cartao, Tela, TextoSuave, Titulo } from "@/components/ui";
import { cores } from "@/constants/tema";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/services/api";
import { obterLocalizacaoAtual } from "@/services/localizacao";
import { lerWifiAtual } from "@/services/rede";
import type { Ponto } from "@/types/api";
import { formatarHora, formatarMinutos } from "@/utils/formatar";

type Etapa = "qr" | "selfie" | "enviando" | "feito";

// QR impresso ("CHECKPOINT:...") ou QR ao vivo do professor ("CHECKPOINT-AO-VIVO:...").
const PREFIXOS_QR = ["CHECKPOINT:", "CHECKPOINT-AO-VIVO:"];

/**
 * Registro do ponto em 3 passos:
 * 1. Escanear o QR Code fixado no local do estágio
 * 2. Tirar uma selfie com a câmera frontal
 * 3. Enviar junto com o GPS e o Wi-Fi (a API confere tudo)
 */
export default function RegistrarPonto() {
  const router = useRouter();
  const { usuario } = useAuth();
  const demo = !!usuario?.demonstracao;
  const { modo: modoParam } = useLocalSearchParams<{ modo?: string }>();
  const modo: "entrada" | "saida" = modoParam === "saida" ? "saida" : "entrada";

  const [permissao, pedirPermissao] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const qrLido = useRef(false);

  const [etapa, setEtapa] = useState<Etapa>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [tirando, setTirando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [resultado, setResultado] = useState<Ponto | null>(null);

  // Toda vez que a tela abre, recomeça do passo 1.
  useFocusEffect(
    useCallback(() => {
      qrLido.current = false;
      setEtapa("qr");
      setQrCode(null);
      setFotoUri(null);
      setCameraPronta(false);
      setAviso(null);
      setErro(null);
      setResultado(null);
    }, [modo])
  );

  function aoLerQr(conteudo: string) {
    if (qrLido.current) return;
    if (!PREFIXOS_QR.some((prefixo) => conteudo.startsWith(prefixo))) {
      setAviso("Este QR Code não é do CheckPoint. Use o QR Code do local ou o da tela do professor.");
      return;
    }
    qrLido.current = true;
    setQrCode(conteudo);
    setAviso(null);
    setCameraPronta(false);
    setEtapa("selfie");
  }

  async function simularQr() {
    try {
      aoLerQr(await api.buscarQrCodeDemo());
    } catch (e) {
      setErro(api.mensagemDeErro(e));
    }
  }

  async function tirarSelfie() {
    if (!camera.current) return;
    setTirando(true);
    try {
      const foto = await camera.current.takePictureAsync({ quality: 0.4 });
      if (foto?.uri) setFotoUri(foto.uri);
    } catch {
      setErro("Não foi possível tirar a foto. Tente de novo.");
    } finally {
      setTirando(false);
    }
  }

  async function enviar(uri: string | null) {
    if (!qrCode) return;
    setEtapa("enviando");
    setErro(null);
    try {
      setStatus("Conferindo sua localização (GPS)...");
      const local = await obterLocalizacaoAtual();
      setStatus("Conferindo a rede Wi-Fi...");
      const wifi = await lerWifiAtual();
      setStatus("Enviando o registro...");
      const ponto = await api.registrarPonto(modo, {
        local,
        qrCode,
        wifiSsid: wifi?.ssid ?? null,
        wifiBssid: wifi?.bssid ?? null,
        fotoUri: uri,
      });
      setResultado(ponto);
      setEtapa("feito");
    } catch (e) {
      setErro(api.mensagemDeErro(e));
      setEtapa("selfie");
    }
  }

  function recomecar() {
    qrLido.current = false;
    setQrCode(null);
    setFotoUri(null);
    setErro(null);
    setEtapa("qr");
  }

  // --------------------------------------------------------------- telas

  if (!permissao) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }

  if (!permissao.granted) {
    return (
      <Tela>
        <Cartao>
          <Titulo>Precisamos da câmera</Titulo>
          <TextoSuave>A câmera é usada para ler o QR Code do local e tirar a selfie que comprova sua presença.</TextoSuave>
          <Botao titulo="Permitir câmera" aoPressionar={() => void pedirPermissao()} />
        </Cartao>
      </Tela>
    );
  }

  if (etapa === "feito" && resultado) {
    return (
      <Tela>
        <Cartao>
          <Text style={estilos.sucessoIcone}>✓</Text>
          <Titulo>{modo === "entrada" ? "Entrada registrada!" : "Saída registrada!"}</Titulo>
          <TextoSuave>
            {modo === "entrada"
              ? `Horário: ${formatarHora(resultado.hora_entrada)}. Bom estágio!`
              : `Horário: ${formatarHora(resultado.hora_saida)}. Tempo: ${formatarMinutos(resultado.tempo_trabalhado_minutos)}.`}
          </TextoSuave>
          <Botao titulo="Voltar" aoPressionar={() => router.navigate("/ponto")} />
        </Cartao>
      </Tela>
    );
  }

  if (etapa === "enviando") {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={estilos.status}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <View style={estilos.passos}>
        <Passo numero={1} texto="QR Code" ativo={etapa === "qr"} feito={etapa !== "qr"} />
        <Passo numero={2} texto="Selfie" ativo={etapa === "selfie"} feito={false} />
        <Passo numero={3} texto="Enviar" ativo={false} feito={false} />
      </View>

      {etapa === "qr" ? (
        <>
          <Text style={estilos.instrucao}>
            Aponte a câmera para o QR Code do local do estágio ou para o QR Code ao vivo na tela do professor.
          </Text>
          <View style={estilos.cameraCaixa}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => aoLerQr(data)}
            />
            <View style={estilos.mira} pointerEvents="none" />
          </View>
          <View style={estilos.rodape}>
            <Aviso tipo="info" texto={aviso} />
            <Aviso tipo="erro" texto={erro} />
            {demo ? (
              <Botao titulo="Simular leitura do QR Code (demonstração)" variante="secundario" aoPressionar={simularQr} />
            ) : null}
            <Botao titulo="Cancelar" variante="secundario" aoPressionar={() => router.navigate("/ponto")} />
          </View>
        </>
      ) : (
        <>
          <Text style={estilos.instrucao}>
            {fotoUri ? "Ficou boa? Confirme para registrar o ponto." : "Agora tire uma selfie no local."}
          </Text>
          <View style={estilos.cameraCaixa}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={StyleSheet.absoluteFill} />
            ) : (
              <CameraView
                ref={camera}
                style={StyleSheet.absoluteFill}
                facing="front"
                mirror
                onCameraReady={() => setCameraPronta(true)}
              />
            )}
          </View>
          <View style={estilos.rodape}>
            <Aviso tipo="erro" texto={erro} />
            {fotoUri ? (
              <>
                <Botao
                  titulo={modo === "entrada" ? "Registrar entrada" : "Registrar saída"}
                  variante={modo === "entrada" ? "sucesso" : "perigo"}
                  aoPressionar={() => void enviar(fotoUri)}
                />
                <Botao titulo="Tirar outra" variante="secundario" aoPressionar={() => setFotoUri(null)} />
              </>
            ) : (
              <>
                <Botao
                  titulo="Tirar selfie"
                  aoPressionar={tirarSelfie}
                  carregando={tirando}
                  desabilitado={!cameraPronta}
                />
                {demo ? (
                  <Botao
                    titulo="Pular selfie (demonstração)"
                    variante="secundario"
                    aoPressionar={() => void enviar(null)}
                  />
                ) : null}
              </>
            )}
            <Botao titulo="Ler o QR Code de novo" variante="secundario" aoPressionar={recomecar} />
          </View>
        </>
      )}
    </View>
  );
}

function Passo({ numero, texto, ativo, feito }: { numero: number; texto: string; ativo: boolean; feito: boolean }) {
  const cor = feito ? cores.sucesso : ativo ? cores.primaria : cores.textoSuave;
  return (
    <View style={estilos.passo}>
      <View style={[estilos.passoBola, { borderColor: cor, backgroundColor: feito || ativo ? cor : "transparent" }]}>
        <Text style={{ color: feito || ativo ? "#FFFFFF" : cor, fontWeight: "800" }}>{feito ? "✓" : numero}</Text>
      </View>
      <Text style={{ color: cor, fontWeight: "700", fontSize: 12 }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, padding: 16, gap: 12 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: cores.fundo },
  status: { color: cores.texto, fontWeight: "600" },
  passos: { flexDirection: "row", justifyContent: "space-around" },
  passo: { alignItems: "center", gap: 4 },
  passoBola: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  instrucao: { color: cores.texto, fontSize: 16, fontWeight: "600", textAlign: "center" },
  cameraCaixa: { flex: 1, borderRadius: 18, overflow: "hidden", backgroundColor: "#000000", minHeight: 260 },
  mira: {
    position: "absolute",
    top: "20%",
    left: "15%",
    right: "15%",
    bottom: "20%",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 16,
  },
  rodape: { gap: 8 },
  sucessoIcone: { fontSize: 48, color: cores.sucesso, textAlign: "center", fontWeight: "800" },
});
