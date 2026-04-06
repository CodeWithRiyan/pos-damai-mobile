import Header from '@/components/header';
import { Checkbox, CheckboxIcon, CheckboxIndicator, Spinner } from '@/components/ui';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ProductListItem, useProducts } from '@/hooks/use-product';
import { CheckIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';

export default function SelectingProductList({
  usedFor: _usedFor,
  header,
  selectedItems,
  isLoading,
  onSubmit,
}: {
  usedFor: 'brand' | 'category' | 'supplier';
  header: string;
  selectedItems?: ProductListItem[];
  isLoading?: boolean;
  onSubmit?: (value: ProductListItem[]) => void;
}) {
  // Track only user overrides — derive checked state from selectedItems + overrides
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const isSelected = useCallback(
    (productId: string) => {
      const hasOverride = productId in overrides;
      if (hasOverride) return overrides[productId];
      return selectedItems?.some((r) => r.id === productId) ?? false;
    },
    [selectedItems, overrides],
  );

  const { data } = useProducts({
    forceParent: true,
  });
  const products = data || [];

  const selectedProducts = useMemo(() => {
    const result: ProductListItem[] = [];

    products.forEach((p) => {
      const currentlySelected = isSelected(p.id);
      if (currentlySelected) {
        result.push(p);
      }
    });

    return result;
  }, [products, isSelected]);

  const handlePress = (item: ProductListItem) => {
    setOverrides((prev) => ({
      ...prev,
      [item.id]: !isSelected(item.id),
    }));
  };

  const handleCancel = () => {
    // Deselect all: override initially-selected items to false, clear user additions
    const newOverrides: Record<string, boolean> = {};
    selectedItems?.forEach((item) => {
      newOverrides[item.id] = false;
    });
    setOverrides(newOverrides);
  };

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={header}
        isGoBack
        selectedItemsLength={selectedProducts.length}
        selectedItemsSuffixLabel="Produk terpilih"
        selectedItemsPosition="right"
        onCancelSelectedItems={handleCancel}
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <FlashList
            data={products}
            className="flex-1"
            keyExtractor={(product) => product.id}
            renderItem={({ item: product }) => {
              const checked = isSelected(product.id);
              return (
                <Pressable
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    checked ? 'bg-gray-100' : ''
                  }`}
                  onPress={() => handlePress(product)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Checkbox value={product.id} isChecked={checked} size="md" onChange={() => handlePress(product)}>
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                      </Checkbox>
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
                      </VStack>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        Stok: {product.stock ?? 0}
                      </Text>
                    </VStack>
                  </HStack>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">No products found</Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <Pressable
              className="w-full flex px-4 h-10 items-center justify-center rounded-sm bg-primary-500 active:bg-primary-500/90"
              onPress={() => onSubmit?.(selectedProducts)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" className="text-typography-0 font-bold">
                  SIMPAN
                </Text>
              )}
            </Pressable>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
