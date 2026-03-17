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
import { FlatList } from "react-native";
// Note: Update imports if useProductLog is missing
import { useProductLog, IProductLog } from "@/lib/api/products";

export default function ProductLog() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const { data: product, isLoading: isLoadingProduct } = useProduct(
    productId || "",
  );

  const { data: dataLog = [], isLoading: isLoadingLogs } = useProductLog(
    productId || "",
  );

  const isLoading = isLoadingProduct || isLoadingLogs;

  const activityHelper = (log: IProductLog) => {
    switch (log.type) {
      case "INITIAL_STOCK":
        return "STOK AWAL";
      case "PURCHASE":
        return "PEMBELIAN";
      case "SALE":
        return "PENJUALAN";
      case "STOCK_OPNAME":
        return "STOK OPNAME";
      case "SALES_RETURN":
      case "RETURN_SALE":
        return "RETUR PENJUALAN";
      case "PURCHASE_RETURN":
      case "RETURN_PURCHASE":
        return "RETUR PEMBELIAN";
      case "STORE_SUPPLIES":
      case "STORE_SUPPLY":
        return "KEBUTUHAN TOKO";
      default:
        return String(log.type).replace(/_/g, " ");
    }
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
      <Header
        header={`LOG PRODUK ${product?.name?.toUpperCase() ?? ""}`}
        isGoBack
      />

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
        <FlatList
          data={dataLog}
          className="flex-1"
          keyExtractor={(item, index) => item.id || index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: log }) => (
            <Pressable className="py-3 px-8 border-b border-background-200 active:bg-gray-100">
              <Grid _extra={{ className: "grid-cols-12" }}>
                <GridItem _extra={{ className: "col-span-5" }}>
                  <Text>
                    {dayjs(log.createdAt).format("DD-MM-YYYY HH:mm:ss")}
                  </Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-5" }}>
                  <Text>{activityHelper(log)}</Text>
                </GridItem>
                <GridItem _extra={{ className: "col-span-2" }}>
                  <Text
                    className={classNames(
                      "text-success-500 font-bold",
                      log.quantity < 0 && "text-error-500",
                    )}
                  >
                    {`${log.quantity > 0 ? "+" : ""} ${log.quantity}`}
                  </Text>
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
