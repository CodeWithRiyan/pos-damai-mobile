import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { PermissionGuard } from '@/components/permission-guard';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui';
import { Badge, BadgeText } from '@/components/ui/badge';
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
import {
  Brand,
  useBrands,
  useBulkDeleteBrand,
  useCapitalValueByBrand,
  useCreateBrand,
  useProductCountsByBrand,
} from '@/hooks/use-brand';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
import { useItemSelection } from '@/hooks/use-item-selection';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useBrandStore } from '@/stores/brand';
import { bulkDeleteConfirm } from '@/utils/delete-confirm';
import { exportBrands, importBrands } from '@/utils/excel';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import React, { useCallback } from 'react';

export default function BrandList() {
  const { setOpen, setData } = useBrandStore();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useBrands();
  const { data: productCounts, refetch: refetchCounts } = useProductCountsByBrand();
  const { data: capitalValues, refetch: refetchCapital } = useCapitalValueByBrand();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<Brand>();

  const brands = data || [];

  const handleVersionChange = useCallback(() => {
    refetch();
    refetchCounts();
    refetchCapital();
  }, [refetch, refetchCounts, refetchCapital]);

  useStoreVersionSync(useBrandStore, handleVersionChange);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchCounts();
      refetchCapital();
    }, [refetch, refetchCounts, refetchCapital]),
  );

  const deleteMutation = useBulkDeleteBrand();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Brand berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });

  const handleBulkDeleteWithCheck = (items: Brand[] | null) => {
    const idsWithProducts = items?.filter((item) => (productCounts?.[item.id] || 0) > 0);
    if (idsWithProducts && idsWithProducts.length > 0) {
      const names = idsWithProducts.map((i) => i.name).join(', ');
      showToast(toast, {
        action: 'error',
        message: `Tidak dapat menghapus. Brand "${names}"sedang digunakan oleh produk.`,
      });
      return;
    }
    triggerBulkDelete(bulkDeleteConfirm('brand', items));
  };
  const createMutation = useCreateBrand();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportBrands(brands);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importBrands();
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      refetchCounts();
      showSuccessToast(toast, `${successCount} brand berhasil diimpor`);
    } catch (e) {
      showErrorToast(toast, e);
    }
  };

  const handleAdd = () => {
    clearSelection();
    setData(null);
    setOpen(true, () => {
      refetch();
      refetchCounts();
    });
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
        header="BRAND"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Brand terpilih"
        onCancelSelectedItems={() => clearSelection()}
        action={
          <HStack space="sm" className="w-[72px]">
            {hasSelection ? (
              isBulkDeleting ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <PermissionGuard permissions="products:brands-delete">
                  <Pressable
                    className="p-6"
                    onPress={() => handleBulkDeleteWithCheck(selectedItems)}
                  >
                    <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                  </Pressable>
                </PermissionGuard>
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
        <VStack className="flex-1">
          <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama brand" />
            </Input>
          </HStack>
          <FlashList
            data={brands}
            className="flex-1"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(item) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(item);
                  } else {
                    router.push(
                      `/(main)/management/product-category-brand/brand/detail/${item.id}` as any,
                    );
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(item)}
              >
                <HStack className="justify-between items-center">
                  <VStack>
                    <Heading size="sm">{item.name}</Heading>
                    <HStack space="sm">
                      <Badge size="sm" variant="solid" action="muted">
                        <BadgeText className="text-xs">
                          Total Produk: {productCounts?.[item.id] || 0}
                        </BadgeText>
                      </Badge>
                    </HStack>
                  </VStack>
                  <VStack className="items-end">
                    <Text className="text-brand-primary text-sm font-bold">Nilai Modal</Text>
                    <Text size="xs">
                      Rp {(capitalValues?.[item.id] ?? 0).toLocaleString('id-ID')}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Tidak ada brand</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <PermissionGuard permissions="products:brands-create">
              <Button
                size="sm"
                className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAdd}
              >
                <ButtonText className="text-white">TAMBAH BRAND</ButtonText>
              </Button>
            </PermissionGuard>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
