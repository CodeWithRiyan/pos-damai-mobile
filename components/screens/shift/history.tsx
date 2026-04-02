import { Box, HStack, Pressable, Text, VStack } from '@/components/ui';
import { useShifts } from '@/lib/api/shifts';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Spinner } from '@/components/ui/spinner';
import dayjs from 'dayjs';

export default function HistoryShift() {
  const router = useRouter();
  const { data: shifts, isLoading } = useShifts();

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <FlashList
        data={shifts}
        className="flex-1"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center gap-4 p-4 bg-white active:bg-gray-50 border-b border-black/10"
            onPress={() => {
              router.push(`/shift/detail/${item.id}`);
            }}
          >
            <VStack space="md" className="flex-1">
              <HStack className="flex-1">
                <VStack className="w-1/2">
                  <Text className="text-gray-500 font-bold">Kasir</Text>
                  <Text>{item.userName}</Text>
                </VStack>
                <VStack className="w-1/2">
                  <Text className="text-gray-500 font-bold">Mulai</Text>
                  <Text>{dayjs(item.startTime).format('DD-MM-YYYY HH:mm')}</Text>
                </VStack>
              </HStack>
              <HStack className="flex-1">
                <VStack className="w-1/2">
                  <Text className="text-gray-500 font-bold">Catatan</Text>
                  <Text>{item.note || '-'}</Text>
                </VStack>
                <VStack className="w-1/2">
                  <Text className="text-gray-500 font-bold">Berakhir</Text>
                  <Text>
                    {item.endTime ? dayjs(item.endTime).format('DD-MM-YYYY HH:mm') : 'Masih Aktif'}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            <Text className="text-gray-400 text-lg">›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Box className="py-20 justify-center items-center">
            <Text className="text-gray-500 italic">Belum ada riwayat shift</Text>
          </Box>
        }
      />
    </VStack>
  );
}
