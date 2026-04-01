import Header from "@/components/header";
import HistoryShift from "@/components/screens/shift/history";
import { VStack } from "@/components/ui";

export default function ShiftReportScreen() {
  return (
    <VStack className="flex-1 bg-white">
      <Header header="LAPORAN SHIFT" isGoBack />
      <HistoryShift />
    </VStack>
  );
}
