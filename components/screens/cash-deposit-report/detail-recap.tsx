import Header from '@/components/header';
import { Heading, HStack, Pressable, Text, VStack } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { useShiftDetail } from '@/hooks/use-shift';
import dayjs from 'dayjs';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { formatNumber } from '@/utils/format';

export default function CashDepositDetailRecap() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: detailShift, isLoading } = useShiftDetail(id || '');

  const transactionHistory = detailShift?.transactionHistory?.filter(
    (f) => f.type === 'CASH_DEPOSIT',
  );

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="DETAIL REKAP SETOR TUNAI" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DETAIL REKAP SETOR TUNAI" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!transactionHistory || transactionHistory?.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Belum ada histori setor tunai pada shift ini</Text>
          </Box>
        ) : (
          transactionHistory?.map((trx) => {
            const date = trx.transactionDate ? dayjs(trx.transactionDate) : dayjs();
            return (
              <Pressable
                key={trx.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
              >
                <HStack space="xl" className="items-center">
                  <VStack>
                    <Heading size="lg">{date.format('DD MMMM YYYY')}</Heading>
                    <Text className="text-typography-500 font-bold">{date.format('HH:mm:ss')}</Text>
                  </VStack>
                  <HStack space="xl" className="flex-1 items-center justify-end">
                    <VStack className="items-end">
                      <Text className="text-typography-400 text-xs">Total Setor Tunai</Text>
                      <Heading size="lg">Rp {formatNumber(trx.nominal)}</Heading>
                    </VStack>
                    <Text className="text-typography-400 text-lg"></Text>
                  </HStack>
                </HStack>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
