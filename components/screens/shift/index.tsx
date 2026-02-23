import CurrentShift from "@/components/screens/shift/current";
import CurrentFormShift from "@/components/screens/shift/current-form";
import HistoryShift from "@/components/screens/shift/history";
import { Spinner, Text, VStack } from "@/components/ui";
import { useCurrentShift } from "@/lib/api/shifts";
import { useLocalSearchParams } from "expo-router";

export default function TabContentShift() {
  const { data: currentShift, isLoading } = useCurrentShift();
  const { tab } = useLocalSearchParams();
  console.log("[TabContentShift] tab:", currentShift);

  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center bg-white">
        <Spinner size="large" />
        <Text className="mt-2">Memuat data shift...</Text>
      </VStack>
    );
  }

  if (tab === "current" && !currentShift) return <CurrentFormShift />;
  if (tab === "current" && currentShift) return <CurrentShift />;

  return <HistoryShift />;
}
