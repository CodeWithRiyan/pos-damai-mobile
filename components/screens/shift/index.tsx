import Header from "@/components/header";
import { Box, HStack, Pressable, Text, VStack } from "@/components/ui";
import { useShiftStore } from "@/stores/shift";
import CurrentShift from "./current";
import HistoryShift from "./history";

export default function ShiftTabs() {
  const { tabActive, setTabActive } = useShiftStore((state) => state);

  return (
    <VStack className="flex-1 bg-white">
      <Header header="SHIFT" />
      <HStack className="w-full bg-gray-100">
        <Pressable
          className={`flex-1 flex-row justify-center py-3`}
          style={
            tabActive === "current"
              ? { borderBottomColor: "#3D2117", borderBottomWidth: 2, backgroundColor: "#00000005" }
              : undefined
          }
          onPress={() => setTabActive("current")}
        >
          <Text className="text-sm text-typography-700 font-bold">SAAT INI</Text>
        </Pressable>
        <Pressable
          className="flex-1 flex-row justify-center py-3"
          style={
            tabActive === "history"
              ? { borderBottomColor: "#3D2117", borderBottomWidth: 2, backgroundColor: "#00000005" }
              : undefined
          }
          onPress={() => setTabActive("history")}
        >
          <Text className="text-sm text-typography-700 font-bold">RIWAYAT</Text>
        </Pressable>
      </HStack>
      <Box className="flex-1">
        {tabActive === "current" && <CurrentShift />}
        {tabActive === "history" && <HistoryShift />}
      </Box>
    </VStack>
  );
}
