import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import {
  Box,
  Heading,
  HStack,
  Spinner,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from '@/components/ui';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { useCategories, useCategory, useDeleteCategory } from '@/hooks/use-category';
import { showErrorToast } from '@/lib/utils/toast';
import {
  Product,
  useProductsByCategory,
  useUnassignProductsFromCategory,
} from '@/lib/api/products';
import { useCategoryStore } from '@/stores/category';
import { useDeleteEntity } from '@/hooks/use-delete-entity';
import { singleDeleteConfirm } from '@/lib/utils/delete-confirm';
import { useItemSelection } from '@/hooks/use-item-selection';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView } from 'react-native';

import { formatRp, formatNumber } from '@/lib/utils/format';
export default function CategoryDetail() {
  const { setOpen, setData } = useCategoryStore();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const categoryId = id as string;

  const {
    selectedItems: selectedProducts,
    handleItemPress,
    clearSelection: clearProductSelection,
    isSelected: isProductSelected,
    hasSelection: hasProductSelection,
  } = useItemSelection<Product>();

  const { refetch: refetchCategorys } = useCategories();
  const { data: category, refetch: refetchCategory } = useCategory(categoryId || '');
  const { data: products = [] } = useProductsByCategory(categoryId || '');
  const deleteMutation = useDeleteCategory();
  const unassignProductMutation = useUnassignProductsFromCategory();
  const toast = useToast();

  const totalModal = useMemo(() => {
    return products.reduce((acc, curr) => {
      return acc + (curr.purchasePrice || 0) * (curr.stock || 0);
    }, 0);
  }, [products]);

  const onRefetch = () => {
    refetchCategorys();
    refetchCategory();
  };

  const { triggerDelete } = useDeleteEntity({
    successMessage: 'Kategori berhasil dihapus',
    deleteMutation,
    onSuccess: onRefetch,
  });

  const handleDeleteProductPress = () => {
    const productIds = selectedProducts?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: `HAPUS PRODUK DARI ${category?.name?.toUpperCase() ?? ''}`,
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{productIds?.length}</Text>
          {` produk dari kategori ${category?.name}? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'HAPUS',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => {
        unassignProductMutation.mutate(
          productIds,
          {
            onSuccess: () => {
              hidePopUpConfirm();
              clearProductSelection();
              onRefetch();
              toast.show({
                placement: 'top',
                render: ({ id }) => (
                  <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                    <ToastTitle>Produk berhasil dihapus dari kategori</ToastTitle>
                  </Toast>
                ),
              });
            },
            onError: (error) => {
              showErrorToast(toast, error);
              hidePopUpConfirm();
            },
          },
        );
      },
      loading: unassignProductMutation.isPending,
    });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: 'Edit',
          icon: 'Pen',
          onPress: () => {
            setOpen(true);
            setData(category ?? null);
            hideActionDrawer();
          },
        },
        {
          label: 'Hapus',
          icon: 'TrashBin2',
          theme: 'red',
          onPress: () => {
            triggerDelete(singleDeleteConfirm('kategori', category?.id || '', category?.name));
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL KATEGORI"
        selectedItemsLength={selectedProducts?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={() => clearProductSelection()}
        action={
          hasProductSelection ? (
            unassignProductMutation.isPending ? (
              <Box className="p-6">
                <Spinner size="small" color="#FFFFFF" />
              </Box>
            ) : (
              <Pressable className="p-6" onPress={() => handleDeleteProductPress()}>
                <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
              </Pressable>
            )
          ) : (
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: '90deg' }] }}
              />
            </Pressable>
          )
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Nama Category</Text>
              <Text className="font-bold">{category?.name || '-'}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Total Produk</Text>
              <Text className="font-bold">{products.length}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Poin Retail</Text>
              <Text className="font-bold">{category?.retailPoint ?? 0}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Poin Grosir</Text>
              <Text className="font-bold">{category?.wholesalePoint ?? 0}</Text>
            </HStack>
            <HStack className="w-full flex-row justify-between">
              <Text className="font-bold text-gray-500">Nilai Modal</Text>
              <Text className="font-bold">Rp {formatNumber(totalModal)}</Text>
            </HStack>
          </Box>
          <Box className="pr-4">
            <VStack>
              {products?.map((product) => (
                <Pressable
                  key={product.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    isProductSelected(product) ? 'bg-gray-100' : ''
                  }`}
                  onPress={() => {
                    if (hasProductSelection) {
                      handleItemPress(product);
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
                        <Badge size="sm" variant="solid" action="muted">
                          <BadgeText className="text-xs">{`Harga Beli: Rp ${product.purchasePrice.toLocaleString(
                            'id-ID',
                          )}`}</BadgeText>
                        </Badge>
                      </VStack>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-primary-500 text-sm font-bold">{product.stock}</Text>
                      <Text className="text-xs">
                        Retail:{' '}
                        {`${
                          product.sellPrices?.filter((r) => r.type === 'RETAIL')?.[0]
                            ?.minimumPurchase
                        }@ ${formatRp(
                          product.sellPrices?.filter((r) => r.type === 'RETAIL')?.[0]?.price ?? 0,
                        )}`}
                      </Text>
                      {product.sellPrices?.filter((r) => r.type === 'WHOLESALE').length ? (
                        <Text className="text-xs">
                          Grosir:{' '}
                          {`${
                            product.sellPrices?.filter((r) => r.type === 'WHOLESALE')?.[0]
                              ?.minimumPurchase
                          }@ ${formatRp(
                            product.sellPrices?.filter((r) => r.type === 'WHOLESALE')?.[0]?.price ??
                              0,
                          )}`}
                        </Text>
                      ) : null}
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => {
            router.navigate(
              `/(main)/management/product-category-brand/category/select-product/${category?.id}`,
            );
            clearProductSelection();
          }}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            {`TAMBAHKAN PRODUK `}
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
