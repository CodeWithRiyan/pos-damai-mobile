import Header from '@/components/header';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import { Box, Heading, HStack, Icon, Pressable, Spinner, Text, VStack } from '@/components/ui';
import { FinanceType, Status } from '@/constants';
import { useDeleteFinance, useFinances } from '@/hooks/use-finance';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useFinanceStore } from '@/stores/finance';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useCallback } from 'react';
import { ScrollView } from 'react-native';

import { formatNumber } from '@/utils/format';
export default function FinanceDraft() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { data: finances, isLoading: isLoadingFinances, refetch } = useFinances();
  const { mutate: deleteFinance, isPending: isPendingDelete } = useDeleteFinance();
  const isLoading = isLoadingFinances || isPendingDelete;

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(useFinanceStore, handleVersionChange);

  // Filter only DRAFT status
  const drafts = finances?.filter((f) => f.status === Status.DRAFT) || [];

  const handleContinueDraft = async (financeId: string) => {
    // For now, we just navigate to Finance screen.
    // Usually we would pre-fill a store, but Finance doesn't have a large cart yet.
    // However, for consistency, we could pass the ID.
    router.replace({
      pathname: '/(main)/finance',
      params: { draftId: financeId },
    });
  };

  const handleDeleteDraft = async (financeId: string) => {
    showPopUpConfirm({
      title: 'HAPUS DRAFT',
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus draft`}
          <Text className="font-bold text-slate-900">{financeId}</Text>
          {`? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'HAPUS',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => {
        deleteFinance(financeId, {
          onSuccess: () => {
            useFinanceStore.getState().incrementVersion();
            hidePopUpConfirm();
          },
        });
      },
      loading: isLoading,
    });
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="DRAFT KEUANGAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DRAFT KEUANGAN" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {drafts.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Tidak ada draft keuangan</Text>
          </Box>
        ) : (
          drafts.map((draft) => {
            const date = draft.createdAt ? dayjs(draft.createdAt) : dayjs();
            return (
              <Box
                key={draft.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 border-b border-background-300"
              >
                <Pressable
                  className="flex-1 flex-row items-center gap-4"
                  onPress={() => handleContinueDraft(draft.id)}
                >
                  <HStack space="xl" className="items-center flex-1">
                    <VStack>
                      <Text className="text-typography-500 font-bold">
                        {date.format('HH:mm:ss')}
                      </Text>
                      <HStack space="sm" className="items-center">
                        <Heading size="4xl">{date.format('DD')}</Heading>
                        <VStack>
                          <Text className="text-typography-500 font-bold">
                            {date.format('MMM')}
                          </Text>
                          <Text className="text-typography-500 font-bold">
                            {date.format('YYYY')}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                    <VStack space="sm" className="flex-1">
                      <HStack className="justify-between">
                        <VStack>
                          <Text className="text-typography-400 text-xs">Nominal</Text>
                          <Text className="font-bold">Rp {formatNumber(draft.nominal)}</Text>
                        </VStack>
                        <VStack>
                          <Text className="text-typography-400 text-xs">Tipe</Text>
                          <Text
                            className={`font-bold ${draft.type === FinanceType.INCOME ? 'text-success-500' : 'text-error-500'}`}
                          >
                            {draft.type === FinanceType.INCOME ? 'Pemasukan' : 'Pengeluaran'}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack className="justify-between">
                        <Text className="text-typography-400 font-bold">
                          Ref: {draft.local_ref_id || draft.id}
                        </Text>
                      </HStack>
                    </VStack>
                    <Text className="text-typography-400 text-lg">›</Text>
                  </HStack>
                </Pressable>
                <Pressable
                  className="p-2 rounded-full bg-red-100 active:bg-red-200 ml-2"
                  onPress={() => handleDeleteDraft(draft.id)}
                >
                  <Icon as={Trash2} size="md" color="#ef4444" />
                </Pressable>
              </Box>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
