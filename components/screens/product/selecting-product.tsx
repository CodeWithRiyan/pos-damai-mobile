import Header from "@/components/header";
import { Checkbox, CheckboxIcon, CheckboxIndicator } from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { ProductListItem, useProducts } from "@/lib/api/products";
import { CheckIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function SelectingProductList({
  usedFor,
  header,
  selectedItems,
  onSubmit,
}: {
  usedFor: "brand" | "category" | "supplier";
  header: string;
  selectedItems?: ProductListItem[];
  onSubmit?: (value: ProductListItem[]) => void;
}) {
  const [newSelectedItems, setNewSelectedItems] = useState<ProductListItem[]>(
    selectedItems || [],
  );

  const { data } = useProducts();
  const products = data || [];
  const filteredProduct =
    usedFor === "brand"
      ? products.filter(
          (p) =>
            selectedItems?.some((r) => r.brandId === p.brandId) || !p.brandId,
        )
      : usedFor === "category"
        ? products.filter(
            (p) =>
              selectedItems?.some((r) => r.categoryId === p.categoryId) ||
              !p.categoryId,
          )
        : products;

  const handlePress = (item: ProductListItem) => {
    if (newSelectedItems.some((r) => r.id === item.id)) {
      setNewSelectedItems(newSelectedItems.filter((r) => r.id !== item.id));
      return;
    }
    if (!newSelectedItems) {
      setNewSelectedItems([item]);
      return;
    }

    setNewSelectedItems([...newSelectedItems, item]);
  };

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={header}
        isGoBack
        selectedItemsLength={newSelectedItems.length}
        selectedItemsSuffixLabel="Produk terpilih"
        selectedItemsPosition="right"
        onCancelSelectedItems={() => setNewSelectedItems([])}
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {filteredProduct?.map((product) => (
                <Pressable
                  key={product.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    newSelectedItems.some((r) => r.id === product.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => handlePress(product)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Checkbox
                        value={newSelectedItems
                          .some((r) => r.id === product.id)
                          .toString()}
                        isChecked={newSelectedItems.some(
                          (r) => r.id === product.id,
                        )}
                        size="md"
                      >
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
              ))}
              {products?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    No products found
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={() => onSubmit?.(newSelectedItems || [])}
            >
              <ButtonText className="text-white">SIMPAN</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
