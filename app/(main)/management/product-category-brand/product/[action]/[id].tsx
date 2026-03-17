import ProductDetail from "@/components/screens/product/detail";
import ProductForm from "@/components/screens/product/form";
import { useLocalSearchParams } from "expo-router";

export default function ProductActionScreen() {
  const { action } = useLocalSearchParams<{ action: string; id: string }>();

  if (action === "edit") {
    return <ProductForm />;
  }

  return <ProductDetail />;
}
