import CurrentShift from "@/components/screens/shift/current";
import CurrentFormShift from "@/components/screens/shift/current-form";
import HistoryShift from "@/components/screens/shift/history";
import { useCurrentShift } from "@/lib/api/shifts";
import { useLocalSearchParams } from "expo-router";

export default function TabContentShift() {
  const { data: currentShift } = useCurrentShift();

  const { tab } = useLocalSearchParams();
  if (tab === "current" && !currentShift) return <CurrentFormShift />;
  if (tab === "current" && currentShift) return <CurrentShift />;

  return <HistoryShift />;
}
