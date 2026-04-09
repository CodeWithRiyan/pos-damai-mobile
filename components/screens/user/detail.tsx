import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { Box, HStack, Text, VStack } from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { useDeleteEntity } from '@/hooks/use-delete-entity';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { refetchUserById, useDeleteUser, User, useUsers } from '@/hooks/use-user';
import { useUserStore } from '@/stores/user';
import { singleDeleteConfirm } from '@/utils/delete-confirm';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';

export default function UserDetail() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = id as string;

  const [user, setUser] = useState<User | null>(null);

  const { refetch: refetchUsers } = useUsers();
  const deleteMutation = useDeleteUser();

  const onRefetch = useCallback(async () => {
    if (userId) {
      const freshUser = await refetchUserById(userId);
      setUser(freshUser);
    }
    refetchUsers();
  }, [userId, refetchUsers]);

  useStoreVersionSync(useUserStore, onRefetch);

  const { triggerDelete } = useDeleteEntity({
    successMessage: 'Karyawan berhasil dihapus',
    deleteMutation,
    onSuccess: () => {
      useUserStore.getState().incrementVersion();
      onRefetch();
    },
  });

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: 'Edit',
          icon: 'Pen',
          onPress: () => {
            router.push(`/(main)/management/role-user/user/edit/${user?.id}`);
            hideActionDrawer();
          },
        },
        {
          label: 'Hapus',
          icon: 'TrashBin2',
          theme: 'red',
          onPress: () => {
            triggerDelete(singleDeleteConfirm('karyawan', user?.id || '', user?.username));
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL KARYAWAN"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: '90deg' }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Nama</Text>
            <Text className="font-bold">{user?.firstName}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Role</Text>
            <Text className="font-bold">{user?.roles?.[0]?.role?.name || '-'}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Username</Text>
            <Text className="font-bold">{user?.username || '-'}</Text>
          </VStack>
          <VStack className="w-1/2 pr-4">
            <Text className="text-gray-500">Tanggal Terakhir Login</Text>
            <Text className="font-bold">
              {user?.lastLoginAt ? dayjs(user?.lastLoginAt).format('DD MMMM YYYY') : '-'}
            </Text>
          </VStack>
        </Box>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-background-0 border border-primary-500"
          onPress={() => {
            router.push(`/(main)/management/role-user/user/log/${user?.id}`);
          }}
        >
          <Text size="sm" className="text-brand-primary font-bold">
            LOG AKTIVITAS
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
