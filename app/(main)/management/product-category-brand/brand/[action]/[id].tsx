import BrandForm from "@/components/screens/brand/form";
import { useLocalSearchParams } from "expo-router";

export default function BrandActionScreen() {
  const { action } = useLocalSearchParams<{ action: string; id: string }>();
  
  if (action === "edit") {
    return <BrandForm mode="edit" />;
  }
  
  return <BrandForm mode="edit" />;
}
