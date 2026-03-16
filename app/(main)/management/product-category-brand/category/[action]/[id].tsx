import CategoryDetail from "@/components/screens/category/detail";
import SelectProductInCategory from "@/components/screens/category/select-product-in-category";
import { useLocalSearchParams } from "expo-router";

export default function CategoryActionScreen() {
  const { action } = useLocalSearchParams();

  if (action === "select-product") return <SelectProductInCategory />;

  return <CategoryDetail />;
}
