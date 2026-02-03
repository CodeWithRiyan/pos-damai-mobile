import ReceivableDetail from "@/components/screens/receivable/detail";
import ReceivableForm from "@/components/screens/receivable/form";
import { useLocalSearchParams } from "expo-router";

export default function ReceivableActionId() {
  const { action } = useLocalSearchParams();

  const detail = action === "detail";
  const form = action === "edit";

  if (detail) return <ReceivableDetail />;

  if (form) return <ReceivableForm />;
}
