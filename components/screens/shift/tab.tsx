import Header from "@/components/header";
import { HStack, Pressable, Text, VStack } from "@/components/ui";
import { Badge, BadgeText } from "@/components/ui/badge";
import { useCurrentShift } from "@/lib/api/shifts";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

export default function ShiftTabs() {
  const { data: currentShift } = useCurrentShift();
  const segments = useSegments();
  const tab = segments[segments.length - 1];
  const router = useRouter();

  const [tabActive, setTabActive] = useState<string>("");

  useEffect(() => {
    setTabActive(tab as string);
  }, [tab]);

  return (
    <VStack className="w-full bg-white">
      <Header header="SHIFT" />
      <HStack className="w-full bg-gray-100">
        <Pressable
          className={`flex-1 flex-row gap-4 items-center justify-center py-3`}
          style={
            tabActive === "current"
              ? {
                  borderBottomColor: "#3D2117",
                  borderBottomWidth: 2,
                  backgroundColor: "#00000005",
                }
              : undefined
          }
          onPress={() => router.replace("/(main)/shift/(tab)/current")}
        >
          <Text className="text-sm text-typography-700 font-bold">
            SAAT INI
          </Text>
          {currentShift && (
            <Badge size="sm" variant="solid" action="success">
              <BadgeText className="text-xs font-bold">AKTIF</BadgeText>
            </Badge>
          )}
        </Pressable>
        <Pressable
          className="flex-1 flex-row justify-center py-3"
          style={
            tabActive === "history"
              ? {
                  borderBottomColor: "#3D2117",
                  borderBottomWidth: 2,
                  backgroundColor: "#00000005",
                }
              : undefined
          }
          onPress={() => router.replace("/(main)/shift/(tab)/history")}
        >
          <Text className="text-sm text-typography-700 font-bold">RIWAYAT</Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
