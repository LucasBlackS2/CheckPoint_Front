import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { cores } from "@/constants/tema";

export default function LayoutGestor() {
  const router = useRouter();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: cores.primaria, headerTitleStyle: { fontWeight: "700" } }}>
      <Tabs.Screen
        name="contratos"
        options={{
          title: "Estagiários",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cadastros"
        options={{
          title: "Cadastros",
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="conta"
        options={{
          title: "Conta",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      {/* Tela de detalhe: não aparece na barra de abas */}
      <Tabs.Screen
        name="contrato/[id]"
        options={{
          href: null,
          title: "Contrato",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12 }} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color={cores.texto} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="qrcode/[id]"
        options={{
          href: null,
          title: "QR Code do local",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12 }} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color={cores.texto} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
