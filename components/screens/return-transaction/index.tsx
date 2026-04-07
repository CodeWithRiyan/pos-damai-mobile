import Header from '@/components/header';
import {
  Heading,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
  VStack,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { useCustomers } from '@/hooks/use-customer';
import { useCustomerIdsWithTransactions } from '@/hooks/use-transaction';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

export default function PurchasingCustomerList() {
  const {
    data: customers,
    isLoading: loadingCustomers,
    refetch: refetchCustomers,
  } = useCustomers();
  const {
    data: customerIdsWithTransactions,
    isLoading: loadingTransactions,
    refetch: refetchTransactions,
  } = useCustomerIdsWithTransactions();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const isLoading = loadingCustomers || loadingTransactions;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchCustomers();
    await refetchTransactions();
    setRefreshing(false);
  }, [refetchCustomers, refetchTransactions]);

  const filteredCustomers =
    isLoading || !Array.isArray(customerIdsWithTransactions)
      ? []
      : (customers ?? []).filter(
          (s) =>
            customerIdsWithTransactions.includes(s.id) &&
            (!search || s.name.toLowerCase().includes(search.toLowerCase())),
        );

  const hasNoCustomersWithTransactions =
    !isLoading &&
    Array.isArray(customerIdsWithTransactions) &&
    customerIdsWithTransactions.length === 0;

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="PILIH PELANGGAN"
        isGoBack
        action={
          <Pressable
            className="p-6"
            onPress={() => router.push('/(main)/management/return/transaction/history')}
          >
            <SolarIconBold name="History" size={20} color="#FDFBF9" />
          </Pressable>
        }
      />
      <VStack className="flex-1">
        <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
          <Input className="flex-1 border border-background-300 rounded-lg h-10">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField
              placeholder="Cari nama customer..."
              value={search}
              onChangeText={setSearch}
            />
          </Input>
        </HStack>
        <FlashList
          data={filteredCustomers}
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(customer) => customer.id}
          renderItem={({ item: customer }) => (
            <Pressable
              className="px-4 py-4 border-b border-gray-200 active:bg-gray-100"
              onPress={() => {
                router.push(`/(main)/management/return/transaction/input/${customer.id}` as any);
              }}
            >
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <Heading size="sm">{customer.name}</Heading>
                  {!!customer.phone && (
                    <Text size="xs" className="text-gray-500">
                      {customer.phone}
                    </Text>
                  )}
                </VStack>
                <Text className="text-gray-400 text-lg">›</Text>
              </HStack>
            </Pressable>
          )}
          ListEmptyComponent={
            isLoading || !customerIdsWithTransactions ? (
              <VStack className="items-center py-10">
                <Spinner />
              </VStack>
            ) : hasNoCustomersWithTransactions ? (
              <VStack className="items-center py-10">
                <Text className="text-gray-400">Belum ada pelanggan dengan transaksi selesai</Text>
              </VStack>
            ) : (
              <VStack className="items-center py-10">
                <Text className="text-gray-400">Belum ada customer</Text>
              </VStack>
            )
          }
        />
      </VStack>
    </Box>
  );
}
