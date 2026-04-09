import Header from '@/components/header';
import {
  Heading,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
  Text,
  VStack,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { usePurchasedProducts } from '@/hooks/use-transaction';
import { useReturnTransactionStore } from '@/stores/return-transaction';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import ReturnTransactionConfirmForm from './form';
import PopupAddProduct from './popup-add';

import GridProductLayout from '@/components/ui/layout/grid-product-layout';
import ListProductLayout from '@/components/ui/layout/list-product-layout';
import { SolarIconBold, SolarIconOutline } from '@/components/ui/solar-icon-wrapper';
import { ProductType } from '@/constants';
import { formatNumber } from '@/utils/format';
import classNames from 'classnames';
import { LayoutChangeEvent } from 'react-native';
export default function ReturnTransactionInput() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const {
    cart: _cart,
    setAddProduct,
    setOpenConfirm,
    removeCartItem,
    resetCart,
  } = useReturnTransactionStore();
  const cart = _cart ?? [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_search, setSearch] = useState<string>('');
  const { data: products = [] } = usePurchasedProducts(customerId!);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [deviceWidth, setDeviceWidth] = useState<number>(0);
  const [deleteItem, setDeleteItem] = useState<string | null>(null);

  const isDirty = !!cart.length;
  const numColumns = deviceWidth < 600 ? 2 : deviceWidth < 1080 ? 3 : 4;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setDeviceWidth(width);
  };

  return (
    <Box className="flex-1 bg-white" onLayout={handleLayout}>
      <Header
        header="RETUR TRANSAKSI PENJUALAN"
        isGoBack
        action={
          isDirty && (
            <HStack space="sm" className="pr-4">
              <Pressable
                className="size-10 items-center justify-center"
                onPress={() => {
                  resetCart();
                }}
              >
                <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
              </Pressable>
            </HStack>
          )
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center">
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama atau kode" onChangeText={setSearch} />
            </Input>
            <Pressable
              className="relative size-10 items-center justify-center text-typography-500"
              onPress={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
            >
              <SolarIconOutline
                name={layout === 'grid' ? 'Widget' : 'Server'}
                size={20}
                color="#6b7280"
              />
            </Pressable>
          </HStack>
          {layout === 'grid' ? (
            <FlashList
              key={`grid-${numColumns}`}
              data={products}
              className="flex-1"
              numColumns={numColumns}
              contentContainerStyle={{ padding: 16, gap: 16 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item: product }) => {
                return (
                  <Box className="flex-1 px-1">
                    <GridProductLayout
                      name={product.name}
                      price={product.lastSellPrice ?? product.sellPrices?.[0]?.price ?? 0}
                      onPressProduct={() => setAddProduct(product)}
                    />
                  </Box>
                );
              }}
              ListEmptyComponent={
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    Tidak ada produk yang dibeli dari customer ini
                  </Text>
                </Box>
              }
            />
          ) : (
            <FlashList
              key="list"
              data={products}
              className="flex-1"
              keyExtractor={(item) => item.id}
              renderItem={({ item: product }) => {
                return (
                  <ListProductLayout
                    name={product.name}
                    price={product.lastSellPrice ?? product.sellPrices?.[0]?.price ?? 0}
                    onPressProduct={() => setAddProduct(product)}
                  />
                );
              }}
              ListEmptyComponent={
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    Tidak ada produk yang dibeli dari customer ini
                  </Text>
                </Box>
              }
            />
          )}
        </VStack>
        <VStack space="lg" className="flex-1">
          <FlashList
            data={cart}
            className="flex-1"
            keyExtractor={(item, index) => `${item.product.id}-${item.variant?.id || ''}-${index}`}
            renderItem={({ item, index }) => {
              const sellPrice = item.sellPrice;

              return (
                <Pressable
                  className="relative px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
                  onPress={() => {
                    setAddProduct(item.product, item.variant?.id);
                    setDeleteItem(null);
                  }}
                  onLongPress={() => {
                    const newDeleteItem =
                      item.product.type === ProductType.MULTIUNIT
                        ? item.variant?.id || ''
                        : item.product.id;

                    if (deleteItem === newDeleteItem) {
                      setDeleteItem(null);
                      return;
                    }
                    setDeleteItem(newDeleteItem);
                  }}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="size-6 justify-center items-center">
                        <Heading size="md">{index + 1}</Heading>
                      </Box>
                      <VStack className="flex-1">
                        <Heading size="md" className="line-clamp-2">
                          {item.variant && item.product.type === ProductType.MULTIUNIT
                            ? `${item.product.name} - ${item.variant.name}`
                            : item.product.name}
                        </Heading>
                        <Text size="sm" className="text-slate-500">
                          {item.quantity} x Rp {formatNumber(sellPrice)} = Rp{' '}
                          {formatNumber(item.quantity * sellPrice)}
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
                  <Pressable
                    className={classNames(
                      'absolute right-0 top-0 bottom-0 w-0 bg-error-500 items-center justify-center overflow-hidden transaction-all duration-300',
                      deleteItem === item.product.id && 'w-16',
                    )}
                    onPress={() => {
                      removeCartItem(item.product?.id || '');
                      setDeleteItem(null);
                    }}
                  >
                    <SolarIconBold name="TrashBin2" size={20} color="white" />
                  </Pressable>
                </Pressable>
              );
            }}
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
                onPress={() => setOpenConfirm(true)}
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
            </HStack>
          )}
        </VStack>
      </HStack>
      <PopupAddProduct />
      <ReturnTransactionConfirmForm />
    </Box>
  );
}
