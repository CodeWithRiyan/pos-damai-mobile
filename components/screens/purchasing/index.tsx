import Header from '@/components/header';
import {
  Heading,
  Icon,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconBold, SolarIconLinear } from '@/components/ui/solar-icon-wrapper';
import { VStack } from '@/components/ui/vstack';
// import { useBulkDeletePurchasing, Purchasing, usePurchasing } from "@/hooks/use-purchasing";
import { ShowByStock, useProducts } from '@/hooks/use-product';
import { useStoreVersionSync } from '@/hooks/use-store-version-sync';
import { useProductStore } from '@/stores/product';
import { usePurchasingStore } from '@/stores/purchasing';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import ProductNotification from '../product/notification';
import PurchasingFilter from './filter';
import PopupAddProduct from './popup-add';

import { Status } from '@/constants';
import { formatNumber, formatRp } from '@/utils/format';
export default function PurchasingList() {
  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [stockFilter, setStockFilter] = useState<ShowByStock>('ALL_STOCK');

  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [supplierId, setSupplierId] = useState<string>('');
  const activeFilterCount = [supplierId].filter(Boolean).length;

  const { cart, setAddProduct, setStatus } = usePurchasingStore();
  const { data: products, refetch } = useProducts({
    supplierId,
    showByStock: stockFilter,
    forceParent: true,
  });
  const router = useRouter();

  const handleVersionChange = React.useCallback(() => {
    refetch();
  }, [refetch]);

  useStoreVersionSync(useProductStore, handleVersionChange);

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="PEMBELIAN BARANG"
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.push('/(main)/purchasing/draft')}
            >
              <SolarIconBold name="ClipboardList" size={20} color="#FDFBF9" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.push('/(main)/purchasing/history')}
            >
              <SolarIconBold name="History" size={20} color="#FDFBF9" />
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
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
              <InputField placeholder="Cari nama atau kode" />
            </Input>
          </HStack>
          <FlashList
            data={products}
            className="flex-1"
            keyExtractor={(product) => product.id}
            ListHeaderComponent={
              <VStack className="p-4">
                <Pressable
                  className="w-full rounded-md h-10 flex-row justify-center items-center gap-4 bg-primary-100 border border-primary-500 active:bg-primary-200"
                  onPress={() =>
                    router.push('/(main)/management/product-category-brand/product/add')
                  }
                >
                  <Icon as={Plus} size="sm" color="#3d2117" />
                  <Text size="sm" className="text-brand-primary font-bold">
                    Tambah Barang
                  </Text>
                </Pressable>
              </VStack>
            }
            renderItem={({ item: product }) => (
              <Pressable
                className="px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                onPress={() => setAddProduct(product)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                      <Heading className="text-primary-500 font-bold">
                        {product.name.charAt(0).toUpperCase()}
                      </Heading>
                    </Box>
                    <VStack className="flex-1">
                      <Heading size="md" className="line-clamp-2">
                        {product.name}
                      </Heading>
                      <Text size="sm" className="text-slate-500">
                        {formatRp(product.purchasePrice)}
                      </Text>
                    </VStack>
                    <HStack space="sm">
                      <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                        <Text className="font-bold">
                          {cart?.find((f) => f.product.id === product.id)?.quantity || 0}
                        </Text>
                      </Box>
                      <Box className="h-10 min-w-10 items-center justify-center bg-primary-500 px-2 rounded-lg">
                        <Text className="text-typography-0 font-bold">{product.stock}</Text>
                      </Box>
                    </HStack>
                  </HStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Belum ada produk</Text>
              </Box>
            }
          />
        </VStack>
        <VStack space="lg" className="flex-1">
          <FlashList
            data={cart}
            className="flex-1"
            keyExtractor={(item) => item.product.id}
            renderItem={({ item, index }) => (
              <Pressable
                className="px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                onPress={() => setAddProduct(item.product)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    <Box className="size-6 justify-center items-center">
                      <Heading size="md">{index + 1}</Heading>
                    </Box>
                    <VStack className="flex-1">
                      <Heading size="md" className="line-clamp-2">
                        {item.product.name}
                      </Heading>
                      <Text size="sm" className="text-slate-500">
                        {item.quantity} x Rp {formatNumber(item.newPurchasePrice)} = Rp{' '}
                        {formatNumber(item.quantity * item.newPurchasePrice)}
                      </Text>
                      {item.note ? (
                        <Text size="sm" className="text-slate-500">
                          {item.note}
                        </Text>
                      ) : null}
                    </VStack>
                    <HStack space="sm">
                      <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                        <Text className="font-bold">{item.quantity}</Text>
                      </Box>
                    </HStack>
                  </HStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Belum ada barang di keranjang</Text>
              </Box>
            }
          />
          {!!cart.length && (
            <HStack space="md" className="w-full p-4">
              <Pressable
                className="flex-1 flex-row items-center justify-between h-16 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
                onPress={() => {
                  router.push('/(main)/purchasing/checkout');
                  setStatus(Status.COMPLETED);
                }}
              >
                <HStack space="md" className="items-center">
                  <Text size="4xl" className="text-white font-bold">
                    {formatNumber(cart.reduce((total, item) => total + item.quantity, 0))}
                  </Text>
                  <Text size="lg" className="text-white font-bold">
                    ITEM
                  </Text>
                </HStack>
                <Text size="lg" className="text-white font-bold">
                  LANJUT
                </Text>
              </Pressable>
              <Pressable
                className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                onPress={() => {
                  router.push('/(main)/purchasing/checkout');
                  setStatus(Status.DRAFT);
                }}
              >
                <SolarIconBold name="ClipboardAdd" size={32} color="#3d2117" />
              </Pressable>
            </HStack>
          )}
        </VStack>
      </HStack>
      <PopupAddProduct />
      <ProductNotification
        open={openNotification}
        setOpen={setOpenNotification}
        value={stockFilter}
        onChange={(v) => setStockFilter(v as ShowByStock)}
      />
      <PurchasingFilter
        open={openFilter}
        setOpen={setOpenFilter}
        supplierId={supplierId}
        setSupplierId={setSupplierId}
      />
    </Box>
  );
}
