import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
import { useItemSelection } from '@/hooks/use-item-selection';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { getErrorMessage } from '@/db/client';
import { useRoles } from '@/hooks/use-role';
import { useBulkDeleteUser, useCreateUser, User, useUsers } from '@/hooks/use-user';
import { bulkDeleteConfirm } from '@/utils/delete-confirm';
import { exportUsers, importUsers } from '@/utils/excel';
import { showSuccessToast, showToast } from '@/utils/toast';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlashList } from '@shopify/flash-list';

export default function UserList() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useUsers();
  const { data: rolesData } = useRoles();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<User>();

  const users = data || [];
  const roles = rolesData || [];

  const deleteMutation = useBulkDeleteUser();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Karyawan berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });
  const createMutation = useCreateUser();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportUsers(users);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importUsers(roles.map((r) => ({ id: r.id, name: r.name })));
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      showSuccessToast(toast, `${successCount} karyawan berhasil diimpor`);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleAddUser = () => {
    clearSelection();
    router.push('/(main)/management/role-user/user/add');
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="KARYAWAN"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Karyawan terpilih"
        onCancelSelectedItems={clearSelection}
        action={
          <HStack space="sm" className="w-[72px]">
            {hasSelection ? (
              isBulkDeleting ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <Pressable
                  className="p-6"
                  onPress={() => triggerBulkDelete(bulkDeleteConfirm('karyawan', selectedItems))}
                >
                  <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                </Pressable>
              )
            ) : (
              <Pressable
                className="p-6"
                onPress={() => {
                  showActionDrawer({
                    actions: [
                      {
                        label: 'Export Data',
                        icon: 'Export',
                        onPress: handleExport,
                      },
                      {
                        label: 'Import Data',
                        icon: 'Import',
                        onPress: handleImport,
                      },
                    ],
                  });
                }}
              >
                <SolarIconBold
                  name="MenuDots"
                  size={20}
                  color="#FDFBF9"
                  style={{ transform: [{ rotate: '90deg' }] }}
                />
              </Pressable>
            )}
          </HStack>
        }
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <FlashList
            data={users}
            className="flex-1"
            keyExtractor={(user) => user.id}
            renderItem={({ item: user }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(user) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(user);
                  } else {
                    router.navigate(`/(main)/management/role-user/user/detail/${user.id}`);
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(user)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                      <Text className="text-brand-primary font-bold">
                        {(user.firstName || user.username).substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>
                    <VStack>
                      <Heading size="sm">{user.firstName || user.username}</Heading>
                      <Text size="xs" className="text-slate-500">
                        {user.roles?.[0]?.role?.name || 'No role'}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <Text size="xs" className="text-brand-primary text-sm font-bold">
                      Terakhir Login
                    </Text>
                    <Text size="xs">
                      {user.lastLoginAt ? dayjs(user.lastLoginAt).format('DD MMMM YYYY') : '-'}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">No users found</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddUser}
            >
              <ButtonText className="text-white">TAMBAH KARYAWAN</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
