import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { cores } from "@/constants/tema";

export default function LayoutAluno() {
  const router = useRouter();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: cores.primaria, headerTitleStyle: { fontWeight: "700" } }}>
      <Tabs.Screen
        name="ponto"
        options={{
          title: "Ponto",
          tabBarIcon: ({ color, size }) => <Ionicons name="finger-print" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      {/* Fluxo QR Code → selfie → envio: fora da barra de abas */}
      <Tabs.Screen
        name="registrar"
        options={{
          href: null,
          title: "Registrar ponto",
          tabBarStyle: { display: "none" },
          headerLeft: () => (
            <Pressable onPress={() => router.navigate("/ponto")} style={{ paddingHorizontal: 12 }} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color={cores.texto} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
