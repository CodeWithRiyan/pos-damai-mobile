import Header from "@/components/header";
import { Box, Text, VStack } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useProduct } from "@/lib/api/products";
import classNames from "classnames";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

// TODO: move to service
export interface IProductLog {
  date: string;
  activity:
    | "SALES"
    | "PURCHASE"
    | "STOCK_OPNAME"
    | "STORE_SUPPLIES"
    | "SALES_RETURN"
    | "PURCHASE_RETURN";
  type: "IN" | "OUT";
  quantity: number;
}

// TODO: replace with real data
const dataLog: IProductLog[] = [
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "STOCK_OPNAME",
    type: "IN",
    quantity: 10,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "STOCK_OPNAME",
    type: "IN",
    quantity: 10,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "SALES",
    type: "OUT",
    quantity: 2,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "PURCHASE",
    type: "IN",
    quantity: 5,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "SALES_RETURN",
    type: "IN",
    quantity: 3,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "PURCHASE_RETURN",
    type: "OUT",
    quantity: 5,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "STOCK_OPNAME",
    type: "IN",
    quantity: 10,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "STOCK_OPNAME",
    type: "OUT",
    quantity: 6,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "STORE_SUPPLIES",
    type: "OUT",
    quantity: 1,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "SALES",
    type: "OUT",
    quantity: 2,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "PURCHASE",
    type: "IN",
    quantity: 5,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "SALES_RETURN",
    type: "IN",
    quantity: 3,
  },
  {
    date: "2023-02-01T00:00:00.000Z",
    activity: "PURCHASE_RETURN",
    type: "OUT",
    quantity: 5,
  },
];

export default function ProductLog() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const { data: product, isLoading: isLoadingProduct } = useProduct(
    productId || "",
  );

  const isLoading = isLoadingProduct;

  const activityHelper = (log: IProductLog) => {
    if (log.activity === "STOCK_OPNAME") return "STOK OPNAME";
    if (log.activity === "STORE_SUPPLIES") return "KEBUTUHAN TOKO";
    if (log.activity === "SALES") return "PENJUALAN";
    if (log.activity === "PURCHASE") return "PEMBELIAN";
    if (log.activity === "SALES_RETURN") return "RETUR PENJUALAN";

    return "RETUR PEMBELIAN";
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header={`LOG PRODUK ${product?.name.toUpperCase()}`} isGoBack />

      <VStack className="flex-1">
        {/* Log List */}
        <Pressable className="py-3 px-8 border-b border-background-200 active:bg-gray-100">
          <Grid _extra={{ className: "grid-cols-12" }}>
            <GridItem _extra={{ className: "col-span-5" }}>
              <Text className="font-bold">Tanggal</Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-5" }}>
              <Text className="font-bold">Aktivitas</Text>
            </GridItem>
            <GridItem _extra={{ className: "col-span-2" }}>
              <Text className="font-bold">Jumlah</Text>
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
                <Grid _extra={{ className: "grid-cols-12" }}>
                  <GridItem _extra={{ className: "col-span-5" }}>
                    <Text>{dayjs(log.date).format("DD-MM-YYYY HH:mm:ss")}</Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-5" }}>
                    <Text>{activityHelper(log)}</Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-2" }}>
                    <Text
                      className={classNames(
                        "text-success-500 font-bold",
                        log.type === "OUT" && "text-error-500",
                      )}
                    >
                      {`${log.type === "IN" ? "+" : "-"} ${log.quantity}`}
                    </Text>
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
