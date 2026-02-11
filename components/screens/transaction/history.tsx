import Header from "@/components/header";
import {
  Heading,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { useTransactions } from "@/lib/api/transactions";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function TransactionHistory({
  isReport,
}: {
  isReport?: boolean;
}) {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const header =
    isReport && !customerId ? "LAPORAN PENJUALAN" : "RIWAYAT TRANSAKSI";
  const router = useRouter();

  const { data: allTransactions, isLoading } = useTransactions({
    customerId,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const transactions =
    allTransactions?.filter(
      (t) =>
        t.status === "COMPLETED" &&
        ((t.local_ref_id || t.id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
          t.customerName?.toLowerCase().includes(searchQuery.toLowerCase())),
    ) || [];

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header={header} isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header={header} isGoBack />
      <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
        <Input className="flex-1 border border-background-300 rounded-lg h-10">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            placeholder={`Cari no transaksi${!customerId ? " atau nama pelanggan" : ""}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </HStack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!transactions || transactions.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Belum ada histori transaksi</Text>
          </Box>
        ) : (
          transactions.map((transaction) => {
            const date = transaction.createdAt
              ? dayjs(transaction.createdAt)
              : dayjs();
            return (
              <Pressable
                key={transaction.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                onPress={() =>
                  router.navigate({
                    pathname: "/(main)/transaction/receipt/[id]",
                    params: { id: transaction.id },
                  })
                }
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Text className="text-typography-500 font-bold">
                      {date.format("HH:mm:ss")}
                    </Text>
                    <HStack space="sm" className="items-center">
                      <Heading size="4xl">{date.format("DD")}</Heading>
                      <VStack>
                        <Text className="text-typography-500 font-bold">
                          {date.format("MMM")}
                        </Text>
                        <Text className="text-typography-500 font-bold">
                          {date.format("YYYY")}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                  <VStack space="sm" className="flex-1">
                    <HStack className="justify-between">
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Total
                        </Text>
                        <Text className="font-bold">
                          Rp {transaction.totalAmount.toLocaleString("id-ID")}
                        </Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Pelanggan
                        </Text>
                        <Text className="font-bold">
                          {transaction.customerName}
                        </Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">
                          Pembayaran
                        </Text>
                        <Text className="font-bold">
                          {transaction.paymentTypeName}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-typography-400 font-bold">
                        No: {transaction.local_ref_id || transaction.id}
                      </Text>
                    </HStack>
                  </VStack>
                  <Text className="text-typography-400 text-lg">›</Text>
                </HStack>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
