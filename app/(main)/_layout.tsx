import { Sidebar } from "@/components/sidebar";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function MainLayout() {
  return (
    <View className="flex-1 flex-row bg-white">
      <Sidebar />
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Dashboard" }} />
          <Stack.Screen
            name="/management/index"
            options={{ title: "Manajemen" }}
          />
          <Stack.Screen
            name="/management/role-user/index"
            options={{ title: "Manajemen Role dan Karyawan" }}
          />
          <Stack.Screen
            name="/management/role-user/role/index"
            options={{ title: "Manajemen Role" }}
          />
          <Stack.Screen
            name="/management/role-user/user/index"
            options={{ title: "Manajemen Karyawan" }}
          />
        </Stack>
      </View>
    </View>
  );
}
