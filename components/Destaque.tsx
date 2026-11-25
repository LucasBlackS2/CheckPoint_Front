import { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useTour } from "@/contexts/TourContext";

/** Cor do destaque do tour (laranja, para se diferenciar do azul do app). */
const COR = "#F59E0B";

/**
 * Envolve uma função do app. Quando o passo atual do tour tem este id,
 * aparece uma borda laranja piscando em volta dela.
 */
export function Destaque({ id, children }: { id: string; children: ReactNode }) {
  const { passo } = useTour();
  const ligado = passo?.id === id;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ligado) {
      pulso.setValue(0);
      return;
    }
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, [ligado, pulso]);

  return (
    <View>
      {children}
      {ligado ? (
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.borda,
            {
              opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
              transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  borda: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderWidth: 3,
    borderColor: COR,
    borderRadius: 18,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
});
