import Header from "@/components/header";
import { Box, Text, VStack } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/api/users";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { FlatList } from "react-native";

import { useUserLog } from "@/lib/api/users";

export default function UserLog() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: user, isLoading: isLoadingUser } = useUser(userId || "");
  const { data: dataLog = [], isLoading: isLoadingLogs } = useUserLog(
    userId || "",
  );

  const isLoading = isLoadingUser || isLoadingLogs;

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header={`LOG AKTIVITAS ${user?.firstName.toUpperCase()}`}
        isGoBack
      />

      <VStack className="flex-1">
        {/* Log List */}
        <Pressable className="py-3 px-8 border-b border-background-200 active:bg-gray-100">
          <Grid _extra={{ className: "grid-cols-2" }}>
            <GridItem _extra={{ className: "col-span-1" }}>
              <Text className="font-bold">Tanggal</Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-1" }}>
              <Text className="font-bold">Aktivitas</Text>
            </GridItem>
          </Grid>
        </Pressable>
        <FlatList
          data={dataLog}
          className="flex-1"
          keyExtractor={(item, index) => item.id || index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: log }) => (
            <Pressable className="py-3 px-8 border-b border-background-200 active:bg-gray-100">
              <Grid _extra={{ className: "grid-cols-2" }}>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text>{dayjs(log.date).format("DD-MM-YYYY HH:mm:ss")}</Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Text>{log.activity}</Text>
                </GridItem>
              </Grid>
            </Pressable>
          )}
          ListEmptyComponent={
            <VStack className="p-12 items-center justify-center">
              <SolarIconBoldDuotone
                name="UserCircle"
                size={64}
                color="#CBD5E1"
              />
              <Text className="text-typography-400 text-center mt-4">
                Log tidak ditemukan
              </Text>
            </VStack>
          }
        />
      </VStack>
    </VStack>
  );
}
