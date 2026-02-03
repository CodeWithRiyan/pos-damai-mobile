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
import { useSupplierPurchaseReturnsSummary } from "@/lib/api/supplier-returns";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import { ScrollView } from "react-native";

export default function SupplierReturnsList() {
  const router = useRouter();
  const { data: suppliers = [], isLoading } = useSupplierPurchaseReturnsSummary();
  const [search, setSearch] = useState("");

  // Filter suppliers by search
  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((s) =>
      s.supplierName.toLowerCase().includes(search.toLowerCase())
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
      <Header header="RETUR PEMBELIAN - SUPPLIER" isGoBack />

      <VStack className="flex-1">
        {/* Search Bar */}
        <VStack space="md" className="p-4 shadow-sm bg-background-0 border-b border-background-200">
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
                    `/(main)/management/return/purchasing/suppliers/${supplier.supplierId}` as any
                  );
                }}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center flex-1">
                    {/* Avatar */}
                    <Box className="w-12 h-12 rounded-full bg-error-100 items-center justify-center">
                      <Text className="text-error-600 font-bold text-lg">
                        {supplier.supplierName.substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>

                    {/* Supplier Info */}
                    <VStack className="flex-1">
                      <Heading size="sm">{supplier.supplierName}</Heading>
                      <Text size="xs" className="text-typography-500">
                        {supplier.totalReturns} retur · Rp {supplier.totalValue.toLocaleString("id-ID")}
                      </Text>
                      <Text size="xs" className="text-typography-400">
                        Terakhir: {dayjs(supplier.lastReturnDate).format("DD/MM/YYYY")}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Return Count Badge */}
                  <Box className="bg-error-50 px-3 py-1 rounded-full">
                    <Text className="text-error-600 font-bold text-xs">
                      {supplier.totalReturns} transaksi
                    </Text>
                  </Box>
                </HStack>
              </Pressable>
            ))}

            {/* Empty State */}
            {filteredSuppliers.length === 0 && (
              <VStack className="p-12 items-center justify-center">
                <SolarIconBoldDuotone name="UserCircle" size={64} color="#CBD5E1" />
                <Text className="text-typography-400 text-center mt-4">
                  {search ? "Supplier tidak ditemukan" : "Belum ada riwayat retur pembelian"}
                </Text>
              </VStack>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </VStack>
  );
}
