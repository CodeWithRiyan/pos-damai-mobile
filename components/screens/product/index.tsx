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
import { SolarIconBold, SolarIconLinear } from '@/components/ui/solar-icon-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { getErrorMessage } from '@/db/client';
import { useBulkDeleteEntity } from '@/hooks/use-bulk-delete-entity';
import { useCategories } from '@/hooks/use-category';
import { useItemSelection } from '@/hooks/use-item-selection';
import { usePermission } from '@/hooks/use-permission';
import {
  Product,
  ShowByStock,
  useBulkDeleteProduct,
  useCreateProduct,
  useProducts,
} from '@/hooks/use-product';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useProductStore } from '@/stores/product';
import { bulkDeleteConfirm } from '@/utils/delete-confirm';
import { exportProducts, importProducts } from '@/utils/excel';
import { showSuccessToast, showToast } from '@/utils/toast';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { debounce } from 'lodash';
import { SearchIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import ProductFilter from './filter';
import ProductNotification from './notification';

import { formatNumber, formatRp } from '@/utils/format';
export default function ProductList() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<ShowByStock>('ALL_STOCK');

  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [brandId, setBrandId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const activeFilterCount = [brandId, categoryId].filter(Boolean).length;

  const [search, setSearch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { data, isLoading, refetch } = useProducts({
    search: searchQuery,
    showByStock: stockFilter,
    brandId,
    categoryId,
    forceParent: true,
  });
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } =
    useItemSelection<Product>();

  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, 300),
    [],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSetSearch(value);
  };

  const handleVersionChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(useProductStore, handleVersionChange);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const products = data || [];

  const deleteMutation = useBulkDeleteProduct();
  const createMutation = useCreateProduct();
  const toast = useToast();

  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: 'Produk berhasil dihapus',
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportProducts(products);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importProducts(categories.map((c) => ({ id: c.id, name: c.name })));
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      showSuccessToast(toast, `${successCount} produk berhasil diimpor`);
    } catch (e) {
      showToast(toast, { action: 'error', message: getErrorMessage(e) });
    }
  };

  const handleAdd = () => {
    clearSelection();
    router.push('/(main)/management/product-category-brand/product/add');
  };

  const PopUp = () => {
    return (
      <>
        <ProductNotification
          open={openNotification}
          setOpen={setOpenNotification}
          value={stockFilter}
          onChange={(v) => setStockFilter(v as ShowByStock)}
        />
        <ProductFilter
          open={openFilter}
          setOpen={setOpenFilter}
          brandId={brandId || ''}
          setBrandId={setBrandId}
          categoryId={categoryId || ''}
          setCategoryId={setCategoryId}
        />
      </>
    );
  };

  return (
    <Box className="flex-1 bg-white">
      {isLoading && (
        <Box className="absolute inset-0 bg-black/40 justify-center items-center z-[100]">
          <Spinner size="large" />
        </Box>
      )}
      <Header
        header="PRODUK"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={clearSelection}
        action={
          hasSelection ? (
            isBulkDeleting ? (
              <Box className="p-6">
                <Spinner size="small" color="#FFFFFF" />
              </Box>
            ) : (
              <PermissionGuard permissions="products:delete">
                <Pressable
                  className="p-6"
                  onPress={() => triggerBulkDelete(bulkDeleteConfirm('produk', selectedItems))}
                >
                  <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                </Pressable>
              </PermissionGuard>
            )
          ) : hasPermission('products:export-import') ? (
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
          ) : null
        }
      />
      <Box className="flex-1 bg-white">
        <VStack className="flex-1">
          <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => setOpenNotification(true)}
            >
              <SolarIconLinear name="Bell" size={20} color="#3d2117" />
            </Pressable>
            <Pressable
              className="relative size-10 items-center justify-center"
              onPress={() => setOpenFilter(true)}
            >
              <SolarIconLinear name="Filter" size={20} color="#3d2117" />
              {!!activeFilterCount && (
                <Box className="absolute top-0 right-0 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <Text size="xs" className="text-white font-bold">
                    {activeFilterCount}
                  </Text>
                </Box>
              )}
            </Pressable>
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder="Cari nama atau kode"
                value={search}
                onChangeText={handleSearchChange} // ← Gunakan handler baru
              />
            </Input>
          </HStack>
          <FlashList
            data={products}
            className="flex-1"
            keyExtractor={(product) => product.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item: product }) => (
              <Pressable
                className={`p-4 rounded-lg border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(product) ? 'bg-gray-100' : ''
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(product);
                  } else {
                    router.push(
                      `/(main)/management/product-category-brand/product/detail/${encodeURIComponent(product.id)}` as any,
                    );
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(product)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="w-10 h-10 rounded-lg bg-primary-200 items-center justify-center">
                      <Text className="text-primary-500 font-bold">
                        {product.name.substring(0, 1).toUpperCase()}
                      </Text>
                    </Box>
                    <VStack>
                      <Heading size="sm">{product.name}</Heading>
                      <Text size="xs" className="text-slate-500">
                        {product.code}
                      </Text>
                      <HStack>
                        <Badge size="sm" variant="solid" action="muted">
                          <BadgeText className="text-xs">{`Harga Beli: ${formatRp(product.purchasePrice ?? 0)}`}</BadgeText>
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <Text className="text-brand-primary text-sm font-bold">
                      Stok: {product.stock ?? 0}
                    </Text>
                    <Text className="text-xs">
                      Retail:{' '}
                      {`${
                        product.sellPrices?.filter((r) => r.type === 'RETAIL')?.[0]
                          ?.minimumPurchase ?? 0
                      }@ Rp ${formatNumber(
                        product.sellPrices?.filter((r) => r.type === 'RETAIL')?.[0]?.price ?? 0,
                      )}`}
                    </Text>
                    {!!product.sellPrices?.filter((r) => r.type === 'WHOLESALE').length && (
                      <Text className="text-xs">
                        Grosir:{' '}
                        {`${
                          product.sellPrices?.filter((r) => r.type === 'WHOLESALE')?.[0]
                            ?.minimumPurchase ?? 0
                        }@ Rp ${formatNumber(
                          product.sellPrices?.filter((r) => r.type === 'WHOLESALE')?.[0]?.price ??
                            0,
                        )}`}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Belum ada produk</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <PermissionGuard permissions="products:create">
              <Button
                size="sm"
                className="w-full rounded-lg bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAdd}
              >
                <ButtonText className="text-white">{`TAMBAH PRODUK `}</ButtonText>
              </Button>
            </PermissionGuard>
          </HStack>
        </VStack>
      </Box>
      <PopUp />
    </Box>
  );
}
