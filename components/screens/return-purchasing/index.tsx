import Header from "@/components/header";
import {
  Heading,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { useSuppliers } from "@/lib/api/suppliers";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function PurchasingSupplierList() {
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const [search, setSearch] = useState("");
  const router = useRouter();

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="PILIH SUPPLIER"
        isGoBack
        action={
          <Pressable
            className="p-6"
            onPress={() =>
              router.push("/(main)/management/return/purchasing/history")
            }
          >
            <SolarIconBold name="History" size={20} color="#FDFBF9" />
          </Pressable>
        }
      />
      <VStack className="flex-1">
        <HStack
          space="sm"
          className="p-4 shadow-lg bg-background-0 items-center"
        >
          <Input className="flex-1 border border-background-300 rounded-lg h-10">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField
              placeholder="Cari nama supplier..."
              value={search}
              onChangeText={setSearch}
            />
          </Input>
        </HStack>
        <ScrollView className="flex-1">
          {loadingSuppliers ? (
            <VStack className="items-center py-10">
              <Spinner />
            </VStack>
          ) : !suppliers?.length ? (
            <VStack className="items-center py-10">
              <Text className="text-gray-400">Belum ada supplier</Text>
            </VStack>
          ) : (
            suppliers
              ?.filter(
                (s) =>
                  !search ||
                  s.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((supplier) => (
                <Pressable
                  key={supplier.id}
                  className="px-4 py-4 border-b border-gray-200 active:bg-gray-100"
                  onPress={() => {
                    router.navigate(
                      `/(main)/management/return/purchasing/supplier/${supplier.id}`,
                    );
                    // setSearch("");
                  }}
                >
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Heading size="sm">{supplier.name}</Heading>
                      {supplier.phone && (
                        <Text size="xs" className="text-gray-500">
                          {supplier.phone}
                        </Text>
                      )}
                    </VStack>
                    <Text className="text-gray-400 text-lg">›</Text>
                  </HStack>
                </Pressable>
              ))
          )}
        </ScrollView>
      </VStack>
    </Box>
  );
}
