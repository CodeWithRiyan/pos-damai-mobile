import { useCallback, useState } from 'react';
import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { usePopUpConfirm } from '@/components/pop-up-confirm';
import {
  Badge,
  BadgeText,
  Box,
  Heading,
  HStack,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import {
  Product,
  useProductsBySupplier,
  useUnassignProductsFromSupplier,
} from '@/hooks/use-product';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import {
  useDeleteSupplier,
  useSuppliers,
  refetchSupplierById,
  Supplier,
} from '@/hooks/use-supplier';
import { useDeleteEntity } from '@/hooks/use-delete-entity';
import { singleDeleteConfirm } from '@/utils/delete-confirm';
import { useItemSelection } from '@/hooks/use-item-selection';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useSupplierStore } from '@/stores/supplier';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ScrollView } from 'react-native';

import { formatRp } from '@/utils/format';
export default function SupplierDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const supplierId = id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const {
    selectedItems: selectedProducts,
    handleItemPress,
    clearSelection: clearProductSelection,
    isSelected: isProductSelected,
    hasSelection: hasProductSelection,
  } = useItemSelection<Product>();

  const { refetch: refetchSuppliers } = useSuppliers();
  const { data: products = [] } = useProductsBySupplier(supplierId || '');
  const deleteMutation = useDeleteSupplier();
  const unassignProductMutation = useUnassignProductsFromSupplier();
  const toast = useToast();

  const onRefetch = useCallback(async () => {
    if (supplierId) {
      const freshSupplier = await refetchSupplierById(supplierId);
      setSupplier(freshSupplier);
    }
    refetchSuppliers();
  }, [supplierId, refetchSuppliers]);

  useStoreVersionSync(useSupplierStore, onRefetch);

  useFocusEffect(
    useCallback(() => {
      onRefetch();
    }, [onRefetch]),
  );

  const { triggerDelete } = useDeleteEntity({
    successMessage: 'Supplier berhasil dihapus',
    deleteMutation,
    onSuccess: onRefetch,
  });

  const handleDeleteProductPress = () => {
    const productIds = selectedProducts?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: `HAPUS PRODUK DARI ${supplier?.name?.toUpperCase() ?? ''}`,
      icon: 'warning',
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{productIds?.length}</Text>
          {` produk dari supplier ${supplier?.name}? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: 'HAPUS',
      closeText: 'BATAL',
      okVariant: 'destructive',
      onOk: () => {
        unassignProductMutation.mutate(productIds, {
          onSuccess: () => {
            hidePopUpConfirm();
            clearProductSelection();
            onRefetch();
            showSuccessToast(toast, 'Produk berhasil dihapus dari supplier');
          },
          onError: (error) => {
            showErrorToast(toast, error);
            hidePopUpConfirm();
          },
        });
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
            router.navigate(`/(main)/management/customer-supplier/supplier/edit/${supplier?.id}`);
            hideActionDrawer();
          },
        },
        {
          label: 'Hapus',
          icon: 'TrashBin2',
          theme: 'red',
          onPress: () => {
            triggerDelete(singleDeleteConfirm('supplier', supplier?.id || '', supplier?.name));
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL SUPPLIER"
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
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Name</Text>
              <Text className="font-bold">{supplier?.name || '-'}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">No. Handphone</Text>
              <Text className="font-bold">{supplier?.phone || '-'}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Alamat</Text>
              <Text className="font-bold">{supplier?.address || '-'}</Text>
            </VStack>
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
        <HStack space="md">
          <Pressable
            className="flex-1 rounded-sm h-10 flex justify-center items-center bg-background-0 border border-primary-500"
            onPress={() => {
              router.push(`/(main)/management/customer-supplier/supplier/purchasing/${supplierId}`);
            }}
          >
            <Text size="sm" className="text-brand-primary font-bold">
              RIWAYAT TRANSAKSI
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-sm h-10 flex justify-center items-center bg-background-0 border border-primary-500"
            onPress={() => {
              router.push(`/(main)/management/customer-supplier/supplier/payable/${supplierId}`);
            }}
          >
            <Text size="sm" className="text-brand-primary font-bold">
              RIWAYAT HUTANG
            </Text>
          </Pressable>
        </HStack>
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => {
            router.navigate(
              `/(main)/management/customer-supplier/supplier/select-product/${supplierId}`,
            );
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
