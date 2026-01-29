import ReceivableRealizationDetail from "@/components/screens/receivable/detail-realization";
import ReceivableRealizationForm from "@/components/screens/receivable/form-realization";
import { useLocalSearchParams } from "expo-router";

export default function ReceivableRealizationScreen() {
  const { actionRealization } = useLocalSearchParams();

  const detail = actionRealization === "detail";

  if (detail) return <ReceivableRealizationDetail />;

  return <ReceivableRealizationForm />;
}
