import { useActionDrawer } from '@/components/action-drawer';
import Header from '@/components/header';
import { HStack, Text, VStack } from '@/components/ui';
import { Grid, GridItem } from '@/components/ui/grid';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { PriceType, ProductType } from '@/constants';
import { useDeleteEntity } from '@/hooks/use-delete-entity';
import { Product, refetchProductById, useDeleteProduct, useProducts } from '@/hooks/use-product';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useProductStore } from '@/stores/product';
import { singleDeleteConfirm } from '@/utils/delete-confirm';
import { findSellPrice } from '@/utils/price';
import { unitSuffixHelper } from '@/utils/unit';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { formatRp } from '@/utils/format';
export default function ProductDetail() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = decodeURIComponent(id as string);
  const { refetch: refetchProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const deleteMutation = useDeleteProduct();

  const onRefetch = useCallback(async () => {
    if (productId) {
      const freshProduct = await refetchProductById(productId);
      setProduct(freshProduct);
    }
    refetchProducts();
  }, [productId, refetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefetch();
    setRefreshing(false);
  }, [onRefetch]);

  useStoreVersionSync(useProductStore, onRefetch);

  const { triggerDelete } = useDeleteEntity({
    successMessage: 'Produk berhasil dihapus',
    deleteMutation,
    onSuccess: () => {
      useProductStore.getState().incrementVersion();
      onRefetch();
    },
  });

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: 'Log Produk',
          icon: 'ClipboardList',
          onPress: () => {
            router.push(`/(main)/management/product-category-brand/product/log/${productId}`);
            hideActionDrawer();
          },
        },
        {
          label: 'Lihat Daftar Supplier',
          icon: 'UsersGroupRounded',
          onPress: () => {
            router.push(`/(main)/management/product-category-brand/product/suppliers/${productId}`);
            hideActionDrawer();
          },
        },
        {
          label: 'Hapus',
          icon: 'TrashBin2',
          theme: 'red',
          onPress: () => {
            hideActionDrawer();
            triggerDelete(singleDeleteConfirm('produk', productId, product?.name));
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL PRODUK"
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VStack>
          <VStack className="w-full p-4 border-b border-background-300">
            <Text size="xl" className="font-bold">
              {product?.name}
            </Text>
            <Text className="text-gray-500">{product?.code || '-'}</Text>
          </VStack>
          <Grid
            _extra={{ className: 'grid-cols-2' }}
            className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300"
          >
            {/* Stok Terkini - Highlighted */}
            <GridItem
              _extra={{ className: 'col-span-2' }}
              className="mb-2 p-3 bg-primary-50 border border-primary-200 rounded-md"
            >
              <Text className="text-primary-600 text-sm">Stok Terkini</Text>
              <Text className="font-bold text-2xl text-primary-700">
                {product?.stock ?? 0} {product?.unit || 'pcs'}
              </Text>
            </GridItem>

            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Jenis Produk</Text>
              <Text className="font-bold">{product?.type || '-'}</Text>
            </GridItem>
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Harga Beli</Text>
              <Text className="font-bold">{formatRp(product?.purchasePrice ?? 0)}</Text>
            </GridItem>
            {product?.unit ? (
              <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
                <Text className="text-gray-500">Satuan</Text>
                <Text className="font-bold">{product?.unit}</Text>
              </GridItem>
            ) : null}
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Kategori</Text>
              <Text className="font-bold">{product?.category?.name || '-'}</Text>
            </GridItem>
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Brand</Text>
              <Text className="font-bold">{product?.brand?.name || '-'}</Text>
            </GridItem>
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Diskon</Text>
              <Text className="font-bold">{product?.discount?.name || '-'}</Text>
            </GridItem>
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Minimum Stok</Text>
              <Text className="font-bold">{product?.minimumStock || '-'}</Text>
            </GridItem>
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Status</Text>
              <Text className="font-bold">
                {product?.isActive ? 'Tampil di transaksi' : 'Tidak tampil di transaksi'}
              </Text>
            </GridItem>
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Keterangan</Text>
              <Text className="font-bold">{product?.description || '-'}</Text>
            </GridItem>
            {product?.type === ProductType.VARIANTS && (
              <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
                <Text className="text-gray-500">Varian Barcode</Text>
                {!!product?.variants.length ? (
                  product?.variants.map((variant, index) => (
                    <Text key={index} className="font-bold">
                      {variant.code}
                    </Text>
                  ))
                ) : (
                  <Text className="font-bold">-</Text>
                )}
              </GridItem>
            )}
            <GridItem _extra={{ className: 'col-span-1' }} className="pr-4">
              <Text className="text-gray-500">Perkiraan Keuntungan</Text>
              <Text className="text-success-500 font-bold">
                {formatRp(
                  findSellPrice({
                    sellPrices: product?.sellPrices,
                    type: PriceType.RETAIL,
                    quantity: 1,
                    unitVariant:
                      product?.type === ProductType.MULTIUNIT
                        ? product?.variants.find((v) => v.netto === 1)
                        : undefined,
                  }) - (product?.purchasePrice || 0),
                )}
              </Text>
            </GridItem>
          </Grid>
          {!!product?.sellPrices.length && (
            <VStack space="md" className="p-10 pt-4">
              <Text className="font-bold text-center">List Harga</Text>
              <Grid
                _extra={{ className: 'grid-cols-2' }}
                className="border border-background-200 rounded-md shadow bg-info-50 p-4 gap-4"
              >
                <GridItem
                  _extra={{
                    className: !!product?.sellPrices.filter((f) => f.type === PriceType.WHOLESALE)
                      .length
                      ? 'col-span-1'
                      : 'col-span-2',
                  }}
                  className="items-center"
                >
                  <Text className="font-bold pb-2">Harga Retail</Text>
                  {product?.sellPrices
                    .filter((f) => f.type === PriceType.RETAIL)
                    .sort((a, b) => b.price - a.price)
                    ?.map((price, index) => (
                      <Text key={index}>{`${
                        product.type === ProductType.MULTIUNIT
                          ? `${product.variants.find((f) => f.name === price.label)?.netto || 0} ${unitSuffixHelper(product.unit)}`
                          : `${price.minimumPurchase}@`
                      } ${formatRp(price.price)}`}</Text>
                    ))}
                </GridItem>
                {!!product?.sellPrices.filter((f) => f.type === PriceType.WHOLESALE).length && (
                  <GridItem _extra={{ className: 'col-span-1' }} className="items-center">
                    <Text className="font-bold pb-2">{`Harga Grosir${product.type === ProductType.MULTIUNIT ? ` (1 ${unitSuffixHelper(product.unit)})` : ''}`}</Text>
                    {product?.sellPrices
                      .filter((f) => f.type === PriceType.WHOLESALE)
                      ?.map((price, index) => (
                        <Text key={index}>{`${
                          price.minimumPurchase
                        }@ ${formatRp(price.price)}`}</Text>
                      ))}
                  </GridItem>
                )}
              </Grid>
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-lg h-10 flex justify-center items-center bg-background-0 border border-brand-primary"
          onPress={() => {
            router.push(`/(main)/management/product-category-brand/product/edit/${product?.id}`);
          }}
        >
          <Text size="sm" className="text-brand-primary font-bold">
            EDIT PRODUK
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
