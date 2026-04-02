import Header from '@/components/header';
import {
  Box,
  Heading,
  HStack,
  Icon,
  Pressable,
  Spinner,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from '@/components/ui';
import { useContinueDraft, useDeleteTransaction, useTransactions } from '@/lib/api/transactions';
import { Status } from '@/lib/constants';
import { useTransactionStore } from '@/stores/transaction';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { useCustomers } from '@/lib/api/customers';
import { useUsers } from '@/lib/api/users';
import { formatNumber } from '@/lib/utils/format';
export default function TransactionDraft() {
  const router = useRouter();
  const { data: transactions, isLoading: isTransactionsLoading } = useTransactions();
  const { data: customers, isLoading: isCustomersLoading } = useCustomers();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const isLoading = isTransactionsLoading || isCustomersLoading || isUsersLoading;
  const toast = useToast();
  const deleteMutation = useDeleteTransaction({
    onSuccess: () => {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>Berhasil hapus draft</ToastTitle>
          </Toast>
        ),
      });
    },
    onError: (error) => {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>{`Gagal hapus draft: ${error.message}`}</ToastTitle>
          </Toast>
        ),
      });
    },
  });
  const continueDraftMutation = useContinueDraft();
  const { addCartItem, resetCart, setStatus, setTransactionId, setCustomer, setEmployee } =
    useTransactionStore();

  // Filter only DRAFT status
  const drafts = transactions?.filter((t) => t.status === Status.DRAFT) || [];

  const handleContinueDraft = async (transactionId: string) => {
    const result = await continueDraftMutation.mutateAsync(transactionId);

    if (!result) return;

    resetCart();
    for (const item of result.items) {
      if (item.product) {
        addCartItem({
          product: {
            ...item.product,
          } as any,
          tempSellPrice: item.sellPrice,
          quantity: item.quantity,
          note: item.note ?? undefined,
        });
      }
    }
    setStatus(Status.DRAFT);
    setTransactionId(result.transactionId);
    if (result.customerId) {
      setCustomer(customers?.find((c) => c.id === result.customerId) || null);
    }
    if (result.employeeId) {
      const user = users?.find((u) => u.id === result.employeeId);
      setEmployee({
        id: user?.id || '',
        name: user?.firstName || '',
        username: user?.username || '',
      });
    }
    router.replace('/(main)/transaction');
  };

  const handleDeleteDraft = (transactionId: string) => {
    deleteMutation.mutate(transactionId);
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="DRAFT TRANSAKSI" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DRAFT TRANSAKSI" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {drafts.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Tidak ada draft transaksi</Text>
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
                          <Text className="text-typography-400 text-xs">Estimasi Total</Text>
                          <Text className="font-bold">Rp {formatNumber(draft.totalAmount)}</Text>
                        </VStack>
                        <VStack>
                          <Text className="text-typography-400 text-xs">Pelanggan</Text>
                          <Text className="font-bold">{draft.customerName}</Text>
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
