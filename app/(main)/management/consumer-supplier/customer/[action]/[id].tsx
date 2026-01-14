import CustomerForm from "@/components/screens/customer/form";
import { useLocalSearchParams } from "expo-router";

export default function CustomerActionScreen() {
  const { action } = useLocalSearchParams<{ action: string; id: string }>();
  
  if (action === "edit") {
    return <CustomerForm mode="edit" />;
  }
  
  return <CustomerForm mode="edit" />;
}
