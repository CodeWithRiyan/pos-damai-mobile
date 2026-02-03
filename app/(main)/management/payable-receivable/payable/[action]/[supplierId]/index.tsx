import PayableDetail from "@/components/screens/payable/detail";
import PayableForm from "@/components/screens/payable/form";
import { useLocalSearchParams } from "expo-router";

export default function PayableActionId() {
  const { action } = useLocalSearchParams();

  const detail = action === "detail";
  const form = action === "add" || action === "edit";

  if (detail) return <PayableDetail />;

  if (form) return <PayableForm />;
}
