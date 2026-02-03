import Header from "@/components/header";
import {
  Box,
  HStack,
  Text,
  VStack,
} from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useSupplierPurchaseReturns } from "@/lib/api/supplier-returns";
import { useSupplier } from "@/lib/api/suppliers";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView } from "react-native";

export default function SupplierReturnTransactions() {
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();

  const { data: supplier, isLoading: isLoadingSupplier } = useSupplier(supplierId || "");
  const { data: returns = [], isLoading: isLoadingReturns } =
    useSupplierPurchaseReturns(supplierId || "");

  const isLoading = isLoadingSupplier || isLoadingReturns;

  // Calculate totals
  const summary = useMemo(() => {
    const totalReturns = returns.length;
    const totalValue = returns.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalItems = returns.reduce((sum, r) => sum + r.itemCount, 0);
    return { totalReturns, totalValue, totalItems };
  }, [returns]);

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="RIWAYAT RETUR PEMBELIAN" isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="flex-1">
          {/* Supplier Info */}
          <VStack space="sm" className="p-4 bg-error-50 border-b border-error-100">
            <HStack className="items-center">
              <SolarIconBoldDuotone name="UserCircle" size={20} color="#dc2626" />
              <Text className="text-error-700 font-bold ml-2">Supplier:</Text>
              <Text className="text-error-600 ml-1">{supplier?.name || "-"}</Text>
            </HStack>
          </VStack>

          {/* Summary Card */}
          <VStack space="sm" className="mx-4 p-4 bg-error-50 border border-error-200 rounded-lg">
            <Text className="text-error-700 font-bold text-center">TOTAL RETUR PEMBELIAN</Text>
            <HStack className="justify-around">
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">Transaksi</Text>
                <Heading size="lg" className="text-error-600">
                  {summary.totalReturns}
                </Heading>
                <Text className="text-typography-500 text-xs">retur</Text>
              </VStack>
              <Box className="w-px bg-error-300" />
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">Total Item</Text>
                <Heading size="lg" className="text-error-600">
                  {summary.totalItems}
                </Heading>
                <Text className="text-typography-500 text-xs">item</Text>
              </VStack>
              <Box className="w-px bg-error-300" />
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">Total Nilai</Text>
                <Heading size="md" className="text-error-600">
                  Rp {summary.totalValue.toLocaleString("id-ID")}
                </Heading>
              </VStack>
            </HStack>
          </VStack>

          {/* Returns List */}
          <VStack className="px-4">
            <Text className="font-bold text-typography-700 mb-2">Riwayat Retur</Text>
            {returns.map((returnItem, index) => (
              <Box key={returnItem.id} className="mb-3">
                <Grid
                  _extra={{ className: "grid-cols-2" }}
                  className="relative border border-background-200 rounded-md bg-background-0 p-4 pt-10 gap-2"
                >
                  {/* Date Header */}
                  <GridItem _extra={{ className: "col-span-2" }} className="absolute top-0 left-0">
                    <Box className="py-1 px-4 rounded-br-md bg-error-50">
                      <Text className="text-error-600 text-sm font-bold">
                        {dayjs(returnItem.returnDate).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </Box>
                  </GridItem>

                  {/* Return Details */}
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">No.</Text>
                    <Text className="text-sm font-bold">{index + 1}</Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">Tipe Retur</Text>
                    <Text className="text-sm font-bold">
                      {returnItem.returnType === "CASH" ? "Uang" : "Barang"}
                    </Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">Jumlah Item</Text>
                    <Text className="text-sm font-bold">{returnItem.itemCount} item</Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">Total</Text>
                    <Text className="text-sm font-bold text-error-600">
                      Rp {returnItem.totalAmount.toLocaleString("id-ID")}
                    </Text>
                  </GridItem>
                  {returnItem.localRefId && (
                    <GridItem _extra={{ className: "col-span-2" }}>
                      <Text className="text-typography-500 text-sm">No. Transaksi</Text>
                      <Text className="text-sm font-bold">{returnItem.localRefId}</Text>
                    </GridItem>
                  )}
                </Grid>
              </Box>
            ))}

            {/* Empty State */}
            {returns.length === 0 && (
              <VStack className="p-12 items-center justify-center">
                <SolarIconBoldDuotone name="Document" size={64} color="#CBD5E1" />
                <Text className="text-typography-400 text-center mt-4">
                  Belum ada riwayat retur untuk supplier ini
                </Text>
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}
