import Header from '@/components/header';
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
} from '@/components/ui';
import { Spinner } from '@/components/ui/spinner';
import { usePurchaseReturns } from '@/lib/api/return-purchasing';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList } from 'react-native';

import { formatNumber } from '@/lib/utils/format';
export default function ReturnPurchasingHistory({ isReport }: { isReport?: boolean }) {
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const router = useRouter();
  const { data: returns, isLoading } = usePurchaseReturns({ supplierId });

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header={isReport ? 'LAPORAN RETUR PEMBELIAN BARANG' : 'RIWAYAT RETUR PEMBELIAN BARANG'}
        isGoBack
      />
      <VStack space="sm" className="p-4 shadow-lg bg-background-0">
        <Input className="border border-background-300 rounded-lg h-10">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            placeholder={`Cari no transaksi${!supplierId ? ' atau nama supplier' : ''}`}
          />
        </Input>
      </VStack>
      {isLoading ? (
        <VStack className="items-center py-10">
          <Spinner />
        </VStack>
      ) : (
        <FlatList
          data={returns}
          className="flex-1"
          keyExtractor={(item) => item.id}
          renderItem={({ item: ret }) => {
            const date = dayjs(ret.createdAt);
            return (
              <Pressable
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                onPress={() =>
                  router.navigate(`/(main)/management/return/purchasing/receipt/${ret.id}`)
                }
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Text className="text-typography-500 font-bold">{date.format('HH:mm:ss')}</Text>
                    <HStack space="sm" className="items-center">
                      <Heading size="4xl">{date.date()}</Heading>
                      <VStack>
                        <Text className="text-typography-500 font-bold">{date.format('MMM')}</Text>
                        <Text className="text-typography-500 font-bold">{date.year()}</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                  <VStack space="sm" className="flex-1">
                    <HStack className="justify-between">
                      <VStack>
                        <Text className="text-typography-400 text-xs">Jumlah Retur</Text>
                        <Text className="font-bold">Rp {formatNumber(ret.totalAmount ?? 0)}</Text>
                      </VStack>
                      <VStack>
                        <Text className="text-typography-400 text-xs">Supplier</Text>
                        <Text className="font-bold">{ret.supplierName}</Text>
                      </VStack>
                      <VStack />
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-typography-400 font-bold">No: {ret.local_ref_id}</Text>
                    </HStack>
                  </VStack>
                  <Text className="text-typography-400 text-lg">›</Text>
                </HStack>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <VStack className="items-center py-10">
              <Text className="text-typography-400">Belum ada riwayat retur</Text>
            </VStack>
          }
        />
      )}
    </VStack>
  );
}
