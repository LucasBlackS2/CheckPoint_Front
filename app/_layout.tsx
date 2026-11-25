import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import { AberturaAnimada } from "@/components/AberturaAnimada";
import { TourCartao } from "@/components/TourCartao";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TourProvider } from "@/contexts/TourContext";

/** Manda cada usuário para a área certa: login, área do aluno ou área do professor/coordenação. */
function ProtecaoDeRotas() {
  const { usuario, carregando } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    const grupo = segmentos[0];

    if (!usuario) {
      // Sem login só dá para ver o login e a escolha do modo demonstração.
      if (grupo !== "login" && grupo !== "demo") router.replace("/login");
      return;
    }

    const ehAluno = usuario.tipo_acesso === "aluno";
    const grupoCerto = ehAluno ? "(aluno)" : "(gestor)";
    if (grupo !== grupoCerto) {
      router.replace(ehAluno ? "/ponto" : "/contratos");
    }
  }, [usuario, carregando, segmentos, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <TourCartao />
      <AberturaAnimada />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TourProvider>
        <StatusBar style="dark" />
        <ProtecaoDeRotas />
      </TourProvider>
    </AuthProvider>
  );
}
