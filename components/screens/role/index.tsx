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
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { getErrorMessage } from '@/lib/api/client';
import { Role, useBulkDeleteRole, useRoles } from '@/lib/api/roles';
import { bulkDeleteConfirm } from '@/lib/utils/delete-confirm';
import { exportRoles } from '@/lib/utils/excel';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList } from 'react-native';

export default function RoleList() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useRoles();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<Role>();

  const roles = data || [];

  const deleteMutation = useBulkDeleteRole();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Role berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportRoles(roles);
    } catch (e) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(e)}</ToastTitle>
          </Toast>
        ),
      });
    }
  };

  const handleAdd = () => {
    clearSelection();
    router.push('/(main)/management/role-user/role/add');
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
        header="ROLE"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Role terpilih"
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
                  onPress={() => triggerBulkDelete(bulkDeleteConfirm('role', selectedItems))}
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
                        onPress: () => {
                          hideActionDrawer();
                        },
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
          <FlatList
            data={roles}
            className="flex-1"
            keyExtractor={(role) => role.id}
            renderItem={({ item: role }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(role) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(role);
                  } else {
                    router.navigate(`/(main)/management/role-user/role/detail/${role.id}`);
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(role)}
              >
                <HStack className="justify-between items-center">
                  <VStack className="flex-1">
                    <Heading size="sm">{role.name}</Heading>
                    {!!role.description && (
                      <Text size="xs" className="text-slate-400 mt-0.5">
                        {role.description}
                      </Text>
                    )}
                  </VStack>
                  <VStack className="items-end">
                    <Text size="xs" className="text-brand-primary text-sm font-bold">
                      User Aktif
                    </Text>
                    <Text size="xs">-</Text>
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">No roles found</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH ROLE</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
