import { useCallback } from 'react';
import Header from '@/components/header';
import { Box, HStack, Spinner, Text, VStack } from '@/components/ui';
import { Grid, GridItem } from '@/components/ui/grid';
import { Pressable } from '@/components/ui/pressable';
import { useStoreSupply } from '@/hooks/use-store-supplies';
import dayjs from 'dayjs';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ScrollView } from 'react-native';

import { formatMoney } from '@/utils/format';
export default function StoreSuppliesDetail() {
  const { id } = useLocalSearchParams();
  const storeSuppliesId = id as string;

  const {
    data: storeSupplies,
    isLoading,
    refetch: refetchStoreSupplies,
  } = useStoreSupply(storeSuppliesId);

  useFocusEffect(
    useCallback(() => {
      refetchStoreSupplies();
    }, []),
  );

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!storeSupplies) {
    return (
      <Box className="flex-1 justify-center items-center bg-white">
        <Text>Data not found</Text>
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DETAIL KEBUTUHAN TOKO" action={<HStack space="sm"></HStack>} isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Dibuat Oleh</Text>
            <Text className="font-bold">{storeSupplies.createdBy || '-'}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Tanggal</Text>
            <Text className="font-bold">
              {dayjs(storeSupplies.date).format('DD MMM YYYY HH:mm')}
            </Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Keterangan</Text>
            <Text className="font-bold">{storeSupplies.note || '-'}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Total Pengurangan Modal</Text>
            <Text className="font-bold text-error-500">
              {formatMoney(
                storeSupplies.items?.reduce(
                  (sum, item) => sum + (item.usage || 0) * (item.purchasePrice || 0),
                  0,
                ) || 0,
              )}
            </Text>
          </VStack>
        </Box>
        <VStack space="md" className="w-full">
          <Text className="text-center text-lg font-bold pt-4">Daftar Barang</Text>
          {storeSupplies.items?.map((item, index: number) => (
            <Pressable
              key={index}
              className="px-4 py-2 border-b border-background-300 active:bg-gray-100"
            >
              <Grid _extra={{ className: 'grid-cols-2 gap-4' }}>
                <GridItem _extra={{ className: 'col-span-2' }}>
                  <Text className="font-bold text-lg">{item.productName || '-'}</Text>
                </GridItem>
                <GridItem _extra={{ className: 'col-span-1' }}>
                  <Text className="text-gray-500">Stok Sistem</Text>
                  <Text className="font-bold">{item.quantitySystem}</Text>
                </GridItem>
                <GridItem _extra={{ className: 'col-span-1' }}>
                  <Text className="text-gray-500">Jumlah Diambil</Text>
                  <Text className="font-bold">{item.usage}</Text>
                </GridItem>
                <GridItem _extra={{ className: 'col-span-1' }}>
                  <Text className="text-gray-500">Stok Saat Ini</Text>
                  <Text className="font-bold">{item.quantitySystem - item.usage}</Text>
                </GridItem>
                <GridItem _extra={{ className: 'col-span-1' }}>
                  <Text className="text-gray-500">Pengurangan Modal</Text>
                  <Text className="font-bold text-error-500">
                    {formatMoney((item.purchasePrice || 0) * (item.usage || 0))}
                  </Text>
                </GridItem>
              </Grid>
            </Pressable>
          ))}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
