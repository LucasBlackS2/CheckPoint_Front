import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Segura a splash nativa até a abertura animada estar na tela (transição sem piscar).
SplashScreen.preventAutoHideAsync().catch(() => {});

export const FRASE_DE_ABERTURA = "Cada hora conta.\nCada presença comprova.";

const AZUL = "#1E5EFF";
const LARANJA = "#F59E0B";
const TEMPO_PARADO_MS = 1600;

/**
 * Abertura do app: o pino da marca sobe, a Capi estudante entra acenando,
 * a frase aparece e tudo some. Tocar na tela pula a animação.
 */
export function AberturaAnimada() {
  const [visivel, setVisivel] = useState(true);

  const simbolo = useRef(new Animated.Value(0)).current;
  const capi = useRef(new Animated.Value(0)).current;
  const frase = useRef(new Animated.Value(0)).current;
  const barra = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(1)).current;
  const encerrando = useRef(false);

  function encerrar() {
    if (encerrando.current) return;
    encerrando.current = true;
    Animated.timing(saida, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setVisivel(false));
  }

  useEffect(() => {
    let cancelado = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => {
        if (cancelado) return;
        if (reduzir) {
          simbolo.setValue(1);
          capi.setValue(1);
          frase.setValue(1);
          barra.setValue(1);
          setTimeout(encerrar, 1800);
          return;
        }

        Animated.sequence([
          Animated.spring(simbolo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.parallel([
            Animated.spring(capi, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(250),
              Animated.timing(frase, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.delay(500),
              Animated.timing(barra, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.delay(TEMPO_PARADO_MS),
        ]).start(({ finished }) => {
          if (finished) encerrar();
        });
      });

    return () => {
      cancelado = true;
    };
    // Roda uma única vez, quando o app abre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visivel) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilos.fundo, { opacity: saida }]}
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
    >
      <Pressable
        style={estilos.conteudo}
        onPress={encerrar}
        accessibilityRole="button"
        accessibilityLabel={`Right Point. ${FRASE_DE_ABERTURA.replace("\n", " ")} Toque para continuar.`}
      >
        <Animated.View
          style={[
            estilos.marca,
            {
              opacity: simbolo,
              transform: [
                { translateY: simbolo.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              ],
            },
          ]}
        >
          <Image source={require("@/assets/images/simbolo-branco.png")} style={estilos.simbolo} />
          <Text style={estilos.nome}>Right Point</Text>
        </Animated.View>

        <Animated.Image
          source={require("@/assets/images/capi-estudante.png")}
          resizeMode="contain"
          style={[
            estilos.capi,
            {
              opacity: capi,
              transform: [
                { scale: capi.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                { translateY: capi.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
                { rotate: capi.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "0deg"] }) },
              ],
            },
          ]}
        />

        <Animated.Text
          style={[
            estilos.frase,
            {
              opacity: frase,
              transform: [
                { translateY: frase.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}
        >
          {FRASE_DE_ABERTURA}
        </Animated.Text>

        <Animated.View style={[estilos.barra, { transform: [{ scaleX: barra }] }]} />

        <Animated.Text style={[estilos.dica, { opacity: barra }]}>Toque para continuar</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fundo: { backgroundColor: AZUL, zIndex: 100, elevation: 100 },
  conteudo: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  marca: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  simbolo: { width: 34, height: 40 },
  nome: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", letterSpacing: 0.5 },
  capi: { width: 220, height: 275, marginVertical: 8 },
  frase: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  barra: { width: 96, height: 5, borderRadius: 3, backgroundColor: LARANJA, marginTop: 18 },
  dica: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 28 },
});
