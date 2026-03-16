import Header from "@/components/header";
import {
  Box,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useProductSuppliers } from "@/lib/api/product-suppliers";
import { useProduct } from "@/lib/api/products";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView } from "react-native";

import { formatNumber } from "@/lib/utils/format";
export default function ProductSuppliersList() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const { data: product, isLoading: isLoadingProduct } = useProduct(
    productId || "",
  );
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useProductSuppliers(productId || "");

  const [search, setSearch] = useState("");

  const isLoading = isLoadingProduct || isLoadingSuppliers;

  // Filter suppliers by search
  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((s) =>
      s.supplierName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [suppliers, search]);

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header={`SUPPLIER - ${product?.name?.toUpperCase()}`} isGoBack />

      <VStack className="flex-1">
        {/* Search Bar */}
        <VStack
          space="md"
          className="p-4 shadow-sm bg-background-0 border-b border-background-200"
        >
          <Input className="border border-background-300 rounded-lg h-10">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField
              placeholder="Cari nama supplier"
              value={search}
              onChangeText={setSearch}
            />
          </Input>

          <HStack className="justify-between items-center">
            <Text className="text-typography-500 text-sm">
              {filteredSuppliers.length} supplier ditemukan
            </Text>
          </HStack>
        </VStack>

        {/* Suppliers List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <VStack>
            {filteredSuppliers.map((supplier) => (
              <Pressable
                key={supplier.supplierId}
                className="p-4 border-b border-background-200 active:bg-gray-100"
                onPress={() => {
                  router.push(
                    `/(main)/management/product-category-brand/product/suppliers/${productId}/transactions/${supplier.supplierId}`,
                  );
                }}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center flex-1">
                    {/* Avatar */}
                    <Box className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                      <Text className="text-primary-600 font-bold text-lg">
                        {supplier.supplierName.substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>

                    {/* Supplier Info */}
                    <VStack className="flex-1">
                      <Heading size="sm">{supplier.supplierName}</Heading>
                      <Text size="xs" className="text-typography-500">
                        {supplier.totalQuantity} pcs · Rp{" "}
                        {formatNumber(supplier.totalValue)}
                      </Text>
                      <Text size="xs" className="text-typography-400">
                        Terakhir:{" "}
                        {dayjs(supplier.lastPurchaseDate).format("DD/MM/YYYY")}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Transaction Count Badge */}
                  <Box className="bg-info-50 px-3 py-1 rounded-full">
                    <Text className="text-info-600 font-bold text-xs">
                      {supplier.transactionCount} transaksi
                    </Text>
                  </Box>
                </HStack>
              </Pressable>
            ))}

            {/* Empty State */}
            {filteredSuppliers.length === 0 && (
              <VStack className="p-12 items-center justify-center">
                <SolarIconBoldDuotone
                  name="UserCircle"
                  size={64}
                  color="#CBD5E1"
                />
                <Text className="text-typography-400 text-center mt-4">
                  {search
                    ? "Supplier tidak ditemukan"
                    : "Belum ada supplier untuk produk ini"}
                </Text>
              </VStack>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </VStack>
  );
}
