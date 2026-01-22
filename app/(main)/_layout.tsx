import BrandForm from "@/components/screens/brand/form";
import CategoryForm from "@/components/screens/category/form";
import DiscountForm from "@/components/screens/discount/form";
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
            animation: "slide_from_left",
            animationTypeForReplace: "pop", // This handles the back animation
            presentation: "card",
          }}
        />
      </View>
      <CategoryForm />
      <BrandForm />
      <DiscountForm />
    </View>
  );
}
