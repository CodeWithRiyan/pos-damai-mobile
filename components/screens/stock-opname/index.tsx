import Header from '@/components/header';
import { Heading, Icon } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useStockOpnames } from '@/hooks/use-stock-opname';
import { useStockOpnameStore } from '@/stores/stock-opname';
import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function StockOpnameList({ isReport }: { isReport?: boolean }) {
  const { cart } = useStockOpnameStore();
  const router = useRouter();
  const { data: stockOpname, isLoading, refetch } = useStockOpnames();
  console.log('Stock Opname data:', stockOpname);
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddStockOpname = () => {
    router.push('/(main)/management/stock-changes/stock-opname/input');
  };

  if (isLoading && !refreshing) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header={isReport ? 'LAPORAN STOK OPNAME' : 'STOK OPNAME'} isGoBack />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView
            className="flex-1"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <VStack>
              {stockOpname?.map((so) => (
                <Pressable
                  key={so.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100${!!cart.find((item) => item.product.id === so.id) ? ' bg-gray-100' : ''}`}
                  onPress={() => {
                    router.navigate(
                      `/(main)/management/stock-changes/stock-opname/detail/${so.id}`,
                    );
                  }}
                >
                  <HStack className="flex-1">
                    <VStack className="flex-1">
                      <Text className="text-gray-500 font-bold">Tanggal</Text>
                      <Text>{dayjs(so.date).format('DD-MM-YYYY HH:mm:ss')}</Text>
                    </VStack>
                    <VStack className="flex-1">
                      <Text className="text-gray-500 font-bold">Nama</Text>
                      <Text>{so.createdBy || '-'}</Text>
                    </VStack>
                    <HStack className="absolute right-0 top-0 h-full">
                      <HStack className="h-full items-center justify-center">
                        {so.totalLoss === 0 ? (
                          <Heading size="sm" className="text-success-600">
                            Sesuai
                          </Heading>
                        ) : (
                          <VStack className="items-center">
                            <Icon as={CircleAlert} size="md" color="#ef4444" />
                            <Text size="xs" className="text-error-500 font-bold">
                              Selisih
                            </Text>
                          </VStack>
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
                  <Text className="text-slate-400 italic">Belum ada data Stock Opname</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          {!isReport && (
            <HStack className="w-full p-4">
              <Button
                size="sm"
                className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAddStockOpname}
              >
                <ButtonText className="text-white">TAMBAH STOK OPNAME</ButtonText>
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
