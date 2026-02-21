import Header from "@/components/header";
import { Box, Text, VStack } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/api/users";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

// TODO: move to service
export interface IUserLog {
  date: string;
  activity: string;
}

// TODO: replace with real data
const dataLog: IUserLog[] = [
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Create Product",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Update Product",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Delete Product",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Start Shift",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Create Transaction Sales",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Create Transaction Finance",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Create Transaction Purchase",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "Create Transaction Finance",
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "End Shift",
  },
];

export default function UserLog() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: user, isLoading: isLoadingUser } = useUser(userId || "");

  const isLoading = isLoadingUser;

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
        header={`LOG KARYAWAN ${user?.firstName.toUpperCase()}`}
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
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <VStack>
            {dataLog.map((log, i) => (
              <Pressable
                key={i}
                className="py-3 px-8 border-b border-background-200 active:bg-gray-100"
              >
                <Grid _extra={{ className: "grid-cols-2" }}>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text>{dayjs(log.date).format("DD-MM-YYYY HH:mm:ss")}</Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text>{log.activity}</Text>
                  </GridItem>
                </Grid>
              </Pressable>
            ))}

            {/* Empty State */}
            {dataLog.length === 0 && (
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
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </VStack>
  );
}
