import CategoryForm from "@/components/screens/category/form";
import { useLocalSearchParams } from "expo-router";

export default function CategoryActionScreen() {
  const { action } = useLocalSearchParams<{ action: string; id: string }>();
  
  if (action === "edit") {
    return <CategoryForm mode="edit" />;
  }
  
  // detail view - for now just show edit form as read-only could be added later
  return <CategoryForm mode="edit" />;
}
