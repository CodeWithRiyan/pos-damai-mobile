import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
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
import {
  Supplier,
  useBulkDeleteSupplier,
  useCreateSupplier,
  useSuppliers,
} from '@/lib/api/suppliers';
import { bulkDeleteConfirm } from '@/lib/utils/delete-confirm';
import { exportSuppliers, importSuppliers } from '@/lib/utils/excel';
import { useItemSelection } from '@/hooks/use-item-selection';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';

export default function SupplierList() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useSuppliers();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<Supplier>();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const suppliers = data || [];

  const deleteMutation = useBulkDeleteSupplier();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Supplier berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });
  const createMutation = useCreateSupplier();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportSuppliers(suppliers);
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

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importSuppliers();
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync({
            name: dto.name,
            phone: dto.phone ?? undefined,
            address: dto.address ?? undefined,
          } as any);
          successCount++;
        } catch {}
      }
      refetch();
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>{`${successCount} supplier berhasil diimpor`}</ToastTitle>
          </Toast>
        ),
      });
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
    router.push('/(main)/management/customer-supplier/supplier/add');
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
        header="SUPPLIER"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Supplier terpilih"
        onCancelSelectedItems={() => clearSelection()}
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
                  onPress={() => triggerBulkDelete(bulkDeleteConfirm('supplier', selectedItems))}
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
            data={suppliers}
            className="flex-1"
            keyExtractor={(supplier) => supplier.id}
            renderItem={({ item: supplier }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(supplier) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(supplier);
                  } else {
                    router.navigate(
                      `/(main)/management/customer-supplier/supplier/detail/${supplier.id}`,
                    );
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(supplier)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                      <Text className="text-brand-primary font-bold">
                        {supplier.name.substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>
                    <VStack>
                      <Heading size="sm">{supplier.name}</Heading>
                    </VStack>
                  </HStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">No suppliers found</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH SUPPLIER</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
