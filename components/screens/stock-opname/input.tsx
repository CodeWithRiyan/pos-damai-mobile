import Header from '@/components/header';
import {
  Heading,
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
import { VStack } from '@/components/ui/vstack';
// import { useBulkDeleteStockOpname, StockOpname, useStockOpname } from "@/hooks/use-purchasing";
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { ProductType } from '@/constants';
import { useProducts } from '@/hooks/use-product';
import { useStockOpnameStore } from '@/stores/stock-opname';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlashList } from '@shopify/flash-list';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import StockOpnameConfirmForm from './form';
import PopupAddStockOpname from './popup-add';

export default function StockOpnameInput() {
  const [deleteItem, setDeleteItem] = useState<string | null>(null);
  const { cart, resetCart, setAddProduct, setOpenConfirm, removeCartItem } = useStockOpnameStore();
  const { data: products } = useProducts({
    forceParent: true,
  });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isDirty = !!cart.length;

  const unifiedCart = React.useMemo(() => {
    const grouped = new Map<
      string,
      {
        product: (typeof cart)[0]['product'];
        physicalStockByVariant: Map<string, number>;
        totalPhysicalStock: number;
      }
    >();

    for (const item of cart) {
      const key = item.product.id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          product: item.product,
          physicalStockByVariant: new Map(),
          totalPhysicalStock: 0,
        });
      }
      const existing = grouped.get(key)!;
      const variantKey = item.variant?.id || 'default';
      const currentQty = existing.physicalStockByVariant.get(variantKey) || 0;
      existing.physicalStockByVariant.set(variantKey, currentQty + item.physicalStock);

      if (item.product.type === ProductType.MULTIUNIT && item.variant) {
        existing.totalPhysicalStock += item.physicalStock * (item.variant.netto || 1);
      } else {
        existing.totalPhysicalStock += item.physicalStock;
      }
    }

    return Array.from(grouped.values());
  }, [cart]);

  const onDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="INPUT BARANG"
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
          <HStack space="sm" className="p-4 shadow-lg bg-background-0 items-center justify-between">
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama atau kode" />
            </Input>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center h-10 px-3 border border-background-300 rounded-lg bg-background-0"
            >
              <Calendar size={20} color="#64748B" />
              <Text className="ml-2 text-slate-600">{dayjs(date).format('DD MMM YYYY')}</Text>
            </Pressable>
          </HStack>
          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
          )}
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {products?.map((product, index) => (
                <Pressable
                  key={index}
                  className="px-4 py-2 rounded-lg border-b border-gray-300 active:bg-gray-100"
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
                          {product.code}
                        </Text>
                      </VStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </ScrollView>
        </VStack>
        <VStack space="lg" className="flex-1">
          <FlashList
            data={unifiedCart}
            className="flex-1"
            keyExtractor={(item) => item.product.id}
            renderItem={({ item, index }) => (
              <Pressable
                className="relative px-4 py-2 rounded-lg border-b border-gray-300 active:bg-gray-100"
                onPress={() => {
                  setAddProduct(item.product);
                  setDeleteItem(null);
                }}
                onLongPress={() => {
                  if (deleteItem === item.product.id) {
                    setDeleteItem(null);
                    return;
                  }
                  setDeleteItem(item.product.id);
                }}
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
                        {item.product.code}
                      </Text>
                    </VStack>
                    <HStack space="sm">
                      <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
                        <Text className="font-bold">{item.totalPhysicalStock}</Text>
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
                    removeCartItem(item.product.id);
                    setDeleteItem(null);
                  }}
                >
                  <SolarIconBold name="TrashBin2" size={20} color="white" />
                </Pressable>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">Belum ada barang di keranjang</Text>
              </Box>
            }
          />
          {!!unifiedCart.length && (
            <HStack space="md" className="w-full p-4">
              <Pressable
                className="flex-1 flex-row items-center justify-center h-16 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
                onPress={() => setOpenConfirm(true)}
              >
                <Text size="lg" className="text-white font-bold">
                  SIMPAN STOCK OPNAME
                </Text>
              </Pressable>
            </HStack>
          )}
        </VStack>
      </HStack>
      <PopupAddStockOpname />
      <StockOpnameConfirmForm date={date} />
    </Box>
  );
}
