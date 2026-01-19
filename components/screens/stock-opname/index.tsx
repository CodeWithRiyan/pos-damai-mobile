import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { Heading, Icon } from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useStockOpnameStore } from "@/stores/stock-opname";
import dayjs from "dayjs";
// import { useBulkDeleteStockOpname, StockOpname, useStockOpname } from "@/lib/api/stock-opname";
import { useRouter } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";

export interface StockOpname {
  id: string;
  date: string;
  products: {
    productId: string;
    code: string;
    name: string;
    quantitySystem: number;
    quantityPhysical: number;
    type: string;
  }[];
  note: string;
  status: "DIFFERENCE" | "DONE";
  createdBy: string;
  createdAt: string;
}

export const _data: StockOpname[] = [
  {
    id: "2",
    date: "2026-01-10",
    products: [
      {
        productId: "p1",
        code: "PRD001",
        name: "Product 1",
        quantitySystem: 95,
        quantityPhysical: 95,
        type: "DEFAULT",
      },
      {
        productId: "p2",
        code: "PRD002",
        name: "Product 2",
        quantitySystem: 48,
        quantityPhysical: 48,
        type: "DEFAULT",
      },
    ],
    note: "Stock opname for January",
    status: "DONE",
    createdBy: "admin",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "1",
    date: "2026-01-10",
    products: [
      {
        productId: "p1",
        code: "PRD001",
        name: "Product 1",
        quantitySystem: 100,
        quantityPhysical: 95,
        type: "DEFAULT",
      },
      {
        productId: "p2",
        code: "PRD002",
        name: "Product 2",
        quantitySystem: 50,
        quantityPhysical: 48,
        type: "DEFAULT",
      },
    ],
    note: "Stock opname for January",
    status: "DIFFERENCE",
    createdBy: "admin",
    createdAt: "2026-01-10T10:00:00Z",
  },
];

export default function StockOpnameList() {
  const { cart } = useStockOpnameStore();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  // const { data, isLoading, refetch } = useStockOpname();

  const stockOpname = _data;
  const isLoading = false;

  const handleAddStockOpname = () => {
    router.push("/(main)/management/stock-opname/input");
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header="STOCK OPNAME" isGoBack />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {stockOpname?.map((so) => (
                <Pressable
                  key={so.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100${!!cart.find((item) => item.product.id === so.id) ? " bg-gray-100" : ""}`}
                  onPress={() => {
                    router.navigate(
                      `/(main)/management/stock-opname/detail/${so.id}`,
                    );
                  }}
                >
                  <HStack className="flex-1">
                    <VStack className="flex-1">
                      <Text className="text-gray-500 font-bold">Tanggal</Text>
                      <Text>
                        {dayjs(so.date).format("DD-MM-YYYY HH:mm:ss")}
                      </Text>
                    </VStack>
                    <VStack className="flex-1">
                      <Text className="text-gray-500 font-bold">Nama</Text>
                      <Text>{so.createdBy}</Text>
                    </VStack>
                    <HStack className="absolute right-0 top-0 h-full">
                      <HStack className="h-full items-center justify-center">
                        {so.status === "DONE" ? (
                          <Heading size="sm" className="text-success-600">
                            Sesuai
                          </Heading>
                        ) : (
                          <Icon as={CircleAlert} size="md" color="#ef4444" />
                        )}
                      </HStack>
                      <HStack className="h-full ml-4 items-center justify-center">
                        <Heading size="lg" className="text-gray-400">
                          ›
                        </Heading>
                      </HStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
              {stockOpname?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    No Stock Opname found
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddStockOpname}
            >
              <ButtonText className="text-white">
                TAMBAH STOCK OPNAME
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
