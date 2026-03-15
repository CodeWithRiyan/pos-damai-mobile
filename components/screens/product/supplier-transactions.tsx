import Header from "@/components/header";
import { Box, HStack, Text, VStack } from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useProductSupplierTransactions } from "@/lib/api/product-suppliers";
import { useProduct } from "@/lib/api/products";
import { useSupplier } from "@/lib/api/suppliers";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView } from "react-native";

import { formatNumber } from "@/lib/utils/format";
export default function ProductSupplierTransactions() {
  const { productId, supplierId } = useLocalSearchParams<{
    productId: string;
    supplierId: string;
  }>();

  const { data: product, isLoading: isLoadingProduct } = useProduct(
    productId || "",
  );
  const { data: supplier, isLoading: isLoadingSupplier } = useSupplier(
    supplierId || "",
  );
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useProductSupplierTransactions(productId || "", supplierId || "");

  const isLoading =
    isLoadingProduct || isLoadingSupplier || isLoadingTransactions;

  // Calculate totals
  const summary = useMemo(() => {
    const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0);
    const totalValue = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
    return { totalQuantity, totalValue };
  }, [transactions]);

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="RIWAYAT TRANSAKSI" isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="flex-1">
          {/* Product & Supplier Info */}
          <VStack
            space="sm"
            className="p-4 bg-primary-50 border-b border-primary-100"
          >
            <HStack className="items-center">
              <SolarIconBoldDuotone name="Box" size={20} color="#3b82f6" />
              <Text className="text-primary-700 font-bold ml-2">Produk:</Text>
              <Text className="text-primary-600 ml-1">
                {product?.name || "-"}
              </Text>
            </HStack>
            <HStack className="items-center">
              <SolarIconBoldDuotone
                name="UserCircle"
                size={20}
                color="#3b82f6"
              />
              <Text className="text-primary-700 font-bold ml-2">Supplier:</Text>
              <Text className="text-primary-600 ml-1">
                {supplier?.name || "-"}
              </Text>
            </HStack>
          </VStack>

          {/* Summary Card */}
          <VStack
            space="sm"
            className="mx-4 p-4 bg-info-50 border border-info-200 rounded-lg"
          >
            <Text className="text-info-700 font-bold text-center">
              TOTAL PEMBELIAN
            </Text>
            <HStack className="justify-around">
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">Jumlah</Text>
                <Heading size="lg" className="text-info-600">
                  {summary.totalQuantity}
                </Heading>
                <Text className="text-typography-500 text-xs">pcs</Text>
              </VStack>
              <Box className="w-px bg-info-300" />
              <VStack className="items-center">
                <Text className="text-typography-500 text-xs">Total Nilai</Text>
                <Heading size="lg" className="text-info-600">
                  Rp {formatNumber(summary.totalValue)}
                </Heading>
                <Text className="text-typography-500 text-xs">
                  {transactions.length} transaksi
                </Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Transactions List */}
          <VStack className="px-4">
            <Text className="font-bold text-typography-700 mb-2">
              Riwayat Pembelian
            </Text>
            {transactions.map((transaction, index) => (
              <Box key={transaction.id} className="mb-3">
                <Grid
                  _extra={{ className: "grid-cols-2" }}
                  className="relative border border-background-200 rounded-md bg-background-0 p-4 pt-10 gap-2"
                >
                  {/* Date Header */}
                  <GridItem
                    _extra={{ className: "col-span-2" }}
                    className="absolute top-0 left-0"
                  >
                    <Box className="py-1 px-4 rounded-br-md bg-primary-50">
                      <Text className="text-primary-600 text-sm font-bold">
                        {dayjs(transaction.purchaseDate).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </Text>
                    </Box>
                  </GridItem>

                  {/* Transaction Details */}
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">No.</Text>
                    <Text className="text-sm font-bold">{index + 1}</Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">Jumlah</Text>
                    <Text className="text-sm font-bold">
                      {transaction.quantity} pcs
                    </Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">
                      Harga Satuan
                    </Text>
                    <Text className="text-sm font-bold">
                      Rp {formatNumber(transaction.unitPrice)}
                    </Text>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Text className="text-typography-500 text-sm">Total</Text>
                    <Text className="text-sm font-bold text-primary-600">
                      Rp {formatNumber(transaction.totalPrice)}
                    </Text>
                  </GridItem>
                  {transaction.note ? (
                    <GridItem _extra={{ className: "col-span-2" }}>
                      <Text className="text-typography-500 text-sm">
                        Catatan
                      </Text>
                      <Text className="text-sm">{transaction.note}</Text>
                    </GridItem>
                  ) : null}
                </Grid>
              </Box>
            ))}

            {/* Empty State */}
            {transactions.length === 0 && (
              <VStack className="p-12 items-center justify-center">
                <SolarIconBoldDuotone
                  name="Document"
                  size={64}
                  color="#CBD5E1"
                />
                <Text className="text-typography-400 text-center mt-4">
                  Belum ada riwayat transaksi
                </Text>
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}
