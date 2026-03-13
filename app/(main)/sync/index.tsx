import Header from "@/components/header";
import { Box, Text, VStack, HStack, Button, ButtonText, Icon } from "@/components/ui";
import { ScrollView } from "react-native";
import { useDirtyCount } from "@/hooks/use-dirty-count";
import { useSyncQueueStore } from "@/stores/sync-queue-store";
import { SyncEngine } from "@/lib/sync/sync-engine";
import { useNetworkStore } from "@/stores/network-store";
import { useState } from "react";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { RepeatIcon, ArrowUpIcon, DownloadIcon } from "@/components/ui/icon";
import dayjs from "dayjs";

export default function SyncScreen() {
  const { dirtyCount, refetch } = useDirtyCount();
  const isSyncing = useSyncQueueStore((state) => state.isSyncing);
  const setIsSyncing = useSyncQueueStore((state) => state.setIsSyncing);
  const lastSyncAt = useSyncQueueStore((state) => state.lastSyncAt);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const { showPopUpConfirm } = usePopUpConfirm();
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const lastPullLabel = lastSyncAt
    ? dayjs(lastSyncAt).format("DD MMM YYYY HH:mm")
    : "Belum pernah sinkron";

  const handleManualSync = async () => {
    showPopUpConfirm({
      title: 'Mulai Sinkronisasi',
      description: 'Aplikasi akan menyamakan data lokal dengan server. Pastikan koneksi internet stabil.',
      okText: 'Mulai Sekarang',
      closeText: 'Batal',
      showClose: true,
      onOk: async () => {
        setIsSyncing(true);
        setLastSyncResult(null);
        try {
          await SyncEngine.sync();
          await refetch();
          setLastSyncResult('Sinkronisasi berhasil!');
        } catch (error) {
          console.error('[SyncScreen] Sync failed:', error);
          setLastSyncResult('Sinkronisasi gagal. Silakan coba lagi.');
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  return (
    <Box className="flex-1 bg-white">
      <Header header="SINKRONISASI DATA" />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <VStack space="xl">
          <Box className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-4">Status Saat Ini</Text>

            <VStack space="md">
              <HStack className="justify-between items-center">
                <HStack space="sm" className="items-center">
                  <Icon as={isConnected ? DownloadIcon : ArrowUpIcon} />
                  <Text className="text-gray-700">Koneksi Internet</Text>
                </HStack>
                <Text className={isConnected ? "text-success-600 font-bold" : "text-error-600 font-bold"}>
                  {isConnected ? "Terhubung" : "Terputus"}
                </Text>
              </HStack>

              <HStack className="justify-between items-center">
                <HStack space="sm" className="items-center">
                  <Icon as={ArrowUpIcon} />
                  <Text className="text-gray-700">Data Tertunda (Push)</Text>
                </HStack>
                <Text className={dirtyCount > 0 ? "text-primary-600 font-bold" : "text-gray-600 font-bold"}>
                  {dirtyCount} Record
                </Text>
              </HStack>

              <HStack className="justify-between items-center">
                <HStack space="sm" className="items-center">
                  <Icon as={DownloadIcon} />
                  <Text className="text-gray-700">Terakhir Pull</Text>
                </HStack>
                <Text className="text-gray-600 font-bold">{lastPullLabel}</Text>
              </HStack>
            </VStack>
          </Box>

          <VStack space="md">
            <Button
              size="lg"
              action="primary"
              onPress={handleManualSync}
              disabled={isSyncing || !isConnected}
              className="bg-brand-primary h-14 rounded-xl"
            >
              <Icon as={RepeatIcon} className="mr-2" />
              <ButtonText>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</ButtonText>
            </Button>

            {lastSyncResult && (
              <Text className={`text-center text-sm font-medium ${lastSyncResult.includes('berhasil') ? 'text-success-600' : 'text-error-600'}`}>
                {lastSyncResult}
              </Text>
            )}
          </VStack>

          <Box className="mt-4">
            <Text className="text-gray-400 text-xs leading-5">
              * Sinkronisasi data mengirimkan perubahan yang Anda buat saat offline ke server dan mengambil data terbaru dari server.
            </Text>
            <Text className="text-gray-400 text-xs leading-5 mt-2">
              * Pastikan Anda tidak menutup aplikasi selama proses sinkronisasi berlangsung.
            </Text>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}
